// Page bodies. Copy lives here; editable lists (services, gallery, plants, business info) live in /content.

import { esc, icons, media, ctaBand, contactLines, CTA_HREF } from "./layout.mjs";
import { PROJECT_TYPES, BUDGETS, TIMEFRAMES, CONTACT_METHODS, LIMITS } from "../../lib/inquiry/schema.mjs";

const nativeBadge = (status) =>
  `<span class="badge${/not native/i.test(status) ? " badge--exotic" : ""}">${esc(status)}</span>`;

const serviceIndex = (items) => `
<ul class="service-index">${items.map((s) => `
  <li><a href="/services-projects/#${esc(s.id)}"><span class="si-title">${esc(s.title)}</span><span class="si-text">${esc(s.summary)}</span></a></li>`).join("")}
</ul>`;

// ---------------------------------------------------------------- Gallery
export const KIND_LABELS = { inspiration: "Landscape design inspiration", project: "Completed project" };
const GALLERY_SIZES = "(min-width: 72em) 370px, (min-width: 40em) 45vw, 100vw";

const creditLine = (c) =>
  c
    ? `<p class="credit">Photo: ${esc(c.author)} · <a href="${esc(c.licenseUrl)}" rel="license noopener">${esc(c.license)}</a> · <a href="${esc(c.sourceUrl)}" rel="noopener">${esc(c.source)}</a></p>`
    : "";

/** A service row's photo: an inspiration photo from the gallery (photoFrom), captioned and credited, or its own photo. */
function serviceMedia(s, gallery, art) {
  const g = s.photoFrom && gallery.items.find((x) => x.id === s.photoFrom);
  const item = g || s;
  return `<figure class="service-media">${media(item, { art, alt: g ? g.photo.alt : s.photo?.alt ?? "", sizes: "(min-width: 56em) 45vw, 100vw" })}${g ? `<figcaption>Inspiration · ${esc(g.place || g.title)} · Photo: ${esc(g.credit.author)}, <a href="${esc(g.credit.licenseUrl)}" rel="license noopener">${esc(g.credit.license)}</a></figcaption>` : ""}</figure>`;
}

const galleryCard = (g, art) => `
<figure class="card gallery-card" id="gallery-${esc(g.id)}">
  <div class="card-media">${media(g, { art, sizes: GALLERY_SIZES })}</div>
  <figcaption class="card-body">
    <span class="card-eyebrow">${esc(g.category)}</span>
    <h3>${esc(g.title)}</h3>
    <p>${esc(g.caption)}</p>
    ${g.place ? `<p class="place">Photographed at ${esc(g.place)}</p>` : ""}
    ${creditLine(g.credit)}
  </figcaption>
</figure>`;

function inspirationMosaic(items, art) {
  const credits = [...new Map(items.filter((g) => g.credit).map((g) => [g.credit.author, g.credit])).values()];
  return `
<div class="mosaic">
  ${items
    .map(
      (g, i) => `<a class="mosaic-item${i === 0 ? " mosaic-item--lead" : ""}" href="/services-projects/#gallery-${esc(g.id)}">
    ${media(g, { art, sizes: i === 0 ? "(min-width: 56em) 560px, 100vw" : "(min-width: 56em) 280px, 50vw" })}
    <span class="mosaic-label"><span class="card-eyebrow">${esc(g.category)}</span>${esc(g.title)}</span>
  </a>`
    )
    .join("")}
</div>
${credits.length ? `<p class="credit mosaic-credit">${KIND_LABELS.inspiration}: photos of public gardens, not completed client projects. Photos by ${credits
    .map((c) => `${esc(c.author)} (<a href="${esc(c.licenseUrl)}" rel="license noopener">${esc(c.license)}</a>)`)
    .join(", ")} via Wikimedia Commons. <a href="/services-projects/#inspiration">Full credits</a>.</p>` : ""}`;
}

// ---------------------------------------------------------------- Reviews
const star = (filled) =>
  `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;

const reviewCard = (r) => {
  const meta = [
    r.location ? esc(r.location) : "",
    r.date ? `<time datetime="${r.date.iso}">${esc(r.date.label)}</time>` : "",
    r.source ? (r.sourceUrl ? `<a href="${esc(r.sourceUrl)}" rel="noopener">${esc(r.source)} review</a>` : `${esc(r.source)}`) : "",
  ].filter(Boolean);
  return `
