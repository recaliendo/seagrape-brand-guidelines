// "Meet Robert" section: content, placement, CTA, placeholder vs. real photo, and no unsupported claims.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, checkOwner } from "../scripts/build.mjs";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const owner = JSON.parse(await readFile(join(root, "content/owner.json"), "utf8"));

async function homeHtml(opts = {}) {
  const outDir = await mkdtemp(join(tmpdir(), "seagrape-owner-"));
  await build({ outDir, quiet: true, ...opts });
  return readFile(join(outDir, "index.html"), "utf8");
}
const section = (html) => html.match(/<section[^>]+id="meet-robert"[\s\S]*?<\/section>/)?.[0] || "";

test("story covers Robert's real background and nothing more", () => {
  const all = [owner.headline, owner.greeting, ...owner.intro, ...owner.story].join(" ");
  for (const fact of ["Wisconsin", "South Florida", "hospitality", "sprinkler installation", "lawn care", "Everglades", "native plants", "sunshine", "beaches"]) {
    assert.ok(all.includes(fact), `story should mention ${fact}`);
  }
  for (const claim of [/\d+\s*\+?\s*years/i, /licensed|certified|certification|architect|horticulturist|award|decades|expert|insured/i, /family[- ]owned|our team/i]) {
    assert.ok(!claim.test(all), `unsupported claim matched ${claim}`);
  }
  assert.ok((all.match(/passion/gi) || []).length <= 1, "say 'passion' once at most");
});

test("home page introduces Robert right after the hero, before services", async () => {
  const html = await homeHtml();
  const s = section(html);
  assert.ok(s, "Meet Robert section missing");
  assert.ok(html.indexOf('id="meet-robert"') < html.indexOf('id="services-title"'));
  assert.match(s, /<h2 id="owner-title">A personal passion for South Florida landscapes<\/h2>/);
  assert.match(s, /Hi, I&#39;m Robert\./);
  assert.match(s, /<details class="owner-more">[\s\S]*Read more of my story/);
  for (const p of owner.story) assert.ok(s.includes(p.replace(/'/g, "&#39;")), "full story paragraph missing");
});

test("CTA invites the visitor to the inquiry form in Robert's voice", async () => {
  const s = section(await homeHtml());
  assert.match(s, /Let&#39;s bring your landscaping ideas to life\./);
  assert.match(s, /I&#39;d love to hear what you&#39;re thinking\./);
  assert.match(s, /<a class="btn btn-primary" href="\/contact\/#inquiry">Tell Me About Your Project/);
});

test("without a photo, an illustrated placeholder (not a stock person) is shown with the caption", async () => {
  assert.equal(owner.photo, null, "update this test once Robert's photo is added");
  const s = section(await homeHtml());
  assert.match(s, /portrait--placeholder/);
  assert.match(s, /<img src="\/img\/art\/portrait-placeholder\.svg" alt=""/);
  assert.match(s, /Robert — Owner &amp; Landscaping Enthusiast/);
});

test("a real photo replaces the placeholder with responsive images and alt text", async () => {
  const photo = {
    src: "/img/inspiration/lush-layered-tropical-beds-800.webp", // any existing file, standing in for Robert's portrait
    srcSmall: "/img/inspiration/lush-layered-tropical-beds-480.webp",
    width: 800,
    height: 1000,
    alt: "Robert standing in a garden",
  };
  const s = section(await homeHtml({ ownerData: { ...owner, photo } }));
  assert.ok(!s.includes("portrait--placeholder"));
  assert.match(s, /alt="Robert standing in a garden"/);
  assert.match(s, /srcset="[^"]+-480\.webp 480w, [^"]+-800\.webp 800w"/);
  assert.match(s, /width="800" height="1000"/);
});

test("the build rejects a photo without alt text or files", () => {
  assert.throws(() => checkOwner({ ...owner, photo: { src: "/img/inspiration/lush-layered-tropical-beds-800.webp", alt: "" } }), /alt is required/);
  assert.throws(() => checkOwner({ ...owner, photo: { src: "/img/owner/missing.webp", alt: "Robert" } }), /file not found/);
  assert.throws(() => checkOwner({ ...owner, intro: [] }), /intro/);
});

test("every page links to Meet Robert from the footer", async () => {
  const html = await homeHtml();
  assert.match(html.match(/<footer[\s\S]*<\/footer>/)[0], /<a href="\/#meet-robert">Meet Robert<\/a>/);
});
