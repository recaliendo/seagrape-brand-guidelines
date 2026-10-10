// Inquiry form rules shared by the browser (dist/js/schema.mjs) and the server.
// Keep this file dependency-free: it runs in both environments.

export const PROJECT_TYPES = [
  "New landscape design",
  "Garden refresh",
  "Plant installation",
  "Tropical landscaping",
  "Front yard improvement",
  "Backyard improvement",
  "Small landscaping project",
  "Larger landscape transformation",
  "Not sure yet",
  "Other",
];

export const BUDGETS = [
  "Under $1,000",
  "$1,000–$3,000",
  "$3,000–$7,500",
  "$7,500–$15,000",
  "$15,000–$30,000",
  "$30,000+",
  "Not sure / need guidance",
];

export const TIMEFRAMES = [
  "As soon as possible",
  "Within 1 month",
  "Within 1–3 months",
  "Within 3–6 months",
  "Flexible / exploring options",
];

export const CONTACT_METHODS = ["Email", "Phone call", "Text message", "No preference"];

export const LIMITS = {
  name: 100,
  email: 254,
  phone: 30,
  location: 100,
  description: 3000,
  additional: 2000,
};

const LINE_SEPARATORS = new RegExp("[" + String.fromCharCode(0x2028, 0x2029) + "]", "g");
const EMAIL_RE = /^[^\s@<>()[\]",;:\\]+@[^\s@<>()[\]",;:\\]+\.[^\s@<>()[\]",;:\\]{2,}$/;

// Removes control characters. Multiline fields keep \n; single-line fields lose all line breaks,
// which also blocks header injection through the name or email.
export function clean(value, { multiline = false } = {}) {
  if (value == null) return "";
  let s = String(value).replace(/\r\n?/g, "\n");
  s = multiline
    ? s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    : s.replace(/[\u0000-\u001F\u007F]+/g, " ");
  s = s.replace(LINE_SEPARATORS, multiline ? "\n" : " ");
  return multiline ? s.trim().replace(/\n{3,}/g, "\n\n") : s.trim().replace(/\s{2,}/g, " ");
}

export function phoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

export function isValidPhone(phone) {
  const d = phoneDigits(phone);
  return d.length === 10 || (d.length === 11 && d.startsWith("1"));
}

export function isValidEmail(email) {
  return email.length <= LIMITS.email && EMAIL_RE.test(email);
}

const asBool = (v) => v === true || v === "true" || v === "on" || v === "yes" || v === "1";

/**
 * Validates and normalizes raw form input.
 * @returns {{ ok: boolean, data: object, errors: Record<string,string> }}
 */
export function validateInquiry(input = {}) {
  const data = {
    name: clean(input.name),
    email: clean(input.email).toLowerCase(),
    phone: clean(input.phone),
    location: clean(input.location),
    projectType: clean(input.projectType),
    budget: clean(input.budget),
    timeframe: clean(input.timeframe),
    description: clean(input.description, { multiline: true }),
    additional: clean(input.additional, { multiline: true }),
    contactMethod: clean(input.contactMethod) || "No preference",
    smsConsent: asBool(input.smsConsent),
  };
  const errors = {};

  for (const [field, max] of Object.entries(LIMITS)) {
    if (data[field].length > max) errors[field] = `Please keep this under ${max} characters.`;
  }

  if (!data.name) errors.name = "Please enter your name.";

  if (!data.email && !data.phone) {
    errors.email = "Please give us an email address or a phone number so we can reply.";
    errors.phone = "Please give us a phone number or an email address so we can reply.";
  }
  if (data.email && !errors.email && !isValidEmail(data.email)) {
    errors.email = "Please check the email address, for example name@example.com.";
  }
  if (data.phone && !errors.phone && !isValidPhone(data.phone)) {
    errors.phone = "Please enter a 10-digit U.S. phone number, for example 954-555-0123.";
  }

  if (!data.location) errors.location = "Please tell us the city or ZIP code of the property.";

  if (!PROJECT_TYPES.includes(data.projectType)) errors.projectType = "Please choose the type of project.";
  if (data.budget && !BUDGETS.includes(data.budget)) errors.budget = "Please choose a budget range from the list.";
  if (data.timeframe && !TIMEFRAMES.includes(data.timeframe)) errors.timeframe = "Please choose a timeframe from the list.";

  if (!data.description) errors.description = "Please tell us a little about your project.";
  else if (data.description.length < 10 && !errors.description) errors.description = "Please add a few more details about your project.";

  if (!CONTACT_METHODS.includes(data.contactMethod)) {
    errors.contactMethod = "Please choose how you'd like us to contact you.";
  } else if (data.contactMethod === "Email" && !data.email && !errors.email) {
    errors.email = "You chose email, so please add your email address.";
  } else if ((data.contactMethod === "Phone call" || data.contactMethod === "Text message") && !data.phone && !errors.phone) {
    errors.phone = `You chose ${data.contactMethod.toLowerCase()}, so please add your phone number.`;
  }
  if (data.contactMethod === "Text message" && !data.smsConsent) {
    errors.smsConsent = "Please confirm it's okay to text you about this inquiry, or choose another contact method.";
  }
  if (data.contactMethod !== "Text message") data.smsConsent = false;

  return { ok: Object.keys(errors).length === 0, data, errors };
}