<figure class="review${r.sample ? " review--sample" : ""}">
  ${r.sample ? `<p class="sample-flag">Sample for development preview only. Not a real review.</p>` : ""}
  <svg class="review-leaf" viewBox="0 0 40 40" aria-hidden="true"><path d="M6 34C6 18 16 7 34 6c0 18-10 28-26 28" fill="currentColor"/><path d="M6 34L22 18" stroke="#FBFAF6" stroke-width="1.5" stroke-linecap="round"/></svg>
  ${r.stars ? `<p class="stars" role="img" aria-label="Rated ${r.stars} out of 5 on Google">${[1, 2, 3, 4, 5].map((n) => star(n <= r.stars)).join("")}</p>` : ""}
  <blockquote><p>${esc(r.text)}</p></blockquote>
  <figcaption><span class="review-name">${esc(r.name)}</span>${meta.length ? `<span class="review-meta">${meta.join(" · ")}</span>` : ""}</figcaption>
</figure>`;
};

/** Renders nothing at all when there are no publishable reviews and no Google review link. */
export function reviewsSection({ items = [], googleReviewUrl = "" } = {}) {
  const ask = googleReviewUrl
    ? `<div class="review-ask"><p><strong>Enjoyed working with us?</strong> Share your experience.</p><a class="btn btn-secondary" href="${esc(googleReviewUrl)}" rel="noopener" target="_blank">Leave a Google review<span class="visually-hidden"> (opens in a new tab)</span></a></div>`
    : "";
  if (!items.length && !ask) return "";
  if (!items.length) return `<section class="section section--tight" aria-label="Customer reviews"><div class="container">${ask}</div></section>`;
  return `
<section class="section" aria-labelledby="reviews-title">
  <div class="container">
    <div class="section-head">
      <h2 id="reviews-title">Kind words from our customers</h2>
    </div>
    <div class="reviews">${items.map(reviewCard).join("")}</div>
    ${ask}
  </div>
</section>`;
}

const plantCard = (p, art, { compact = false } = {}) => `
<article class="card plant-card" id="${esc(p.id)}">
  ${p.photo?.src ? `<div class="card-media">${media(p, { art, sizes: GALLERY_SIZES })}</div>` : ""}
  <div class="card-body">
    ${nativeBadge(p.native)}
    <h3>${esc(p.name)}</h3>
    <p class="plant-sci">${esc(p.scientific)}</p>
    <dl class="facts">
      <div><dt>Light</dt><dd>${esc(p.light)}</dd></div>
      <div><dt>Water</dt><dd>${esc(p.water)}</dd></div>
      ${compact ? "" : `<div><dt>Size</dt><dd>${esc(p.size)}</dd></div>`}
    </dl>
    ${compact ? "" : `
    <details class="more">
      <summary>Uses, care &amp; design tips</summary>
      <dl class="facts">
        <div><dt>Type</dt><dd>${esc(p.category)}</dd></div>
        <div><dt>Uses</dt><dd>${esc(p.uses)}</dd></div>
        <div><dt>Care</dt><dd>${esc(p.care)}</dd></div>
        <div><dt>Tip</dt><dd>${esc(p.tip)}</dd></div>
      </dl>
      <p class="sources">Sources: ${p.sources.map((s) => `<a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a>`).join("; ")}</p>
    </details>`}
    ${creditLine(p.photoCredit)}
  </div>
