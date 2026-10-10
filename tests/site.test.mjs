// Builds the site into a temp folder and checks pages, links, assets, SEO basics and color contrast.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, mkdtemp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, parseTokens } from "../scripts/build.mjs";

let out;
const pages = {};

before(async () => {
  out = await mkdtemp(join(tmpdir(), "seagrape-"));
  await build({ outDir: out, quiet: true, siteOverrides: { url: "https://example.com" } });
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (p.endsWith(".html")) pages[p.slice(out.length).replace(/\\/g, "/")] = await readFile(p, "utf8");
    }
  };
  await walk(out);
});

const resolveLocal = (href) => {
  const path = href.split("#")[0].split("?")[0];
  if (!path) return true;
  const file = path.endsWith("/") ? join(out, path, "index.html") : join(out, path);
  return existsSync(file);
};

test("builds the four main pages plus utility pages", () => {
  for (const p of ["/index.html", "/services-projects/index.html", "/south-florida-plants/index.html", "/contact/index.html", "/privacy/index.html", "/thank-you/index.html", "/404.html"]) {
    assert.ok(pages[p], `missing ${p}`);
  }
});

test("every page has one h1, a title, a description and alt text on images", () => {
  for (const [path, html] of Object.entries(pages)) {
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${path} h1 count`);
    assert.match(html, /<title>[^<]{5,}<\/title>/, `${path} title`);
    assert.match(html, /<meta name="description" content="[^"]{20,}"/, `${path} description`);
    for (const img of html.match(/<img [^>]+>/g) || []) assert.match(img, / alt="/, `${path} img without alt: ${img}`);
    assert.ok(!/undefined|\[object Object\]/.test(html), `${path} has unrendered values`);
  }
});

test("all internal links and assets resolve", () => {
  for (const [path, html] of Object.entries(pages)) {
    for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      assert.ok(resolveLocal(href), `${path} → broken ${href}`);
    }
    for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(html.includes(`id="${id}"`), `${path} → missing anchor #${id}`);
    }
  }
});

test("cross-page anchors exist", () => {
  for (const [path, html] of Object.entries(pages)) {
    for (const [, page, id] of html.matchAll(/href="(\/[^"#]*)#([^"]+)"/g)) {
      const target = pages[page.endsWith("/") ? page + "index.html" : page];
      assert.ok(target && target.includes(`id="${id}"`), `${path} → ${page}#${id} not found`);
    }
  }
});

test("navigation marks the current page and includes the CTA", () => {
  assert.match(pages["/contact/index.html"], /<a href="\/contact\/" aria-current="page">Contact<\/a>/);
  for (const html of Object.values(pages)) assert.ok(html.includes('href="/contact/#inquiry">Start Your Project'));
});

test("SEO files and canonical links are generated when a site URL is set", async () => {
  const sitemap = await readFile(join(out, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes("https://example.com/south-florida-plants/"));
  assert.ok(!sitemap.includes("thank-you"));
  assert.match(await readFile(join(out, "robots.txt"), "utf8"), /Sitemap: https:\/\/example.com\/sitemap.xml/);
  assert.match(pages["/index.html"], /<link rel="canonical" href="https:\/\/example.com\/">/);
  assert.match(pages["/thank-you/index.html"], /noindex/);
});

test("structured data contains only supplied business facts", () => {
  const json = JSON.parse(pages["/index.html"].match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
  assert.equal(json.areaServed.name, "Broward County, Florida");
  for (const k of ["address", "aggregateRating", "review", "foundingDate"]) assert.ok(!(k in json), `unexpected ${k}`);
});

test("contact form posts to the inquiry endpoint with every required field", () => {
  const html = pages["/contact/index.html"];
  assert.match(html, /<form[^>]+action="\/api\/inquiry"[^>]+method="post"/);
  for (const n of ["name", "email", "phone", "location", "projectType", "budget", "timeframe", "description", "additional", "contactMethod", "smsConsent", "website"]) {
    assert.ok(html.includes(`name="${n}"`), `missing field ${n}`);
  }
  for (const m of html.matchAll(/<(?:input|select|textarea)[^>]+id="(f-[\w-]+)"/g)) {
    if (m[1] === "f-started") continue;
    assert.ok(html.includes(`for="${m[1]}"`), `no label for ${m[1]}`);
  }
});

test("no secrets or provider keys reach the browser", async () => {
  const js = (await readFile(join(out, "js/inquiry-form.js"), "utf8")) + (await readFile(join(out, "js/schema.mjs"), "utf8"));
  for (const html of [...Object.values(pages), js]) assert.ok(!/RESEND_API_KEY|TWILIO_AUTH_TOKEN|api\.resend\.com|api\.twilio\.com/.test(html));
});

test("production build shows no testimonials or sample content while reviews.json is empty", () => {
  for (const [path, html] of Object.entries(pages)) {
    assert.ok(!/Not a real review|review--sample|Kind words from our customers/.test(html), `${path} shows review content`);
  }
});

test("every srcset candidate resolves to a built file", () => {
  for (const [path, html] of Object.entries(pages)) {
    for (const [, set] of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const part of set.split(",")) {
        const src = part.trim().split(/\s+/)[0];
        assert.ok(resolveLocal(src), `${path} → broken srcset ${src}`);
      }
    }
  }
});

test("brand text colors meet WCAG AA contrast", async () => {
  const t = parseTokens(await readFile(new URL("../src/assets/css/tokens.css", import.meta.url), "utf8"));
  const lum = (hex) => {
    const c = hex.replace("#", "").match(/../g).map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const pairs = [
    ["color-ink", "color-canvas"], ["color-ink-muted", "color-canvas"], ["color-ink-muted", "color-ivory"],
    ["color-ink-muted", "color-sage-100"], ["color-leaf-700", "color-canvas"], ["color-white", "color-leaf-700"],
    ["color-terracotta-text", "color-canvas"], ["color-terracotta-text", "color-ivory"], ["color-on-dark", "color-leaf-900"],
    ["color-error", "color-error-bg"], ["color-leaf-900", "color-sand"],
    ["color-limestone", "color-leaf-900"], ["color-leaf-900", "color-limestone"],
  ];
  for (const [fg, bg] of pairs) {
    const r = ratio(t[fg], t[bg]);
    assert.ok(r >= 4.5, `${fg} on ${bg} is ${r.toFixed(2)}:1`);
  }
});
