// Shared page shell: <head> metadata, header, footer, and small rendering helpers.

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/services-projects/", label: "Services & Projects" },
  { href: "/south-florida-plants/", label: "South Florida Plants" },
  { href: "/contact/", label: "Contact" },
];

export const CTA_HREF = "/contact/#inquiry";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400&display=swap";

export const icons = {
  arrow: `<svg class="arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  info: `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 9v5M10 6.2v.1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  check: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 24.5l6 6 12-13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

export const logoMark = (cls = "") =>
  `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M50 8C76 8 94 28 94 52C94 76 74 94 50 94C28 94 8 78 8 54C8 40 14 28 24 20C32 13 40 8 50 8Z" fill="#3E5E48"/><g stroke="#E3B7A6" stroke-linecap="round" fill="none"><path d="M50 90V30" stroke-width="4"/><path d="M50 70L30 53M50 70L70 53M50 51L34 38M50 51L66 38" stroke-width="3.2"/></g></svg>`;

/**
 * Image for content items: uses the owner's photo when provided, otherwise the brand illustration.
 * Pass alt="" when the image is decorative next to a heading that already says the same thing.
 */
export function media(item, { alt, eager = false, sizes = "(min-width: 56em) 50vw, 100vw", art } = {}) {
  if (item.photo && item.photo.src) {
    const p = item.photo;
    const srcset = p.srcSmall ? ` srcset="${esc(p.srcSmall)} 480w, ${esc(p.src)} ${p.width || 800}w" sizes="${sizes}"` : "";
    return `<img src="${esc(p.src)}"${srcset} alt="${esc(alt ?? p.alt ?? "")}" width="${p.width || 1200}" height="${p.height || 900}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }
  const key = item.illustration;
  const [w, h] = art?.[key] || [800, 600];
  return `<img src="/img/art/${esc(key)}.svg" alt="${esc(alt ?? "")}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

function jsonLd(site, pageUrl) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.name,
    description: site.description,
    areaServed: { "@type": "AdministrativeArea", name: site.serviceArea },
  };
  if (site.url) data.url = site.url;
  if (site.email) data.email = site.email;
  if (site.phone) data.telephone = site.phone;
  if (site.social?.length) data.sameAs = site.social.map((s) => s.url);
  if (pageUrl) data.mainEntityOfPage = pageUrl;
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

function head({ site, page, assets }) {
  const fullTitle = page.path === "/" ? `${site.name} | Landscape Design in Broward County, FL` : `${page.title} | ${site.name}`;
  const canonical = site.url ? site.url.replace(/\/$/, "") + page.path : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(page.description)}">
${page.noindex ? '<meta name="robots" content="noindex">' : ""}
${canonical && !page.noindex ? `<link rel="canonical" href="${esc(canonical)}">` : ""}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:locale" content="en_US">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ""}
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#FBFAF6">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONT_URL}">
<link rel="stylesheet" href="/css/site.css?v=${assets.css}">
${page.preload ? `<link rel="preload" as="image" href="${esc(page.preload)}">` : ""}
<script>document.documentElement.classList.add("js")</script>
${page.schema ? jsonLd(site, canonical) : ""}
</head>`;
}

function header(site, path) {
  const link = (n) => `<li><a href="${n.href}"${n.href === path ? ' aria-current="page"' : ""}>${esc(n.label)}</a></li>`;
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header" id="top">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="${esc(site.name)}, home">${logoMark()}<span class="brand-name">${esc(site.shortName || site.name)}<small>Landscape Design</small></span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="nav-toggle-icon" aria-hidden="true"><span></span></span><span class="nav-toggle-label">Menu</span></button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul class="nav-list">${NAV.map(link).join("")}</ul>
      <a class="btn btn-primary nav-cta" href="${CTA_HREF}">Start Your Project</a>
    </nav>
  </div>
</header>`;
}

export function contactLines(site) {
  const lines = [];
  if (site.email) lines.push({ label: "Email", html: `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` });
  if (site.phone) lines.push({ label: "Phone", html: `<a href="tel:${esc(site.phone.replace(/[^\d+]/g, ""))}">${esc(site.phone)}</a>` });
  lines.push({ label: "Service area", html: esc(site.serviceArea) });
  if (site.hours) lines.push({ label: "Hours", html: esc(site.hours) });
  return lines;
}

function footer(site, year) {
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="/">${logoMark()}<span class="brand-name">${esc(site.shortName || site.name)}<small>Landscape Design</small></span></a>
        <p>${esc(site.tagline)} A small, owner-operated landscaping studio serving ${esc(site.serviceArea)}.</p>
      </div>
      <div>
        <h2>Explore</h2>
        <ul class="footer-links">${NAV.map((n) => `<li><a href="${n.href}">${esc(n.label)}</a></li>`).join("")}${site.ownerLink ? `<li><a href="${site.ownerLink.href}">${esc(site.ownerLink.label)}</a></li>` : ""}</ul>
      </div>
      <div>
        <h2>Get in touch</h2>
        <ul class="footer-links">
          ${contactLines(site).map((l) => `<li>${l.html}</li>`).join("")}
          <li><a href="${CTA_HREF}">Send a project inquiry</a></li>
        </ul>
      </div>
      ${site.social?.length ? `<div><h2>Follow</h2><ul class="footer-links">${site.social.map((s) => `<li><a href="${esc(s.url)}" rel="me noopener">${esc(s.label)}</a></li>`).join("")}</ul></div>` : ""}
    </div>
    <div class="footer-bottom">
      <span>© ${year} ${esc(site.name)}. All rights reserved.</span>
      <a href="/privacy/">Privacy notice</a>
    </div>
  </div>
</footer>`;
}

/** Wraps page content in the full HTML document. */
export function layout({ site, page, assets, body = page.body, year = new Date().getFullYear() }) {
  return `${head({ site, page, assets })}
<body>
${header(site, page.path)}
<main id="main" tabindex="-1">
${body}
</main>
${footer(site, year)}
<script src="/js/site.js?v=${assets.js}" defer></script>
${page.scripts || ""}
</body>
</html>
`;
}

export const ctaBand = ({ title = "Have a landscaping idea? I'd love to hear about it.", text = "Whether it's one garden bed or the whole yard, tell me what you have in mind. I'll listen first and help you figure out a good next step." } = {}) => `
<section class="section" aria-labelledby="cta-title">
  <div class="container">
    <div class="cta-band">
      <span class="eyebrow eyebrow--on-dark">Start a conversation</span>
      <h2 id="cta-title">${esc(title)}</h2>
      <p>${esc(text)}</p>
      <a class="btn btn-light" href="${CTA_HREF}">Start Your Project ${icons.arrow}</a>
    </div>
  </div>
</section>`;