</article>`;

const faq = (items) => `<div class="faq">${items
  .map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="answer">${a}</div></details>`)
  .join("")}</div>`;

// ---------------------------------------------------------------- Owner
export const ownerAnchor = (owner) => `meet-${String(owner.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/** Robert's introduction: portrait (or illustrated placeholder), story excerpt, full story on demand, and a first-person CTA. */
export function ownerSection(owner, art) {
  const hasPhoto = Boolean(owner.photo?.src);
  const picture = hasPhoto
    ? media({ photo: owner.photo }, { sizes: "(min-width: 56em) 440px, 100vw" })
    : `<svg class="line-leaf" viewBox="0 0 120 120" width="96" height="96" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M60 14c26 0 42 20 42 44s-19 46-42 46-42-20-42-44c0-14 6-26 16-34 7-6 15-12 26-12z"/><path d="M60 104V38"/><path d="M60 80l-20-16M60 80l20-16M60 60l-15-12M60 60l15-12"/></svg>`;
  const paras = (list) => list.map((p) => `<p>${esc(p)}</p>`).join("");
  return `
<section class="section section--ivory owner" id="${ownerAnchor(owner)}" aria-labelledby="owner-title">
  <div class="container owner-grid">
    <figure class="portrait${hasPhoto ? "" : " portrait--placeholder"}">
      <div class="portrait-frame">${picture}</div>
      <figcaption class="portrait-caption">${esc(owner.name)} — ${esc(owner.role)}</figcaption>
    </figure>
    <div class="owner-copy">
      <h2 id="owner-title">${esc(owner.headline)}</h2>
      <p class="owner-greeting">${esc(owner.greeting)}</p>
      <div class="owner-story">${paras(owner.intro)}</div>
      ${owner.story?.length ? `<details class="owner-more"><summary><span class="more-label">Read more of my story</span><span class="less">Show less</span></summary><div class="owner-story">${paras(owner.story)}</div></details>` : ""}
      <p class="signature">— ${esc(owner.signoff)}</p>
      <div class="owner-cta">
        <h3>${esc(owner.cta.title)}</h3>
        <p>${esc(owner.cta.text)}</p>
        <a class="btn btn-primary" href="${CTA_HREF}">${esc(owner.cta.button)} ${icons.arrow}</a>
      </div>
    </div>
  </div>
</section>`;
}

// ---------------------------------------------------------------- Home
export function home({ site, services, gallery, plants, reviews, owner, art }) {
  return {
    path: "/",
    title: "Landscape design in Broward County, FL",
    description: `${site.name} is a small, owner-operated landscape design studio in Broward County, Florida. Personalized garden design, tropical landscaping and plants chosen for South Florida.`,
    schema: true,
    preload: "/img/inspiration/hero-bonnet-house-640.webp",
    body: `
<section class="hero">
  <div class="container hero-grid">
    <div class="hero-copy">
      <span class="eyebrow">Landscape design · Broward County, Florida</span>
      <h1>Thoughtful landscaping, <em>personally designed.</em></h1>
      <p class="lede">Beautiful landscaping starts with understanding your space and what you'd love it to become. I listen first, then help create a garden that suits your home, your style and the way South Florida grows.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="${CTA_HREF}">Start Your Project ${icons.arrow}</a>
        <a class="text-link text-link--light" href="/services-projects/#inspiration">See design ideas ${icons.arrow}</a>
      </div>
      <ul class="hero-note"><li>Owner-operated</li><li>Small and large projects welcome</li><li>South Florida plant know-how</li></ul>
    </div>
    <figure class="hero-photo">
      <img src="/img/inspiration/hero-bonnet-house-640.webp" srcset="/img/inspiration/hero-bonnet-house-400.webp 400w, /img/inspiration/hero-bonnet-house-640.webp 640w" sizes="(min-width: 56em) 30rem, 90vw" width="640" height="800" alt="Palms and drought-tolerant plants set in pale sand in a sunny garden" fetchpriority="high" decoding="async">
      <figcaption>Inspiration · Bonnet House, Fort Lauderdale · Photo: Leonard J. DeFrancisci, <a href="https://creativecommons.org/licenses/by-sa/3.0/" rel="license noopener">CC BY-SA 3.0</a></figcaption>
    </figure>
  </div>
</section>

${ownerSection(owner, art)}

<section class="section" aria-labelledby="services-title">
  <div class="container">
    <div class="section-head">
      <h2 id="services-title">Landscaping services, shaped to your project</h2>
      <p class="lede">From a single entry bed to a full yard, every project gets the same care and attention.</p>
    </div>
    ${serviceIndex(services.items)}
    <div class="section-foot"><a class="text-link" href="/services-projects/">See all services ${icons.arrow}</a></div>
  </div>
</section>

<section class="section section--sage" aria-labelledby="styles-title">
  <div class="container">
    <div class="section-head">
      <h2 id="styles-title">Find the style that feels like home</h2>
      <p class="lede">There's no single way to create a beautiful landscape. Some spaces call for clean, simple greenery, while others come alive with layers of tropical color.</p>
    </div>
    ${inspirationMosaic(gallery.items.filter((g) => g.featured).slice(0, 4), art)}
    <div class="section-foot"><a class="text-link" href="/services-projects/#inspiration">Explore the inspiration gallery ${icons.arrow}</a></div>
  </div>
</section>

<section class="section" aria-labelledby="approach-title">
  <div class="container">
    <div class="section-head">
      <h2 id="approach-title">How we work together</h2>
      <p class="lede">Every project is different, so we'll talk through what each step looks like for yours.</p>
    </div>
    <ol class="steps">
      <li><h3>Tell me about your space</h3><p>Share your ideas, a few photos and what you'd like to change. A short note is plenty to start.</p></li>
      <li><h3>Explore ideas together</h3><p>We walk the property together and talk about sun, shade, drainage and how you want the space to feel.</p></li>
      <li><h3>Create a personalized plan</h3><p>I suggest a layout, plants and materials that fit your style and budget, and we adjust until it feels right.</p></li>
      <li><h3>Bring your landscape to life</h3><p>I prepare the beds, plant with care, and show you how to help everything settle in.</p></li>
    </ol>
    <div class="section-foot"><a class="text-link" href="/south-florida-plants/">Curious what grows well here? Browse the South Florida plant guide ${icons.arrow}</a></div>
  </div>
</section>

${reviewsSection(reviews)}
${ctaBand()}`,
  };
}

