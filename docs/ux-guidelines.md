# UX guidelines

## Customer journey

**Discover → Explore → Build trust → Submit inquiry**

| Stage | Where it happens | What the visitor needs |
|---|---|---|
| Discover | Home hero, Google results | "This is a local landscape designer who'll listen to me." |
| Explore | Services & Projects, style gallery | "They can do the kind of thing I want, big or small." |
| Build trust | Owner-operated intro, plant guide, honest labels | "They know South Florida plants and don't oversell." |
| Submit | Contact page form | "This is quick, and I know what happens next." |

## Information architecture

```
/                       Home (conversion landing page)
/services-projects/     Services, project-size message, style gallery, planning FAQ
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

- Illustrations are labeled "Style reference". Real photos can be labeled "Completed project" only when they are.
- Plant facts cite UF/IFAS sources on the page.
- No fake reviews, badges, counts or social links.
- The privacy notice is linked from the form and the footer.
- Contact details are shown only when the owner has provided real ones.
