import { test } from "node:test";
import assert from "node:assert/strict";
import { createInquiryHandler, createRateLimiter } from "../lib/inquiry/handler.mjs";

const ENV = { RESEND_API_KEY: "test-secret", INQUIRY_TO_EMAIL: "owner@example.com", INQUIRY_FROM_EMAIL: "site@example.com" };
const quiet = { info() {}, warn() {}, error() {} };

const payload = (over = {}) => ({
  name: "Test Visitor",
  email: "visitor@example.com",
  phone: "",
  location: "Weston",
  projectType: "New landscape design",
  description: "A new design for our backyard, mostly natives.",
  contactMethod: "Email",
  ...over,
});

function setup({ env = ENV, status = 200, ...opts } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return new Response("{}", { status });
  };
  const handler = createInquiryHandler({ env, fetchImpl, log: quiet, ...opts });
  return { handler, calls };
}

const post = (body, headers = { "content-type": "application/json", accept: "application/json" }) =>
  new Request("http://localhost/api/inquiry", { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) });

test("rejects non-POST requests", async () => {
  const { handler } = setup();
  const res = await handler(new Request("http://localhost/api/inquiry"));
  assert.equal(res.status, 405);
});

test("valid inquiry is delivered once and reports success", async () => {
  const { handler, calls } = setup();
  const res = await handler(post(payload()));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /resend/);
});

test("never reports success when no channel is configured", async () => {
  const { handler, calls } = setup({ env: {} });
  const res = await handler(post(payload()));
  const body = await res.json();
  assert.equal(res.status, 503);
  assert.equal(body.ok, false);
  assert.equal(body.error, "not_configured");
  assert.equal(calls.length, 0);
});

test("provider failure returns an error, not a false success", async () => {
  const { handler } = setup({ status: 500 });
  const res = await handler(post(payload()));
  const body = await res.json();
  assert.equal(res.status, 502);
  assert.equal(body.ok, false);
  assert.ok(!JSON.stringify(body).includes("test-secret"), "secret leaked in response");
});

test("invalid input returns field errors and sends nothing", async () => {
  const { handler, calls } = setup();
  const res = await handler(post(payload({ email: "", phone: "", description: "" })));
  const body = await res.json();
  assert.equal(res.status, 422);
  assert.ok(body.errors.email && body.errors.description);
  assert.equal(calls.length, 0);
});

test("honeypot submissions are dropped quietly", async () => {
  const { handler, calls } = setup();
  const res = await handler(post(payload({ website: "http://spam.example" })));
  assert.equal(res.status, 200);
  assert.equal(calls.length, 0);
});

test("submissions faster than a person could type are refused", async () => {
  const now = new Date("2026-10-10T12:00:00Z");
  const { handler, calls } = setup({ now: () => now });
  const res = await handler(post(payload({ startedAt: now.getTime() - 500 })));
  assert.equal(res.status, 400);
  assert.equal(calls.length, 0);
});

test("duplicate submissions are delivered only once", async () => {
  const { handler, calls } = setup();
  await handler(post(payload()));
  const res = await handler(post(payload()));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).duplicate, true);
  assert.equal(calls.length, 1);
});

test("a failed delivery can be retried (not marked as duplicate)", async () => {
  let status = 500;
  const calls = [];
  const handler = createInquiryHandler({ env: ENV, log: quiet, fetchImpl: async (u) => (calls.push(u), new Response("{}", { status })) });
  assert.equal((await handler(post(payload()))).status, 502);
  status = 200;
  assert.equal((await handler(post(payload()))).status, 200);
  assert.equal(calls.length, 2);
});

test("rate limits repeated submissions from one client", async () => {
  const { handler } = setup({ limiter: createRateLimiter({ limit: 2, windowMs: 60_000 }) });
  const ctx = { ip: "203.0.113.9" };
  await handler(post(payload({ description: "First request with enough detail." })), ctx);
  await handler(post(payload({ description: "Second request with enough detail." })), ctx);
  const res = await handler(post(payload({ description: "Third request with enough detail." })), ctx);
  assert.equal(res.status, 429);
});

test("rejects oversized and unreadable bodies", async () => {
  const { handler } = setup();
  assert.equal((await handler(post({ ...payload(), description: "x".repeat(25_000) }))).status, 413);
  assert.equal((await handler(post("{not json"))).status, 400);
  assert.equal((await handler(post("[1,2]"))).status, 400);
});

test("form posts without JavaScript redirect on success and explain errors", async () => {
  const { handler } = setup();
  const form = (o) => post(new URLSearchParams(payload(o)).toString(), { "content-type": "application/x-www-form-urlencoded" });
  const ok = await handler(form());
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get("location"), "/thank-you/");

  const bad = await handler(form({ name: "", description: "Another valid description here." }));
  assert.equal(bad.status, 422);
  assert.match(bad.headers.get("content-type"), /text\/html/);
  assert.match(await bad.text(), /Please enter your name/);
});

test("header-injection attempts in name are neutralized before sending", async () => {
  const { handler, calls } = setup();
  await handler(post(payload({ name: "Eve\r\nBcc: victim@example.com" })));
  const sent = JSON.parse(calls[0].init.body);
  assert.ok(!/[\r\n]/.test(sent.subject));
  assert.ok(!("bcc" in sent));
});
