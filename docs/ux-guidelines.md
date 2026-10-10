# UX guidelines

## Customer journey

**Discover → Explore landscaping ideas → Build trust → Submit inquiry**

| Stage | Where it happens | What the visitor needs |
|---|---|---|
| Discover | Home hero, Google results | "This is a local landscape designer who'll listen to me." |
| Explore ideas | Home inspiration mosaic → Services & Projects gallery | "I can picture what my yard could look like." |
| Build trust | Meet Robert, plant guide, honest photo labels, customer reviews (once real ones exist) | "They know South Florida plants, real people liked working with them, and they don't oversell." |
| Submit | Contact page form | "This is quick, and I know what happens next." |

### Home page order

Hero → **Meet Robert** → Services → **Inspiration mosaic** → How we work → Plants → **Customer reviews** (hidden until real ones exist) → final CTA.

Meet Robert comes right after the hero so visitors meet the person before browsing services. The full story stays on the Home page (an excerpt plus "Read more of my story") rather than a separate About page, which keeps the main navigation at four items. The footer links to it as "Meet Robert" (`/#meet-robert`).

Reviews sit just before the final CTA so trust peaks right before the ask. With no reviews, the page flows straight from Plants to the CTA with no gap or empty heading.

### Gallery decisions

- 8 photos across 6 styles. Category filtering was left out: with one or two photos per category, filters would mostly show near-empty results. Revisit at around 15+ items.
- Each style shows its category, a caption about the design idea, where it was photographed, and its credit.
- The "Inspired by something you see?" panel sits directly under the gallery, where interest is highest, and links to `/contact/#inquiry`.

## Information architecture

```
/                       Home (conversion landing page)
/services-projects/     Services, project-size message, inspiration gallery (#inspiration), planning FAQ
/south-florida-plants/  Growing conditions, plant profiles, invasive-plant note, sources
/contact/               Inquiry form + contact details + what happens next
/privacy/               Privacy notice (footer link)
/thank-you/             Success page for no-JavaScript submissions (noindex)
/404.html               Not found
```

Primary navigation is exactly four items plus the CTA. Don't add more top-level pages without removing one.

## Calls to action

- **Primary:** "Start Your Project" → `/contact/#inquiry`. It appears in the header on every page, in the hero, and in the CTA band at the end of every main page.
- **Secondary:** "Explore Our Work" (hero) and "See all services" / "Visit the plant guide" text links.
- Service rows end with "Ask about [service]" links to the form.
- Avoid competing primary buttons in the same view.

## Inquiry conversion strategy

1. **Low commitment.** "Tell us about your space. A short note is plenty."
2. **Email or phone.** Visitors pick what they're comfortable sharing; only one is required.
3. **Optional budget and timeframe.** Labeled as estimates, not commitments, so they don't scare people off.
4. **Expectations set.** The sidebar explains what happens after submitting.
5. **Small projects welcomed explicitly**, on the Services page and in the FAQ.

## Mobile experience

- Thumb-friendly targets (44–48px minimum).
- Correct keyboards: `type="email"`, `type="tel"`, `inputmode`.
- `autocomplete` on name, email, phone and city.
- The form stacks to one column; the contact details move below it.
- No horizontal scrolling at 375px (checked across all pages at 375, 768, 1024 and 1440px).

## Form usability

| Field | Required | Notes |
|---|---|---|
| Full name | Yes | |
| Email | One of email/phone | Format checked |
| Phone | One of email/phone | 10-digit US number |
| Preferred contact method | Defaults to "No preference" | Email/Phone/Text require the matching detail |
| Text consent | Only if "Text message" is chosen | Appears only when relevant |
| Project location | Yes | City or ZIP |
| Project type | Yes | 10 options including "Not sure yet" |
| Budget | No | Estimate only |
| Timeframe | No | |
| Project description | Yes | At least 10 characters, max 3,000 |
| Additional information | No | |

Validation runs only after the first submit attempt, then live as people correct things, so no one sees red before they've typed. The same rules run on the server (`lib/inquiry/schema.mjs` is shared).

**States:** idle → sending (button disabled, spinner) → success (form replaced by a confirmation) or error (form kept filled in, message explains what to do). A network failure, provider error, or unconfigured email never shows success.

## Trust considerations

- Third-party photos are labeled "Landscape design inspiration" with a notice and per-photo credits. Photos can be labeled "Completed project" only when they are.
- Plant facts cite UF/IFAS sources on the page.
- No fake reviews, badges, counts or social links. Reviews appear only when real, verified and shared with permission; stars only for linked Google reviews.
- The privacy notice is linked from the form and the footer.
- Contact details are shown only when the owner has provided real ones.
