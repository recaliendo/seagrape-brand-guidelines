// Turns content/reviews.json into the reviews the site may show.
// Only verified reviews shared with permission are published; stars only for linked Google reviews.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "Maria Gonzalez" → "Maria G."; "Maria G." stays; a single name stays as-is. */
export function displayName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts.join("");
  const last = parts[parts.length - 1].replace(/\.$/, "");
  return `${parts.slice(0, -1).join(" ")} ${last.charAt(0).toUpperCase()}.`;
}

/** "2026-11" or "2026-11-03" → { label: "November 2026", iso: "2026-11" }. Anything else is ignored. */
export function formatReviewDate(date) {
  const m = String(date || "").match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null;
  return { label: `${MONTHS[Number(m[2]) - 1]} ${m[1]}`, iso: m[3] ? `${m[1]}-${m[2]}-${m[3]}` : `${m[1]}-${m[2]}` };
}

const isHttps = (u) => {
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
};

/** Accepts Google Business Profile review links (g.page, google.*, maps.app.goo.gl). */
export function isGoogleReviewUrl(url) {
  if (!isHttps(url)) return false;
  const host = new URL(url).hostname.toLowerCase();
  return host === "g.page" || host === "maps.app.goo.gl" || host === "g.co" || /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host);
}

export function prepareReviews(data = {}, { allowSamples = false } = {}) {
  const warnings = [];
  const items = [];
  for (const [i, r] of (data.items || []).entries()) {
    const label = `reviews.json item ${i + 1}`;
    if (r.sample && !allowSamples) {
      warnings.push(`${label} is marked as a sample and was left out.`);
      continue;
    }
    if (r.verified !== true || r.permission !== true) {
      warnings.push(`${label} is hidden until "verified" and "permission" are both true.`);
      continue;
    }
    const text = String(r.text || "").trim();
    const name = displayName(r.name);
    if (!text || !name) {
      warnings.push(`${label} needs both "name" and "text".`);
      continue;
    }
    const sourceUrl = isHttps(r.sourceUrl) ? r.sourceUrl : "";
    const rating = Number(r.rating);
    const stars = r.source === "Google" && sourceUrl && Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
    if (r.rating != null && stars === null) warnings.push(`${label}: stars are shown only for Google reviews with a valid rating and sourceUrl.`);
    items.push({
      name,
      location: String(r.location || "").trim(),
      date: formatReviewDate(r.date),
      text,
      stars,
      source: String(r.source || "").trim(),
      sourceUrl,
      sample: Boolean(r.sample),
    });
  }

  let googleReviewUrl = "";
  if (data.googleReviewUrl) {
    if (isGoogleReviewUrl(data.googleReviewUrl)) googleReviewUrl = data.googleReviewUrl;
    else warnings.push("googleReviewUrl isn't a Google review link (https://g.page/..., https://search.google.com/..., etc.) and was ignored.");
  }
  return { items, googleReviewUrl, warnings };
}