// ---------------------------------------------------------------- Services & Projects
export function servicesProjects({ site, services, gallery, art }) {
  const hasProjects = gallery.items.some((g) => g.kind === "project");
  return {
    path: "/services-projects/",
    title: "Services & project inspiration",
    description:
      "Landscape design, garden refreshes, tropical landscaping and plant installation in Broward County, FL, plus a landscape design inspiration gallery from modern tropical to Florida-friendly gardens.",
    body: `
<header class="page-header">
  <div class="container">
    <span class="eyebrow">Services &amp; projects</span>
    <h1>Landscaping that fits your home and your life</h1>
    <p class="lede">Whether it's refreshing a garden bed, choosing the right plants or rethinking your outdoor space, I'm happy to explore the possibilities with you.</p>
  </div>
</header>

<section class="section" aria-labelledby="services-heading">
  <div class="container">
    <h2 id="services-heading" class="visually-hidden">Services</h2>
    <div class="service-list">
      ${services.items
        .map(
          (s) => `
      <article class="service" id="${esc(s.id)}">
        ${serviceMedia(s, gallery, art)}
        <div class="service-copy">
          <h3 class="service-title">${esc(s.title)}</h3>
          <p class="lede">${esc(s.summary)}</p>
          <p>${esc(s.description)}</p>
          <p class="fit"><strong>A good fit for:</strong> ${esc(s.goodFor)}</p>
          <a class="text-link" href="${CTA_HREF}">Ask about ${esc(s.title.toLowerCase())} ${icons.arrow}</a>
        </div>
      </article>`
        )
        .join("")}
    </div>
  </div>
</section>

<section class="section section--ivory" aria-labelledby="size-title">
  <div class="container">
    <div class="size-band">
      <div class="stack">
        <h2 id="size-title">Small ideas and big plans are both welcome</h2>
        <p class="muted">Some of the most satisfying projects are small: a planter pair that finally makes the entry feel finished, or one shady corner turned into something you enjoy. If you're planning something larger, I'll be straightforward about scope and timing so the plan fits.</p>
      </div>
      <ul>
        <li>Refresh one bed or an entire yard</li>
        <li>Phase a larger plan over time</li>
        <li>Start with ideas, even without a budget in mind</li>
      </ul>
    </div>
  </div>
</section>

<section class="section" id="inspiration" aria-labelledby="inspiration-title">
  <div class="container">
    <div class="section-head">
      <h2 id="inspiration-title">Landscape styles to explore</h2>
      <p class="lede">Different directions a South Florida garden can take. Use them as a starting point; most yards end up as a blend.</p>
    </div>
    <p class="notice" style="margin-bottom:var(--space-6)">${icons.info}<span>Photos labeled <strong>${KIND_LABELS.inspiration}</strong> were taken at public gardens and other places in Florida by independent photographers. They're here to spark ideas and are not projects completed by ${esc(site.name)}. Credits appear under each photo.</span></p>
    <div class="grid grid--3 gallery">${gallery.items.map((g) => galleryCard(g, art)).join("")}</div>
    <div class="inspo-cta">
      <div class="stack">
        <h3>Inspired by something you see? Let's design something just for you.</h3>
        <p class="muted">Tell me which looks you like and a little about your yard. I'll help you adapt the idea to your space, your budget and South Florida's conditions.</p>
      </div>
      <a class="btn btn-primary" href="${CTA_HREF}">Start Your Project ${icons.arrow}</a>
    </div>
  </div>
</section>

<section class="section section--sage" aria-labelledby="faq-title">
  <div class="container">
    <div class="section-head"><h2 id="faq-title">Before you start a landscape project</h2></div>
    ${faq([
      ["How can I improve a small front yard?", `<p>Focus on the walk to the door. Clean bed edges, a layered planting of two or three plant types repeated in groups, and a pair of planters by the entry make a small yard look intentional. Choose plants that stay a manageable size so you aren't pruning constantly.</p>`],
      ["What does a modern tropical landscape look like?", `<p>Bold leaf shapes against simple backgrounds: smooth walls, gravel, or clean mulch. It uses fewer plant types in larger groups, with plenty of breathing room. Palms, strappy foliage and low natives like coontie often play a part.</p>`],
      ["How can I refresh an existing garden without starting over?", `<p>Keep the healthy, well-placed plants and edit out the ones that are struggling or overgrown. Redefine the bed lines, fill gaps with plants suited to the light, and finish with fresh mulch. A refresh often costs far less than a full redesign.</p>`],
      ["What should I think about before planning a landscape project?", `<p>Notice where the sun falls through the day, where water collects after rain, and how you use each part of the yard. Think about how much upkeep you want. A rough budget range helps, but it's fine to start with ideas and figure out the numbers together.</p>`],
      ["Do you take on small projects?", `<p>Yes, and I enjoy them. Sometimes a few carefully chosen plants make as much difference as a bigger project. Tell me what you have in mind and I'll let you know honestly whether I'm a good fit.</p>`],
    ])}
  </div>
