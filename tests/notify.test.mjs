import { test } from "node:test";
import assert from "node:assert/strict";
import { formatEmail, formatSms, sendEmail, sendSms, getNotifyConfig, deliverInquiry } from "../lib/inquiry/notify.mjs";
import { validateInquiry } from "../lib/inquiry/schema.mjs";

const inquiry = () =>
  validateInquiry({
    name: "Ana <script>alert(1)</script>",
    email: "ana@example.com",
    phone: "954-555-0123",
    location: "Davie",
    projectType: "Tropical landscaping",
    budget: "$3,000–$7,500",
    timeframe: "Within 1–3 months",
    description: "Lush pool-side planting.\nNothing too high-maintenance.",
    additional: "Two dogs.",
    contactMethod: "Email",
  }).data;

function mockFetch(status = 200) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    return new Response("{}", { status });
  };
  fn.calls = calls;
  return fn;
}

test("config needs every value before enabling a channel", () => {
  assert.deepEqual(getNotifyConfig({}).email, null);
  assert.equal(getNotifyConfig({ RESEND_API_KEY: "k", INQUIRY_TO_EMAIL: "o@x.com" }).email, null);
  const c = getNotifyConfig({ RESEND_API_KEY: "k", INQUIRY_TO_EMAIL: "a@x.com, b@x.com", INQUIRY_FROM_EMAIL: "s@x.com" });
  assert.deepEqual(c.email.to, ["a@x.com", "b@x.com"]);
  assert.equal(c.sms, null);
});

test("email contains every field, escapes HTML and has a single-line subject", () => {
  const d = inquiry();
  const { subject, text, html } = formatEmail(d, { siteName: "Seagrape", submittedAt: new Date("2026-10-10T14:00:00Z") });
  assert.ok(!/[\r\n]/.test(subject));
  for (const v of [d.email, d.phone, d.location, d.projectType, d.budget, d.timeframe, "Two dogs.", "Email", "Oct 10, 2026"]) {
    assert.ok(text.includes(v), `text missing ${v}`);
  }
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Lush pool-side planting.<br>Nothing"));
});

test("SMS is short and omits the long details", () => {
  const d = { ...inquiry(), description: "x".repeat(1000) };
  const s = formatSms(d, { siteName: "Seagrape" });
  assert.ok(s.length <= 480);
  assert.ok(s.includes("954-555-0123") && s.includes("Tropical landscaping"));
  assert.ok(!s.includes("Two dogs"));
});

test("sendEmail posts to Resend with auth, reply-to, and no secret in the body", async () => {
  const f = mockFetch();
  await sendEmail({ apiKey: "secret-key", to: ["o@x.com"], from: "s@x.com" }, inquiry(), { fetchImpl: f });
  assert.equal(f.calls.length, 1);
  const { url, init } = f.calls[0];
  assert.equal(url, "https://api.resend.com/emails");
  assert.equal(init.headers.Authorization, "Bearer secret-key");
  const body = JSON.parse(init.body);
  assert.equal(body.reply_to, "ana@example.com");
  assert.deepEqual(body.to, ["o@x.com"]);
  assert.ok(!init.body.includes("secret-key"));
});

test("sendEmail throws on provider errors and network failures", async () => {
  await assert.rejects(sendEmail({ apiKey: "k", to: ["o@x.com"], from: "s@x.com" }, inquiry(), { fetchImpl: mockFetch(422) }), /HTTP 422/);
  await assert.rejects(
    sendEmail({ apiKey: "k", to: ["o@x.com"], from: "s@x.com" }, inquiry(), { fetchImpl: async () => { throw new Error("offline"); } }),
    /email delivery failed/
  );
});

test("sendSms uses Twilio basic auth and form encoding", async () => {
  const f = mockFetch(201);
  await sendSms({ sid: "AC123", token: "tok", from: "+19545550000", to: "+19545550001" }, inquiry(), { fetchImpl: f });
  const { url, init } = f.calls[0];
  assert.equal(url, "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json");
  assert.equal(init.headers.Authorization, "Basic " + Buffer.from("AC123:tok").toString("base64"));
  assert.equal(init.body.get("To"), "+19545550001");
});

test("delivery rules: email must succeed when configured; SMS alone works when email isn't set up", async () => {
  const email = { apiKey: "k", to: ["o@x.com"], from: "s@x.com" };
  const sms = { sid: "AC1", token: "t", from: "+1", to: "+2" };
  const byUrl = (emailStatus, smsStatus) => async (url) => new Response("{}", { status: url.includes("resend") ? emailStatus : smsStatus });

  assert.equal((await deliverInquiry(inquiry(), { config: { email, sms: null }, fetchImpl: byUrl(200, 0) })).delivered, true);
  assert.equal((await deliverInquiry(inquiry(), { config: { email, sms }, fetchImpl: byUrl(500, 201) })).delivered, false);
  const r = await deliverInquiry(inquiry(), { config: { email, sms }, fetchImpl: byUrl(200, 500) });
  assert.equal(r.delivered, true);
  assert.equal(r.channels.sms, "failed:500");
  assert.equal((await deliverInquiry(inquiry(), { config: { email: null, sms }, fetchImpl: byUrl(0, 201) })).delivered, true);
  assert.deepEqual(await deliverInquiry(inquiry(), { config: { email: null, sms: null } }), { delivered: false, configured: false, channels: {} });
});
