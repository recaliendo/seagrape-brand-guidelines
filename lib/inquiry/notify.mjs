// Owner notifications for website inquiries.
// Email (Resend) is the primary channel; SMS (Twilio) is optional.
// Both use the providers' REST APIs through fetch, so there are no package dependencies.

import { clean } from "./schema.mjs";

const RESEND_URL = "https://api.resend.com/emails";
const TWILIO_URL = (sid) => `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;

export class DeliveryError extends Error {
  constructor(channel, status) {
    super(`${channel} delivery failed${status ? ` (HTTP ${status})` : ""}`);
    this.channel = channel;
    this.status = status;
  }
}

/** Reads provider settings from environment variables. A channel is null unless fully configured. */
export function getNotifyConfig(env = {}) {
  const v = (k) => (env[k] || "").trim();
  const email =
    v("RESEND_API_KEY") && v("INQUIRY_TO_EMAIL") && v("INQUIRY_FROM_EMAIL")
      ? { apiKey: v("RESEND_API_KEY"), to: v("INQUIRY_TO_EMAIL").split(",").map((s) => s.trim()).filter(Boolean), from: v("INQUIRY_FROM_EMAIL") }
      : null;
  const sms =
    v("TWILIO_ACCOUNT_SID") && v("TWILIO_AUTH_TOKEN") && v("TWILIO_FROM_NUMBER") && v("OWNER_SMS_NUMBER")
      ? { sid: v("TWILIO_ACCOUNT_SID"), token: v("TWILIO_AUTH_TOKEN"), from: v("TWILIO_FROM_NUMBER"), to: v("OWNER_SMS_NUMBER") }
      : null;
  return { email, sms, siteName: v("SITE_NAME") || "your website" };
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function fields(d) {
  return [
    ["Name", d.name],
    ["Email", d.email || "—"],
    ["Phone", d.phone || "—"],
    ["Preferred contact", d.contactMethod + (d.contactMethod === "Text message" ? " (agreed to texts about this inquiry)" : "")],
    ["Project location", d.location],
    ["Project type", d.projectType],
    ["Estimated budget", d.budget || "Not given"],
    ["Timeframe", d.timeframe || "Not given"],
  ];
}

export function formatTimestamp(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date) + " ET";
}

/** Builds the owner email. All customer text is escaped for HTML and stripped of line breaks in the subject. */
export function formatEmail(d, { siteName = "your website", submittedAt = new Date() } = {}) {
  const when = formatTimestamp(submittedAt);
  const subject = clean(`New project inquiry: ${d.projectType} — ${d.name}`).slice(0, 150);
  const rows = fields(d);

  const text = [
    `New landscaping inquiry from ${siteName}`,
    `Received ${when}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Project description:",
    d.description,
    ...(d.additional ? ["", "Additional information:", d.additional] : []),
    "",
    d.email ? "Reply to this email to respond directly to the customer." : "No email given. Contact the customer by phone.",
  ].join("\n");

  const para = (s) => escapeHtml(s).replace(/\n/g, "<br>");
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F6F2EA;font-family:Helvetica,Arial,sans-serif;color:#26302A">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<p style="margin:0 0 4px;font-size:13px;color:#56615A">New inquiry from ${escapeHtml(siteName)} · ${escapeHtml(when)}</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#1E3328">${escapeHtml(d.name)}: ${escapeHtml(d.projectType)}</h1>
<table role="presentation" style="width:100%;border-collapse:collapse;background:#FFFFFF;border-radius:10px">
${rows.map(([k, v]) => `<tr><td style="padding:10px 12px;border-bottom:1px solid #EDE6D8;font-size:13px;color:#56615A;width:38%;vertical-align:top">${escapeHtml(k)}</td><td style="padding:10px 12px;border-bottom:1px solid #EDE6D8;font-size:15px">${escapeHtml(v)}</td></tr>`).join("\n")}
</table>
<h2 style="margin:20px 0 6px;font-size:16px;color:#1E3328">Project description</h2>
<p style="margin:0;font-size:15px;line-height:1.55">${para(d.description)}</p>
${d.additional ? `<h2 style="margin:20px 0 6px;font-size:16px;color:#1E3328">Additional information</h2><p style="margin:0;font-size:15px;line-height:1.55">${para(d.additional)}</p>` : ""}
<p style="margin:24px 0 0;font-size:13px;color:#56615A">${d.email ? "Reply to this email to respond directly to the customer." : "No email given. Contact the customer by phone."}</p>
</div></body></html>`;

  return { subject, text, html };
}

/** Short SMS summary for the owner. Keeps only what's needed to follow up. */
export function formatSms(d, { siteName = "website" } = {}) {
  const contact = [d.phone, d.email].filter(Boolean).join(" / ");
  const extras = [d.budget, d.timeframe].filter(Boolean).join(", ");
  const summary = d.description.replace(/\s+/g, " ").slice(0, 120);
  const body = `New ${siteName} inquiry: ${d.name} (${contact}). ${d.projectType}${extras ? `, ${extras}` : ""}. Prefers: ${d.contactMethod}. "${summary}${d.description.length > 120 ? "…" : ""}" Full details by email.`;
  return body.slice(0, 480);
}

export async function sendEmail(cfg, d, { fetchImpl = fetch, siteName, submittedAt } = {}) {
  const { subject, text, html } = formatEmail(d, { siteName, submittedAt });
  const payload = { from: cfg.from, to: cfg.to, subject, text, html };
  if (d.email) payload.reply_to = d.email; // validated, single-line address
  let res;
  try {
    res = await fetchImpl(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new DeliveryError("email");
  }
  if (!res.ok) throw new DeliveryError("email", res.status);
  return true;
}

export async function sendSms(cfg, d, { fetchImpl = fetch, siteName } = {}) {
  const body = new URLSearchParams({ To: cfg.to, From: cfg.from, Body: formatSms(d, { siteName }) });
  const auth = typeof btoa === "function" ? btoa(`${cfg.sid}:${cfg.token}`) : Buffer.from(`${cfg.sid}:${cfg.token}`).toString("base64");
  let res;
  try {
    res = await fetchImpl(TWILIO_URL(cfg.sid), {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new DeliveryError("sms");
  }
  if (!res.ok) throw new DeliveryError("sms", res.status);
  return true;
}

/**
 * Sends the inquiry through every configured channel.
 * Rules: if email is configured it must succeed. SMS is a bonus when email works,
 * and the only channel when email isn't configured.
 * @returns {{ delivered: boolean, configured: boolean, channels: Record<string,string> }}
 */
export async function deliverInquiry(d, { config, fetchImpl = fetch, submittedAt = new Date() }) {
  const { email, sms, siteName } = config;
  if (!email && !sms) return { delivered: false, configured: false, channels: {} };

  const tasks = {};
  if (email) tasks.email = sendEmail(email, d, { fetchImpl, siteName, submittedAt });
  if (sms) tasks.sms = sendSms(sms, d, { fetchImpl, siteName });

  const names = Object.keys(tasks);
  const results = await Promise.allSettled(Object.values(tasks));
  const channels = {};
  results.forEach((r, i) => {
    const e = r.reason;
    channels[names[i]] = r.status === "fulfilled" ? "sent" : e instanceof DeliveryError && e.status ? `failed:${e.status}` : "failed";
  });
  const delivered = email ? channels.email === "sent" : channels.sms === "sent";
  return { delivered, configured: true, channels };
}