</section>
${ctaBand()}`,
  };
}

// ---------------------------------------------------------------- Plants
export function plantsGuide({ plants, art }) {
  const sources = [...new Map(plants.items.flatMap((p) => p.sources).map((s) => [s.url, s])).values()];
  return {
    path: "/south-florida-plants/",
    title: "South Florida plants & garden guide",
    description:
      "A beginner-friendly guide to plants that grow well in Broward County: Florida natives, tropical favorites, sun and shade, water-wise and salt-tolerant choices.",
    body: `
<header class="page-header">
  <div class="container">
    <span class="eyebrow">Garden guide</span>
    <h1>South Florida plants &amp; garden guide</h1>
    <p class="lede">South Florida gives us some wonderful planting options, but choosing the right plant for the right spot makes all the difference. This guide covers what our climate asks of a garden, plus a few dependable plants I like to work with.</p>
  </div>
</header>

<section class="section" aria-labelledby="conditions-title">
  <div class="container">
    <div class="section-head">
      <h2 id="conditions-title">What to consider in a South Florida garden</h2>
      <p class="lede">Matching each plant to its spot matters more than any single plant choice. These are the conditions I look at first.</p>
    </div>
    <div class="conditions">
      <div class="condition"><h3>Sun and shade</h3><p>Note how many hours of direct sun each area gets. Afternoon sun in South Florida is intense, and plants labeled "part shade" often struggle in a west-facing bed.</p></div>
      <div class="condition"><h3>Soil and drainage</h3><p>Much of Broward has sandy soil that drains fast and holds few nutrients, while some yards stay soggy after summer storms. Watch where water collects before you plant.</p></div>
      <div class="condition"><h3>Water-wise planting</h3><p>Group plants with similar water needs. Many natives need regular water only while they're getting established, then get by mostly on rainfall.</p></div>
      <div class="condition"><h3>Salt and coastal air</h3><p>Near the coast, salt spray and salty soil limit what will thrive. Seagrape, cocoplum and Simpson's stopper are among the more salt-tolerant choices.</p></div>
      <div class="condition"><h3>Wildlife-friendly gardens</h3><p>Flowering natives like firebush feed butterflies and hummingbirds, and berry-producing shrubs feed birds. Layered planting gives them shelter too.</p></div>
      <div class="condition"><h3>Maintenance</h3><p>Leave room for a plant's mature size. Choosing the right size from the start saves years of heavy pruning.</p></div>
    </div>
    <p class="notice" style="margin-top:var(--space-6)">${icons.info}<span>The <a href="https://ffl.ifas.ufl.edu/" rel="noopener">Florida-Friendly Landscaping™ program</a> from UF/IFAS Extension has more on these principles. Results always depend on your yard's specific sun, drainage, irrigation and salt exposure.</span></p>
  </div>
</section>

