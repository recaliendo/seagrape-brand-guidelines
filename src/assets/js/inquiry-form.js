// Project inquiry form: inline validation (same rules as the server), submission, and clear status messages.
// Without JavaScript the form still posts to /api/inquiry and the server responds with a page.
import { validateInquiry } from "./schema.mjs";

const form = document.getElementById("inquiry-form");
const statusBox = document.getElementById("form-status");
const submitBtn = document.getElementById("submit-btn");
const consent = document.getElementById("sms-consent");

if (form) {
  const started = document.getElementById("f-started");
  if (started) started.value = String(Date.now());
  const btnLabel = submitBtn.querySelector(".btn-label");
  const defaultLabel = btnLabel.textContent;
  let submitting = false;
  let touched = false;

  const values = () => {
    const fd = new FormData(form);
    const out = Object.fromEntries(fd.entries());
    out.smsConsent = form.elements.smsConsent.checked;
    return out;
  };

  const syncConsent = () => {
    const method = form.elements.contactMethod.value;
    consent.hidden = method !== "Text message";
    if (consent.hidden) form.elements.smsConsent.checked = false;
  };
  syncConsent();

  const control = (name) => {
    const el = form.elements[name];
    return el && el.length && !el.tagName ? el[0] : el;
  };

  function showErrors(errors) {
    form.querySelectorAll("[data-field]").forEach((wrap) => {
      const name = wrap.dataset.field;
      const msg = errors[name];
      const err = wrap.querySelector(".field-error");
      wrap.classList.toggle("has-error", Boolean(msg));
      if (err) err.textContent = msg || "";
      const c = control(name);
      if (c && c.setAttribute) msg ? c.setAttribute("aria-invalid", "true") : c.removeAttribute("aria-invalid");
    });
  }

  function setStatus(kind, html) {
    if (!kind) {
      statusBox.hidden = true;
      statusBox.innerHTML = "";
      return;
    }
    statusBox.className = `alert alert--${kind}`;
    statusBox.innerHTML = html;
    statusBox.hidden = false;
    statusBox.focus();
  }

  function setSubmitting(on) {
    submitting = on;
    submitBtn.disabled = on;
    submitBtn.setAttribute("aria-busy", String(on));
    form.classList.toggle("is-submitting", on);
    btnLabel.textContent = on ? "Sending…" : defaultLabel;
  }

  const LABELS = {
    name: "Full name", email: "Email", phone: "Phone", location: "Project location", projectType: "Project type",
    budget: "Budget", timeframe: "Timeframe", description: "Project description", additional: "Additional information",
    contactMethod: "Contact method", smsConsent: "Text message consent",
  };
  const labelFor = (name) => LABELS[name] || name;

  function errorSummary(errors) {
    const missingBoth = errors.email && errors.phone && !form.elements.email.value && !form.elements.phone.value;
    const items = Object.entries(errors)
      .filter(([name]) => !(missingBoth && name === "phone"))
      .map(([name, msg]) => {
        const c = control(name);
        const target = c && c.id ? `#${c.id}` : "#inquiry-form";
        const label = missingBoth && name === "email" ? "Email or phone" : labelFor(name);
        return `<li><a href="${target}">${label}: ${msg}</a></li>`;
      });
    return `<h2>Please check ${items.length === 1 ? "one detail" : `${items.length} details`}</h2><ul>${items.join("")}</ul>`;
  }

  // Re-validate as people correct things, but only after the first submit attempt.
  form.addEventListener("input", () => {
    if (touched) showErrors(validateInquiry(values()).errors);
  });
  form.addEventListener("change", (e) => {
    if (e.target.name === "contactMethod") syncConsent();
    if (touched) showErrors(validateInquiry(values()).errors);
  });

  statusBox.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const el = document.querySelector(a.getAttribute("href"));
    if (el) {
      e.preventDefault();
      el.focus();
      el.scrollIntoView({ block: "center" });
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitting) return; // blocks double submits
    touched = true;

    const raw = values();
    const result = validateInquiry(raw);
    showErrors(result.errors);
    if (!result.ok) {
      setStatus("error", errorSummary(result.errors));
      return;
    }

    setStatus(null);
    setSubmitting(true);
    let res, body;
    try {
      res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(raw),
      });
      body = await res.json().catch(() => ({}));
    } catch {
      setSubmitting(false);
      setStatus("error", `<h2>Your inquiry wasn't sent</h2><p>We couldn't reach the server. Please check your internet connection and try again. Your answers are still filled in.</p>`);
      return;
    }

    if (res.ok && body.ok) {
      form.reset();
      form.hidden = true;
      statusBox.className = "alert alert--success form-success";
      statusBox.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 24.5l6 6 12-13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><h2>Thank you. Your inquiry was sent.</h2><p>We'll read it carefully and get back to you using the contact method you chose.</p>`;
      statusBox.hidden = false;
      statusBox.focus();
      statusBox.scrollIntoView({ block: "center" });
      return;
    }

    setSubmitting(false);
    if (res.status === 422 && body.errors) {
      showErrors(body.errors);
      setStatus("error", errorSummary(body.errors));
      return;
    }
    const message = body.message || "Something went wrong and your inquiry wasn't sent. Please try again in a few minutes.";
    setStatus("error", `<h2>Your inquiry wasn't sent</h2><p>${message.replace(/</g, "&lt;")}</p><p>Your answers are still filled in.</p>`);
  });
}
