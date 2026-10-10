// Gallery integrity (honest labels, credits, files) and review publishing rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, checkGallery } from "../scripts/build.mjs";
import { prepareReviews, displayName, formatReviewDate, isGoogleReviewUrl } from "../src/build/reviews.mjs";
import { reviewsSection } from "../src/templates/pages.mjs";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const gallery = JSON.parse(await readFile(join(root, "content/gallery.json"), "utf8"));
const realReviews = JSON.parse(await readFile(join(root, "content/reviews.json"), "utf8"));

async function buildTo(opts = {}) {
  const outDir = await mkdtemp(join(tmpdir(), "seagrape-gr-"));
  await build({ outDir, quiet: true, ...opts });
  const read = (p) => readFile(join(outDir, p), "utf8");
  return { outDir, home: await read("index.html"), services: await read("services-projects/index.html") };
}

const review = (over = {}) => ({ name: "Ana Lopez", location: "Davie", date: "2026-11", text: "Lovely work on our entry garden.", source: "Email", verified: true, permission: true, ...over });

// ---------- gallery ----------
test("gallery has 6–10 photos spanning the six requested styles", () => {
  const photos = gallery.items.filter((g) => g.photo?.src);
  assert.ok(photos.length >= 6 && photos.length <= 10, `${photos.length} photos`);
  const cats = new Set(gallery.items.map((g) => g.category));
  for (const c of ["Modern tropical", "Classic & elegant", "Contemporary minimalist", "Lush South Florida", "Florida-friendly", "Small yard & entryway"]) assert.ok(cats.has(c), `missing ${c}`);
});

test("every inspiration photo has both sizes on disk, alt text and a complete credit", () => {
  for (const g of gallery.items.filter((x) => x.kind === "inspiration")) {
    for (const src of [g.photo.src, g.photo.srcSmall]) {
      const file = join(root, "src/assets", src);
      assert.ok(existsSync(file), `missing ${src}`);
      assert.ok(statSync(file).size < 200 * 1024, `${src} is over 200 KB`);
    }
    assert.ok(g.photo.alt.length > 20, `${g.id} alt text too short`);
    for (const k of ["author", "source", "sourceUrl", "license", "licenseUrl"]) assert.ok(g.credit?.[k], `${g.id} credit.${k}`);
    assert.match(g.credit.license, /^(CC0|CC BY|CC BY-SA|Unsplash|Pexels)/, `${g.id} license not cleared for commercial use`);
  }
});

test("every inspiration photo is recorded in docs/image-credits.md", async () => {
  const doc = await readFile(join(root, "docs/image-credits.md"), "utf8");
  for (const g of gallery.items.filter((x) => x.kind === "inspiration")) {
    const base = g.photo.src.split("/").pop().replace(/-800\.webp$/, "");
    assert.ok(doc.includes(base), `${base} missing from image-credits.md`);
    assert.ok(doc.includes(g.credit.sourceUrl), `${g.id} source URL missing from image-credits.md`);
  }
});

test("every plant profile has a real photo on disk, alt text, a full credit, and a record in image-credits.md", async () => {
  const plants = JSON.parse(await readFile(join(root, "content/plants.json"), "utf8"));
  const doc = await readFile(join(root, "docs/image-credits.md"), "utf8");
  for (const p of plants.items) {
    assert.ok(p.photo?.src && p.photo?.srcSmall, `${p.id} needs a photo`);
    for (const src of [p.photo.src, p.photo.srcSmall]) assert.ok(existsSync(join(root, "src/assets", src)), `missing ${src}`);
    assert.ok(p.photo.alt.length > 20, `${p.id} alt text too short`);
    for (const k of ["author", "source", "sourceUrl", "license", "licenseUrl"]) assert.ok(p.photoCredit?.[k], `${p.id} photoCredit.${k}`);
    assert.ok(doc.includes(p.photoCredit.sourceUrl), `${p.id} photo missing from image-credits.md`);
  }
});

test("checkGallery rejects inspiration photos without credit or files", () => {
  const bad = { items: [{ ...gallery.items[0], credit: { author: "x" } }] };
  assert.throws(() => checkGallery(bad), /credit\.sourceUrl/);
  const missing = { items: [{ ...gallery.items[0], photo: { ...gallery.items[0].photo, src: "/img/nope.webp" } }] };
  assert.throws(() => checkGallery(missing), /file not found/);
  const kind = { items: [{ ...gallery.items[0], kind: "style" }] };
  assert.throws(() => checkGallery(kind), /kind must be/);
});

