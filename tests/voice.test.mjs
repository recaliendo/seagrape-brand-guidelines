// Brand voice guardrails (docs/brand-voice.md): banned marketing phrases, overuse of "passion",
// and copy that implies a team, checked across every built page's visible text.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../scripts/build.mjs";

const BANNED = [
  /industry[- ]leading/i, /world[- ]class/i, /\bunmatched\b/i, /\bunparalleled\b/i, /best[- ]in[- ]class/i,
  /revolutioniz/i, /cutting[- ]edge/i, /game[- ]chang/i, /end[- ]to[- ]end/i, /one[- ]stop/i, /\bturnkey\b/i,
  /(?<!Gardening )\bsolutions?\b/i /* allows the source name "UF/IFAS Gardening Solutions" */, /award[- ]winning/i, /#1\b/, /top[- ]rated/i, /\boasis\b/i, /\belevat(e|es|ing)\b/i,
  /exceed(s|ing)? (your )?expectations/i, /\bpremier\b/i, /\bluxury\b/i, /state[- ]of[- ]the[- ]art/i, /\bsynergy\b/i,
  /look no further/i, /in today's/i, /got you covered/i,
];
const TEAM = [/\bour team\b/i, /\bour (crew|staff|experts|professionals)\b/i, /\bwe're a (team|company)\b/i, /\bExplore Our Work\b/];

const pages = {};
before(async () => {
  const out = await mkdtemp(join(tmpdir(), "seagrape-voice-"));
  await build({ outDir: out, quiet: true });
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (p.endsWith(".html")) {
        const html = await readFile(p, "utf8");
        // Visible text only: drop scripts, styles, tags; keep alt text and meta descriptions, which visitors and search engines see.
        const meta = [...html.matchAll(/(?:alt|content)="([^"]*)"/g)].map((m) => m[1]).join(" ");
        const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
        pages[p.slice(out.length).replace(/\\/g, "/")] = (text + " " + meta).replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");
      }
    }
  };
  await walk(out);
});

test("no banned marketing phrases on any page", () => {
  for (const [path, text] of Object.entries(pages)) {
    for (const re of BANNED) {
      const m = text.match(re);
      assert.ok(!m, `${path}: "${m?.[0]}" is on the banned list in docs/brand-voice.md`);
    }
  }
});

test("'passion' appears at most once per page", () => {
  for (const [path, text] of Object.entries(pages)) {
    assert.ok((text.match(/passion/gi) || []).length <= 1, `${path} overuses "passion"`);
  }
});

test("no copy implies a larger team", () => {
  for (const [path, text] of Object.entries(pages)) {
    for (const re of TEAM) assert.ok(!re.test(text), `${path}: matches ${re}`);
  }
});

test("at most one exclamation mark per page", () => {
  for (const [path, text] of Object.entries(pages)) {
    assert.ok((text.match(/!/g) || []).length <= 1, `${path} has too many exclamation marks`);
  }
});

test("personal invitations are in Robert's first-person voice", () => {
  const home = pages["/index.html"];
  const contact = pages["/contact/index.html"];
  assert.match(home, /I'd love to hear about it/);
  assert.match(contact, /Tell me about your landscaping project/);
  assert.match(contact, /I read every inquiry myself/);
});
