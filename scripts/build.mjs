// Static site build: content/*.json + src/templates → dist/
// No dependencies. Run with `npm run build`.

import { mkdir, readFile, writeFile, rm, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { layout } from "../src/templates/layout.mjs";
import * as pages from "../src/templates/pages.mjs";
import { renderIllustrations, ILLUSTRATION_SIZES } from "../src/build/illustrations.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 10);
const readJson = async (p) => JSON.parse(await readFile(join(ROOT, p), "utf8"));

/** Reads `--name: value;` pairs from tokens.css so other code can reuse brand values. */
export function parseTokens(css) {
  const out = {};
  for (const m of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const minifyCss = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*\n\s*/g, "\n").replace(/\n{2,}/g, "\n").trim();

const INLINE_JS = 'document.documentElement.classList.add("js")';

function securityHeaders() {
  const sha = createHash("sha256").update(INLINE_JS).digest("base64");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'sha256-${sha}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");
  return `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  X-Frame-Options: DENY

/css/*
  Cache-Control: public, max-age=31536000, immutable
/img/art/*
  Cache-Control: public, max-age=86400
`;
}

export async function build({ outDir = join(ROOT, "dist"), siteOverrides = {}, quiet = false } = {}) {
  const log = quiet ? () => {} : console.log;
  const site = { ...(await readJson("content/site.json")), ...siteOverrides };
  const services = await readJson("content/services.json");
  const gallery = await readJson("content/gallery.json");
  const plants = await readJson("content/plants.json");
  site.url = (site.url || process.env.URL || "").replace(/\/$/, "");

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // CSS: tokens first (single source of truth), then components.
  const tokensCss = await readFile(join(ROOT, "src/assets/css/tokens.css"), "utf8");
  const siteCss = await readFile(join(ROOT, "src/assets/css/site.css"), "utf8");
  const css = minifyCss(tokensCss + "\n" + siteCss);
  await mkdir(join(outDir, "css"), { recursive: true });
  await writeFile(join(outDir, "css/site.css"), css);

  // JS: site behavior, form script, and the shared validation rules.
  await mkdir(join(outDir, "js"), { recursive: true });
  const siteJs = await readFile(join(ROOT, "src/assets/js/site.js"), "utf8");
  const formJs = await readFile(join(ROOT, "src/assets/js/inquiry-form.js"), "utf8");
  const schemaJs = await readFile(join(ROOT, "lib/inquiry/schema.mjs"), "utf8");
  await writeFile(join(outDir, "js/site.js"), siteJs);
  await writeFile(join(outDir, "js/inquiry-form.js"), formJs);
  await writeFile(join(outDir, "js/schema.mjs"), schemaJs);
  const assets = { css: hash(css), js: hash(siteJs) };

  // Illustrations generated from brand tokens.
  const art = renderIllustrations(parseTokens(tokensCss));
  await mkdir(join(outDir, "img/art"), { recursive: true });
  for (const [name, svg] of Object.entries(art)) await writeFile(join(outDir, `img/art/${name}.svg`), svg);

  // Owner photos and other static images.
  if (existsSync(join(ROOT, "src/assets/img"))) await cp(join(ROOT, "src/assets/img"), join(outDir, "img"), { recursive: true });
  await cp(join(ROOT, "logo/seagrape-favicon.svg"), join(outDir, "favicon.svg"));

  // Pages.
  const ctx = { site, services, gallery, plants, art: ILLUSTRATION_SIZES };
  const list = [
    pages.home(ctx),
    pages.servicesProjects(ctx),
    pages.plantsGuide(ctx),
    pages.contact(ctx),
    pages.privacy(ctx),
    pages.thankYou(ctx),
    pages.notFound(ctx),
  ];
  for (const page of list) {
    const html = layout({ site, page, assets });
    const file = page.path.endsWith(".html") ? page.path.slice(1) : join(page.path.slice(1), "index.html");
    await mkdir(dirname(join(outDir, file)), { recursive: true });
    await writeFile(join(outDir, file), html);
  }

  // SEO files.
  const indexable = list.filter((p) => !p.noindex);
  let robots = "User-agent: *\nAllow: /\nDisallow: /thank-you/\n";
  if (site.url) {
    const today = new Date().toISOString().slice(0, 10);
    const urls = indexable.map((p) => `  <url><loc>${site.url}${p.path}</loc><lastmod>${today}</lastmod></url>`).join("\n");
    await writeFile(join(outDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
    robots += `\nSitemap: ${site.url}/sitemap.xml\n`;
  }
  await writeFile(join(outDir, "robots.txt"), robots);
  await writeFile(join(outDir, "_headers"), securityHeaders());

  // Setup reminders: these never block the build, they just make gaps visible.
  const warnings = [];
  if (site.nameIsPlaceholder) warnings.push('Business name is still the placeholder. Update "name" in content/site.json and set "nameIsPlaceholder" to false.');
  if (!site.email && !site.phone) warnings.push("No public email or phone in content/site.json. Visitors can only reach you through the form.");
  if (!site.url) warnings.push("No site URL set, so canonical links and sitemap.xml were skipped. Netlify sets this automatically during deploys.");
  for (const w of warnings) log(`  ! ${w}`);
  log(`Built ${list.length} pages and ${Object.keys(art).length} illustrations → ${outDir}`);
  return { outDir, pages: list.map((p) => p.path), warnings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