<section class="section section--ivory" aria-labelledby="plant-list-title">
  <div class="container">
    <div class="section-head">
      <h2 id="plant-list-title">Dependable plants for Broward landscapes</h2>
      <p class="lede">Mostly Florida natives, plus a non-native tropical favorite that isn't considered invasive. Open a card for care and design tips.</p>
    </div>
    <div class="grid grid--3">${plants.items.map((p) => plantCard(p, art)).join("")}</div>
  </div>
</section>

<section class="section" aria-labelledby="avoid-title">
  <div class="container split" style="align-items:start">
    <div class="stack">
      <h2 id="avoid-title">No invasive plants, ever</h2>
      <p>Some plants sold in Florida spread into natural areas and crowd out native habitat. Brazilian pepper and coral ardisia are well-known examples. I check plant choices against the Florida Invasive Species Council list and UF/IFAS guidance, and I'm happy to suggest non-invasive alternatives for plants you already have.</p>
      <p><a class="text-link" href="https://gardeningsolutions.ifas.ufl.edu/care/weeds-and-invasive-plants/plant-this-not-that/" rel="noopener">UF/IFAS: Plant this, not that ${icons.arrow}</a></p>
    </div>
    <div class="stack">
      <h3>Common questions</h3>
      ${faq([
        ["What plants grow well in South Florida?", `<p>Natives like firebush, coontie, cocoplum, muhly grass and wild coffee are reliable because they evolved here. Many tropical ornamentals, such as crotons, also do well when they get the right light and drainage.</p>`],
        ["Are all tropical plants native to Florida?", `<p>No. Many plants people think of as "Florida plants" come from elsewhere in the tropics. Non-native isn't automatically bad, but a few have become invasive, so it's worth checking before you plant.</p>`],
        ["What grows in shade?", `<p>Wild coffee and coontie both handle shade well. In deep shade, plants grow more open and flower less, so plan for foliage texture rather than color.</p>`],
      ])}
    </div>
  </div>
</section>

<section class="section section--sage" aria-labelledby="sources-title">
  <div class="container prose">
    <h2 id="sources-title" style="font-size:var(--text-xl)">Sources</h2>
    <p class="small muted">Plant details are summarized from University of Florida IFAS Extension publications, reviewed ${esc(plants.lastReviewed)}. Sizes and care vary with conditions; check with your county Extension office for site-specific advice.</p>
    <ul class="small">${sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a></li>`).join("")}</ul>
  </div>
</section>
${ctaBand({ title: "Not sure what will grow in your yard?", text: "Tell me about your sun, soil and the look you want. I'll suggest plants that suit both your space and your style." })}`,
  };
}

// ---------------------------------------------------------------- Contact
const opts = (list, placeholder) =>
  `<option value="">${esc(placeholder)}</option>` + list.map((o) => `<option>${esc(o)}</option>`).join("");