test("built pages label photos as inspiration, show credits, and never claim completed projects", async () => {
  const { home, services } = await buildTo();
  const n = gallery.items.filter((g) => g.kind === "inspiration").length;
  assert.match(services, /Photos labeled <strong>Landscape design inspiration<\/strong>/); // one notice above the grid
  assert.equal((services.match(/class="card gallery-card"/g) || []).length, n);
  assert.ok(!services.includes("Completed project"));
  assert.match(services, /not projects completed by/);
  assert.equal((services.match(/class="credit"/g) || []).length, n);
  for (const g of gallery.items) assert.ok(services.includes(g.credit.sourceUrl.replace(/&/g, "&amp;")), `${g.id} credit link`);
  assert.match(home, /photos of public gardens, not completed client projects/);
  assert.match(services, /Inspired by something you see\? Let's design something just for you\./);
  assert.match(services, /<a class="btn btn-primary" href="\/contact\/#inquiry">Start Your Project/);
});

test("photos use responsive srcset and lazy loading", async () => {
  const { services } = await buildTo();
  const imgs = services.match(/<img [^>]*\/img\/inspiration\/[^>]+>/g) || [];
  assert.ok(imgs.length >= gallery.items.length, "gallery photos plus service-row photos");
  for (const img of imgs) {
    assert.match(img, /srcset="[^"]+-480\.webp 480w, [^"]+-800\.webp 800w"/);
    assert.match(img, /loading="lazy"/);
    assert.match(img, /width="800" height="600"/);
  }
});

// ---------- reviews ----------
test("the live reviews file contains no samples or unverified entries", () => {
  for (const r of realReviews.items) {
    assert.notEqual(r.sample, true, "sample review in content/reviews.json");
    assert.equal(r.verified, true);
    assert.equal(r.permission, true);
  }
  assert.ok(!realReviews.googleReviewUrl || isGoogleReviewUrl(realReviews.googleReviewUrl));
});

test("names show first name and last initial only", () => {
  assert.equal(displayName("Ana Lopez"), "Ana L.");
  assert.equal(displayName("Ana L."), "Ana L.");
  assert.equal(displayName("Mary Ann van der berg"), "Mary Ann van der B.");
  assert.equal(displayName("Cher"), "Cher");
});

test("dates are shown as month and year", () => {
  assert.deepEqual(formatReviewDate("2026-11-03"), { label: "November 2026", iso: "2026-11-03" });
  assert.equal(formatReviewDate("2026-13"), null);
  assert.equal(formatReviewDate("last week"), null);
});

test("only verified reviews shared with permission are published", () => {
  const { items } = prepareReviews({ items: [review(), review({ verified: false }), review({ permission: false }), review({ permission: "yes" }), review({ text: "" })] });
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Ana L.");
});

test("stars appear only for linked Google reviews with a valid rating", () => {
  const google = { source: "Google", sourceUrl: "https://www.google.com/maps/reviews/example", rating: 5 };
  const { items } = prepareReviews({
    items: [review(google), review({ ...google, sourceUrl: "" }), review({ ...google, source: "Email" }), review({ ...google, rating: 7 }), review({ rating: 5 })],
  });
  assert.deepEqual(items.map((r) => r.stars), [5, null, null, null, null]);
});

test("samples are excluded unless explicitly allowed", () => {
  assert.equal(prepareReviews({ items: [review({ sample: true })] }).items.length, 0);
  assert.equal(prepareReviews({ items: [review({ sample: true })] }, { allowSamples: true }).items.length, 1);
});

test("Google review link must be a real Google domain", () => {
  for (const ok of ["https://g.page/r/abc123/review", "https://search.google.com/local/writereview?placeid=x", "https://www.google.com/maps/place/x", "https://maps.app.goo.gl/abc"]) assert.ok(isGoogleReviewUrl(ok), ok);
  for (const bad of ["http://g.page/r/abc", "https://google.evil.com/x", "https://example.com", "javascript:alert(1)", ""]) assert.ok(!isGoogleReviewUrl(bad), bad);
  assert.equal(prepareReviews({ googleReviewUrl: "https://example.com/review" }).googleReviewUrl, "");
});

test("reviews section is omitted entirely when there is nothing real to show", async () => {
  assert.equal(reviewsSection({ items: [], googleReviewUrl: "" }), "");
  const { home } = await buildTo({ reviewsData: { items: [], googleReviewUrl: "" } });
  assert.ok(!/Kind words|review-ask|class="review/.test(home));
});

test("real reviews render with names, details, stars and the Google review prompt", async () => {
  const { home } = await buildTo({
    reviewsData: {
      googleReviewUrl: "https://g.page/r/test-link/review",
      items: [review({ name: "Ana Lopez", source: "Google", sourceUrl: "https://www.google.com/maps/reviews/test", rating: 5 }), review({ name: "Ben Ortiz", location: "", date: "" })],
    },
  });
  assert.match(home, /Kind words from our customers/);
  assert.match(home, /Ana L\./);
  assert.ok(!home.includes("Lopez"));
  assert.match(home, /aria-label="Rated 5 out of 5 on Google"/);
  assert.equal((home.match(/class="stars"/g) || []).length, 1);
  assert.match(home, /<time datetime="2026-11">November 2026<\/time>/);
  assert.match(home, /Enjoyed working with us\?<\/strong> Share your experience\./);
  assert.match(home, /href="https:\/\/g.page\/r\/test-link\/review"/);
  assert.ok(home.indexOf("reviews-title") < home.indexOf("cta-title"), "reviews should sit before the final CTA");
  assert.ok(!/sample/i.test(home.match(/<section[^>]+reviews-title[\s\S]*?<\/section>/)[0]));
});

test("a Google review link alone shows just the prompt, not an empty section", async () => {
  const { home } = await buildTo({ reviewsData: { googleReviewUrl: "https://g.page/r/test-link/review", items: [] } });
  assert.match(home, /review-ask/);
  assert.ok(!home.includes("Kind words from our customers"));
});

test("sample reviews are visibly labeled and blocked in production builds", async () => {
  const { home } = await buildTo({ sampleReviews: true });
  const cards = (home.match(/<figure class="review review--sample">/g) || []).length;
  assert.ok(cards > 0);
  assert.equal((home.match(/Not a real review\./g) || []).length, cards);
  const prev = process.env.CONTEXT;
  process.env.CONTEXT = "production";
  try {
    await assert.rejects(buildTo({ sampleReviews: true }), /production/);
  } finally {
    if (prev === undefined) delete process.env.CONTEXT;
    else process.env.CONTEXT = prev;
  }
});

test("structured data never includes reviews or ratings", async () => {
  const { home } = await buildTo({ reviewsData: { items: [review({ source: "Google", sourceUrl: "https://www.google.com/maps/x", rating: 5 })] } });
  const ld = home.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1];
  assert.ok(!/review|rating/i.test(ld));
});
