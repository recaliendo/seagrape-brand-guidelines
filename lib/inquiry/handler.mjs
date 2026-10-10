// HTTP handler for POST /api/inquiry, written against the web-standard Request/Response API
// so it runs on Netlify Functions, in the local dev server, and in tests.

import { validateInquiry } from "./schema.mjs";
import { deliverInquiry, getNotifyConfig } from "./notify.mjs";

const MAX_BODY_BYTES = 20_000;
const MIN_FILL_MS = 2_500; // faster than a person can fill the form

/** Fixed-window limiter per client key. Memory is per function instance, so treat it as best effort. */
export function createRateLimiter({ limit = 5, windowMs = 10 * 60_000 } = {}) {
  const hits = new Map();
  return {
    allow(key, now = Date.now()) {
      const entry = hits.get(key);
      if (!entry || now - entry.start > windowMs) {
        hits.set(key, { start: now, count: 1 });
        if (hits.size > 5000) hits.clear();
        return true;
      }
      entry.count += 1;
      return entry.count <= limit;
    },
  };
}

/** Remembers recently delivered inquiries so a double-click or resubmit doesn't notify twice. */
export function createDedupe({ ttlMs = 15 * 60_000 } = {}) {
  const seen = new Map();
  return {
    has(key, now = Date.now()) {
      const t = seen.get(key);
      return t !== undefined && now - t < ttlMs;
    },
    add(key, now = Date.now()) {
      if (seen.size > 2000) seen.clear();
      seen.set(key, now);
    },
  };
}

async function fingerprint(d) {
  const raw = [d.email, d.phone.replace(/\D/g, ""), d.description].join("|").toLowerCase();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

const MESSAGES = {
  invalid: "Some details need another look. Please check the highlighted fields.",
  not_configured:
    "The online form isn't connected yet, so your message could not be sent. Please reach out directly using the contact details on this page.",
  delivery_failed:
    "Your inquiry couldn't be sent just now. Nothing was submitted. Please try again in a few minutes, or reach out directly.",
  rate_limited: "Several messages came from your connection in a short time. Please wait a few minutes and try again.",
  too_fast: "That was quicker than we expected. Please review your details and submit again.",
  too_large: "Your message is too long. Please shorten the description and try again.",
  bad_request: "That submission couldn't be read. Please refresh the page and try again.",
};

function htmlPage(title, message, ok) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><link rel="stylesheet" href="/css/site.css"></head><body><main class="section"><div class="container prose"><h1>${esc(title)}</h1><p>${esc(message)}</p><p><a class="btn btn-primary" href="/contact/#inquiry">${ok ? "Back to the site" : "Back to the form"}</a></p></div></main></body></html>`;
}

export function createInquiryHandler({
  env = typeof process !== "undefined" ? process.env : {},
  fetchImpl = (...a) => fetch(...a),
  now = () => new Date(),
  limiter = createRateLimiter(),
  dedupe = createDedupe(),
  log = console,
} = {}) {
  return async function handleInquiry(request, context = {}) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
    }

    const type = (request.headers.get("content-type") || "").toLowerCase();
    const wantsJson = type.includes("application/json") || (request.headers.get("accept") || "").includes("application/json");

    const reply = (status, code, extra = {}) => {
      const ok = status < 300;
      if (wantsJson) {
        return Response.json(ok ? { ok: true, ...extra } : { ok: false, error: code, message: MESSAGES[code], ...extra }, {
          status,
          headers: { "Cache-Control": "no-store" },
        });
      }
      if (ok) return new Response(null, { status: 303, headers: { Location: "/thank-you/" } });
      let msg = MESSAGES[code];
      if (extra.errors) msg += " " + Object.values(extra.errors).join(" ");
      return new Response(htmlPage("Your inquiry wasn't sent", msg, false), {
        status,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    };

    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > MAX_BODY_BYTES) return reply(413, "too_large");

    let raw;
    try {
      const bodyText = await request.text();
      if (bodyText.length > MAX_BODY_BYTES) return reply(413, "too_large");
      raw = type.includes("application/json") ? JSON.parse(bodyText) : Object.fromEntries(new URLSearchParams(bodyText));
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("bad body");
    } catch {
      return reply(400, "bad_request");
    }

    // Spam trap: real visitors never see or fill the "website" field. Bots get a normal-looking reply.
    if (raw.website) {
      log.info?.("inquiry: honeypot triggered");
      return reply(200, "ok");
    }

    const startedAt = Number(raw.startedAt);
    if (Number.isFinite(startedAt) && startedAt > 0 && now().getTime() - startedAt < MIN_FILL_MS) {
      return reply(400, "too_fast");
    }

    const clientKey =
      context.ip || request.headers.get("x-nf-client-connection-ip") || (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    if (!limiter.allow(clientKey, now().getTime())) {
      log.warn?.("inquiry: rate limited");
      return reply(429, "rate_limited");
    }

    const { ok, data, errors } = validateInquiry(raw);
    if (!ok) return reply(422, "invalid", { errors });

    const config = getNotifyConfig(env);
    if (!config.email && !config.sms) {
      log.error?.("inquiry: no notification channel configured (set RESEND_API_KEY, INQUIRY_TO_EMAIL, INQUIRY_FROM_EMAIL)");
      return reply(503, "not_configured");
    }

    const key = await fingerprint(data);
    if (dedupe.has(key, now().getTime())) return reply(200, "ok", { duplicate: true });

    const result = await deliverInquiry(data, { config, fetchImpl, submittedAt: now() });
    // Log channel status only, never customer details.
    log.info?.(`inquiry: delivery ${result.delivered ? "succeeded" : "failed"} ${JSON.stringify(result.channels)}`);

    if (!result.delivered) return reply(502, "delivery_failed");
    dedupe.add(key, now().getTime());
    return reply(200, "ok");
  };
}
