# Seagrape Landscape Design: website & brand system

Website, brand guidelines and inquiry workflow for a small, owner-operated landscape design studio in Broward County, Florida.

> **"Seagrape Landscape Design" is a working name.** Change it in [`content/site.json`](content/site.json).

**Thoughtful landscaping, personally designed.**

## Quick start

```bash
npm run dev:mock     # preview at http://localhost:8888 with a fake email provider
npm run dev:samples  # same, plus clearly labeled sample reviews (local preview only)
npm test             # 60 automated tests; nothing is sent
```

No `npm install` needed: zero dependencies, Node 20+.

## Status

| Area | Status |
|---|---|
| Four main pages, privacy, thank-you and 404 pages | ✅ Built and tested |
| Brand system, design tokens, docs | ✅ Done |
| Inquiry form (validation, accessibility, spam and duplicate protection) | ✅ Built and tested |
| Email notifications (Resend) | ⚙️ Built and tested with mocks; **needs your Resend key and verified domain** |
| SMS alerts (Twilio) | ⚙️ Optional; built and tested with mocks; needs Twilio credentials and carrier registration |
| Real business name, email, phone | ⛔ **Launch blocker:** placeholders in `content/site.json` |
| Inspiration gallery | ✅ 8 licensed, credited photos labeled "Landscape design inspiration" ([credits](docs/image-credits.md)) |
| Meet Robert section | ✅ Story live; illustrated placeholder until Robert's photo is added ([how](docs/setup-and-deployment.md#updating-roberts-story-and-photo)) |
| Customer reviews | ✅ Ready; hidden until you add real, permitted reviews to `content/reviews.json` |
| Your own project photos | ⏳ Add as `"kind": "project"` once you have them |
| Hosting | ⚙️ Ready for Netlify; not yet deployed |

Until email is configured, the form tells visitors it isn't connected yet. It never pretends to send.

## Project structure

```
content/            Editable business info, Robert's story (owner.json), services, gallery, plants, reviews (JSON)
src/assets/css/     tokens.css (single source of truth for brand styling) + site.css
src/assets/js/      site.js (menu, motion) + inquiry-form.js (form behavior)
src/templates/      layout.mjs (head, header, footer) + pages.mjs (page content)
src/assets/img/     Photos (inspiration gallery; add your own here)
src/build/          illustrations.mjs (brand-colored SVG art) · reviews.mjs (review publishing rules)
lib/inquiry/        schema.mjs (shared validation) · notify.mjs (email/SMS) · handler.mjs (HTTP)
netlify/functions/  inquiry.mjs (serverless endpoint at /api/inquiry)
scripts/            build.mjs · dev.mjs
tests/              Node test runner: validation, notifications, handler, built site, gallery & reviews
logo/               Logo SVGs
docs/               Brand, UI, UX, content and setup guides
```

## Documentation

- [Brand voice](docs/brand-voice.md): how Robert sounds; read before writing any copy
- [Brand guidelines](docs/brand-guidelines.md): positioning, color, type, logo
- [UI guidelines](docs/ui-guidelines.md): tokens, layout, components, accessibility
- [UX guidelines](docs/ux-guidelines.md): journey, navigation, form design
- [Content guidelines](docs/content-guidelines.md): writing, plant accuracy, photo honesty, SEO
- [Setup & deployment](docs/setup-and-deployment.md): configuration, email/SMS, Netlify, photos, reviews
- [Image credits](docs/image-credits.md): every third-party photo, its license and changes made

## Launch checklist

- [ ] Real business name in `content/site.json` (and `nameIsPlaceholder: false`); update logo wordmarks
- [ ] Public email and/or phone in `content/site.json`
- [ ] Resend domain verified; `RESEND_API_KEY`, `INQUIRY_TO_EMAIL`, `INQUIRY_FROM_EMAIL` set in Netlify
- [ ] Deployed to Netlify with a custom domain and HTTPS
- [ ] Live test inquiry received ([verification steps](docs/setup-and-deployment.md#production-verification))
- [ ] Privacy notice reviewed by the owner
- [ ] *(Optional)* Twilio configured and registered
- [ ] Robert's portrait added to `content/owner.json`
- [ ] *(When available)* Original project photos added
- [ ] *(When available)* First real customer reviews added with permission; Google review link in `content/reviews.json`