export function contact({ site, owner }) {
  const lines = contactLines(site);
  const hasDirect = Boolean(site.email || site.phone);
  return {
    path: "/contact/",
    title: "Contact & project inquiry",
    description: `Tell ${site.name} about your landscaping project in Broward County, Florida. Send a short project inquiry and get a reply by your preferred contact method.`,
    schema: true,
    scripts: `<script type="module" src="/js/inquiry-form.js"></script>`,
    body: `
<header class="page-header">
  <div class="container">
    <span class="eyebrow">Contact</span>
    <h1>Tell me about your landscaping project</h1>
    <p class="lede">Have something in mind for your yard? Tell me a little about it. Whether it's a small garden refresh or a bigger change, I'd love to hear your ideas.</p>
  </div>
</header>

<section class="section" style="padding-top:var(--space-7)">
  <div class="container contact-grid">
    <div id="inquiry">
      <div id="form-status" class="alert" role="alert" tabindex="-1" hidden></div>
      <form class="form" id="inquiry-form" action="/api/inquiry" method="post" novalidate>
        <p class="small muted">Fields marked <span class="req" aria-hidden="true">*</span><span class="visually-hidden">with an asterisk</span> are required. Please include an email address or a phone number so I can reply.</p>

        <fieldset>
          <legend>About you</legend>
          <div class="field" data-field="name">
            <label for="f-name">Full name <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="f-name" name="name" type="text" autocomplete="name" required maxlength="${LIMITS.name}" aria-describedby="e-name">
            <p class="field-error" id="e-name"></p>
          </div>
          <div class="form-row form-row--2">
            <div class="field" data-field="email">
              <label for="f-email">Email address <span class="opt">(email or phone)</span></label>
              <input class="input" id="f-email" name="email" type="email" autocomplete="email" inputmode="email" maxlength="${LIMITS.email}" placeholder="name@example.com" aria-describedby="e-email">
              <p class="field-error" id="e-email"></p>
            </div>
            <div class="field" data-field="phone">
              <label for="f-phone">Phone number <span class="opt">(email or phone)</span></label>
              <input class="input" id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="${LIMITS.phone}" placeholder="(954) 555-0123" aria-describedby="e-phone">
              <p class="field-error" id="e-phone"></p>
            </div>
          </div>
          <div class="field" data-field="contactMethod">
            <span class="label" id="l-contact">Preferred contact method</span>
            <div class="choices" role="radiogroup" aria-labelledby="l-contact" aria-describedby="e-contactMethod">
              ${CONTACT_METHODS.map((m, i) => `<label class="choice"><input type="radio" name="contactMethod" value="${esc(m)}"${i === CONTACT_METHODS.length - 1 ? " checked" : ""}><span>${esc(m)}</span></label>`).join("")}
            </div>
            <p class="field-error" id="e-contactMethod"></p>
          </div>
          <div class="field consent-box" data-field="smsConsent" id="sms-consent">
            <label class="check" for="f-sms"><input id="f-sms" name="smsConsent" type="checkbox" value="yes" aria-describedby="e-smsConsent"><span>If I choose text message, I agree to receive texts from ${esc(site.name)} about this inquiry only. No marketing messages. Message and data rates may apply. Reply STOP to opt out.</span></label>
            <p class="field-error" id="e-smsConsent"></p>
          </div>
        </fieldset>

        <fieldset>
          <legend>About your project</legend>
          <div class="form-row form-row--2">
            <div class="field" data-field="location">
              <label for="f-location">Project location <span class="req" aria-hidden="true">*</span></label>
              <input class="input" id="f-location" name="location" type="text" autocomplete="address-level2" required maxlength="${LIMITS.location}" placeholder="City or ZIP, e.g. Plantation or 33324" aria-describedby="h-location e-location">
              <p class="hint" id="h-location">I work in Broward County, Florida.</p>
              <p class="field-error" id="e-location"></p>
            </div>
            <div class="field" data-field="projectType">
              <label for="f-type">Project type <span class="req" aria-hidden="true">*</span></label>
              <select class="select" id="f-type" name="projectType" required aria-describedby="e-projectType">${opts(PROJECT_TYPES, "Choose one")}</select>
              <p class="field-error" id="e-projectType"></p>
            </div>
          </div>
          <div class="form-row form-row--2">
            <div class="field" data-field="budget">
              <label for="f-budget">Estimated budget <span class="opt">(optional)</span></label>
              <select class="select" id="f-budget" name="budget" aria-describedby="h-budget e-budget">${opts(BUDGETS, "Choose a range")}</select>
              <p class="hint" id="h-budget">Just a rough estimate to guide ideas, not a commitment.</p>
              <p class="field-error" id="e-budget"></p>
            </div>
            <div class="field" data-field="timeframe">
              <label for="f-timeframe">Desired timeframe <span class="opt">(optional)</span></label>
              <select class="select" id="f-timeframe" name="timeframe" aria-describedby="e-timeframe">${opts(TIMEFRAMES, "Choose a timeframe")}</select>
              <p class="field-error" id="e-timeframe"></p>
            </div>
          </div>
          <div class="field" data-field="description">
            <label for="f-description">Project description <span class="req" aria-hidden="true">*</span></label>
            <textarea class="textarea" id="f-description" name="description" required maxlength="${LIMITS.description}" placeholder="What would you like to change? Any styles, plants or problem areas in mind?" aria-describedby="h-description e-description"></textarea>
            <p class="hint" id="h-description">A few sentences is plenty, for example: "Our front beds are overgrown. We'd like something tidy and low-maintenance with some color."</p>
            <p class="field-error" id="e-description"></p>
          </div>
          <div class="field" data-field="additional">
            <label for="f-additional">Additional information <span class="opt">(optional)</span></label>
            <textarea class="textarea textarea--short" id="f-additional" name="additional" maxlength="${LIMITS.additional}" placeholder="Pets, HOA rules, best times to visit, anything else we should know" aria-describedby="e-additional"></textarea>
            <p class="field-error" id="e-additional"></p>
          </div>
        </fieldset>

        <div class="hp" aria-hidden="true"><label for="f-website">Leave this field empty</label><input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <input type="hidden" name="startedAt" id="f-started" value="">

        <div class="form-actions">
          <button class="btn btn-primary" type="submit" id="submit-btn"><span class="spinner" aria-hidden="true"></span><span class="btn-label">Send my project inquiry</span></button>
          <p class="small muted">Your details are used only to reply to this inquiry. See the <a href="/privacy/">privacy notice</a>.</p>
        </div>
      </form>
    </div>

    <aside class="contact-aside" aria-label="Contact details">
      <div class="info-card">
        <h2 style="font-size:var(--text-xl)">Contact details</h2>
        <dl class="info-list">${lines.map((l) => `<div><dt>${l.label}</dt><dd>${l.html}</dd></div>`).join("")}</dl>
        ${hasDirect ? "" : `<p class="small muted">The project form is the best way to reach me.</p>`}
      </div>
      <div class="info-card" style="background:var(--color-white)">
        <h2 style="font-size:var(--text-xl)">What happens next</h2>
        <ol class="small" style="margin:0;padding-left:1.1em;display:grid;gap:var(--space-2)">
          <li>Your message comes straight to me, ${esc(owner.name)}, not a call center.</li>
          <li>I read every inquiry myself and reply the way you prefer.</li>
          <li>If it's a good fit, we'll find a time to look at your space together.</li>
        </ol>
      </div>
    </aside>
  </div>
</section>`,
  };
}

