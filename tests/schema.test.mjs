import { test } from "node:test";
import assert from "node:assert/strict";
import { validateInquiry, clean, LIMITS } from "../lib/inquiry/schema.mjs";

export const valid = () => ({
  name: "Test Visitor",
  email: "visitor@example.com",
  phone: "",
  location: "Plantation 33324",
  projectType: "Garden refresh",
  budget: "",
  timeframe: "",
  description: "Our front beds are overgrown and we'd like a tidy refresh.",
  additional: "",
  contactMethod: "No preference",
});

test("accepts a complete inquiry with email only", () => {
  const r = validateInquiry(valid());
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test("accepts phone instead of email", () => {
  const r = validateInquiry({ ...valid(), email: "", phone: "(954) 555-0123" });
  assert.equal(r.ok, true);
});

test("requires email or phone", () => {
  const r = validateInquiry({ ...valid(), email: "", phone: "" });
  assert.equal(r.ok, false);
  assert.ok(r.errors.email && r.errors.phone);
});

test("requires name, location, project type and description", () => {
  const r = validateInquiry({ ...valid(), name: " ", location: "", projectType: "", description: "" });
  for (const f of ["name", "location", "projectType", "description"]) assert.ok(r.errors[f], `missing error for ${f}`);
});

test("budget and timeframe are optional but must come from the list", () => {
  assert.equal(validateInquiry({ ...valid(), budget: "", timeframe: "" }).ok, true);
  assert.equal(validateInquiry({ ...valid(), budget: "$3,000–$7,500", timeframe: "Within 1 month" }).ok, true);
  const r = validateInquiry({ ...valid(), budget: "a million", timeframe: "yesterday" });
  assert.ok(r.errors.budget && r.errors.timeframe);
});

test("rejects malformed email and phone", () => {
  for (const email of ["nope", "a@b", "a b@c.com", "x@y.com\r\nBcc: z@q.com"]) {
    assert.ok(validateInquiry({ ...valid(), email }).errors.email, `accepted ${JSON.stringify(email)}`);
  }
  assert.ok(validateInquiry({ ...valid(), phone: "12345" }).errors.phone);
  assert.equal(validateInquiry({ ...valid(), phone: "+1 954 555 0123" }).ok, true);
});

test("contact method must match the details given", () => {
  assert.ok(validateInquiry({ ...valid(), contactMethod: "Phone call" }).errors.phone);
  assert.ok(validateInquiry({ ...valid(), email: "", phone: "9545550123", contactMethod: "Email" }).errors.email);
  assert.ok(validateInquiry({ ...valid(), contactMethod: "Carrier pigeon" }).errors.contactMethod);
});

test("text message requires a phone and explicit consent", () => {
  const base = { ...valid(), phone: "9545550123", contactMethod: "Text message" };
  assert.ok(validateInquiry(base).errors.smsConsent);
  assert.equal(validateInquiry({ ...base, smsConsent: "yes" }).ok, true);
  assert.equal(validateInquiry({ ...valid(), smsConsent: true }).data.smsConsent, false, "consent only kept for text");
});

test("enforces length limits", () => {
  const r = validateInquiry({ ...valid(), description: "x".repeat(LIMITS.description + 1), name: "n".repeat(LIMITS.name + 1) });
  assert.ok(r.errors.description && r.errors.name);
});

test("strips line breaks and control characters from single-line fields", () => {
  assert.equal(clean("Jane\r\nBcc: x@y.com"), "Jane Bcc: x@y.com");
  assert.equal(clean("a\u0000b\u0007c"), "a b c");
  assert.equal(clean("line one\r\nline two", { multiline: true }), "line one\nline two");
  assert.equal(validateInquiry({ ...valid(), name: "Jane\nDoe" }).data.name, "Jane Doe");
});
