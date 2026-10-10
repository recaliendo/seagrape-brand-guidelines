// Local preview server: builds the site, serves dist/, and runs the real inquiry handler at /api/inquiry.
//   npm run dev        uses provider settings from .env (no settings = the form reports "not connected")
//   npm run dev:mock   fakes a successful email provider so you can preview the success flow; nothing is sent
//   npm run dev:samples  also shows clearly labeled sample reviews to preview the testimonials layout
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "./build.mjs";
import { createInquiryHandler } from "../lib/inquiry/handler.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 8888;
const MOCK = process.argv.includes("--mock");

function loadEnv() {
  const file = join(ROOT, ".env");
  if (!existsSync(file)) return {};
  const env = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

let env = { ...loadEnv(), ...process.env };
let fetchImpl = fetch;
if (MOCK) {
  env = { ...env, RESEND_API_KEY: "mock", INQUIRY_TO_EMAIL: "owner@example.com", INQUIRY_FROM_EMAIL: "site@example.com" };
  fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    console.log(`[mock] would send email "${body.subject}" to ${body.to.join(", ")}`);
    return new Response(JSON.stringify({ id: "mock" }), { status: 200 });
  };
}

const handler = createInquiryHandler({ env, fetchImpl });
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".txt": "text/plain", ".xml": "application/xml" };

const SAMPLES = process.argv.includes("--sample-reviews");
await build({ sampleReviews: SAMPLES });

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === "/api/inquiry") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const request = new Request(url, { method: req.method, headers: req.headers, body: req.method === "POST" ? Buffer.concat(chunks) : undefined });
      const response = await handler(request, { ip: req.socket.remoteAddress });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    let file = normalize(join(DIST, decodeURIComponent(url.pathname)));
    if (!file.startsWith(DIST)) throw new Error("bad path");
    if (existsSync(file) && (await stat(file)).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) {
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      res.end(await readFile(join(DIST, "404.html")));
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(await readFile(file));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server error");
    console.error(err);
  }
}).listen(PORT, () => {
  console.log(`\nPreview: http://localhost:${PORT}${MOCK ? "  (mock email provider: nothing is sent)" : ""}`);
});