// ---------------------------------------------------------------- Utility pages
export function privacy({ site }) {
  return {
    path: "/privacy/",
    title: "Privacy notice",
    description: `How ${site.name} handles the information you send through the project inquiry form.`,
    body: `
<header class="page-header"><div class="container"><span class="eyebrow">Privacy</span><h1>Privacy notice</h1></div></header>
<section class="section"><div class="container prose">
  <p>This notice explains what happens to the information you share with ${esc(site.name)} through this website.</p>
  <h2>What we collect</h2>
  <p>When you send a project inquiry, we receive the details you enter: your name, email address and/or phone number, project location, project details, and your preferred contact method. We don't use advertising trackers or analytics cookies on this site.</p>
  <h2>How we use it</h2>
  <p>We use your details only to respond to your inquiry and discuss your project. We don't sell or share your information for marketing, and we won't add you to a mailing list.</p>
  <h2>How it's delivered</h2>
  <p>Your inquiry is sent to us by email through a transactional email provider, and a short summary may also be sent to us by text message through an SMS provider. These services process the message only to deliver it. The website itself doesn't store your inquiry in a database.</p>
  <h2>Text messages</h2>
  <p>If you choose text message as your preferred contact method and agree to receive texts, we'll text you only about your inquiry. Reply STOP at any time to opt out.</p>
  <h2>Fonts</h2>
  <p>This site loads its typefaces from Google Fonts, which means your browser connects to Google's servers and shares your IP address with them.</p>
  <h2>Keeping and deleting your information</h2>
  <p>We keep inquiry messages only as long as we need them to respond and to keep a record of our work with you. To ask us to delete your information, contact us${site.email ? ` at <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : " using the details on our contact page"}.</p>
  <p class="small muted">Last updated October 2026.</p>
</div></section>`,
  };
}

export function thankYou() {
  return {
    path: "/thank-you/",
    title: "Thank you",
    description: "Your project inquiry was sent.",
    noindex: true,
    body: `
<section class="section"><div class="container prose">
  <div class="alert alert--success form-success" style="text-align:left;justify-items:start">${icons.check}
    <h1 style="font-size:var(--text-2xl)">Thank you. Your inquiry was sent.</h1>
    <p>I'll read it carefully and get back to you using the contact method you chose.</p>
  </div>
  <p><a class="text-link" href="/south-florida-plants/">Browse the South Florida plant guide while you wait ${icons.arrow}</a></p>
</div></section>`,
  };
}

export function notFound() {
  return {
    path: "/404.html",
    title: "Page not found",
    description: "The page you were looking for couldn't be found.",
    noindex: true,
    body: `
<section class="section"><div class="container prose">
  <span class="eyebrow">404</span>
  <h1>This path leads nowhere</h1>
  <p class="lede">The page you're looking for may have moved. Try one of these instead.</p>
  <p style="display:flex;flex-wrap:wrap;gap:var(--space-3)"><a class="btn btn-primary" href="/">Go to the home page</a><a class="btn btn-secondary" href="${CTA_HREF}">Start Your Project</a></p>
</div></section>`,
  };
}
