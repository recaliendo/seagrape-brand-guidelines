# Seagrape Landscape Design: website & brand system

Website, brand guidelines and inquiry workflow for a small, owner-operated landscape design studio in Broward County, Florida.

> **"Seagrape Landscape Design" is a working name.** Change it in [`content/site.json`](content/site.json).

**Thoughtful landscaping, personally designed.**

## Quick start

```bash
npm run dev:mock   # preview at http://localhost:8888 with a fake email provider
npm test           # 41 automated tests; nothing is sent
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
| Project photography | ⏳ Illustrated style references until you have your own photos |
| Hosting | ⚙️ Ready for Netlify; not yet deployed |

Until email is configured, the form tells visitors it isn't connected yet. It never pretends to send.

## Project structure

```
content/            Editable business info, services, gallery styles, plant profiles (JSON)
src/assets/css/     tokens.css (single source of truth for brand styling) + site.css
src/assets/js/      site.js (menu, motion) + inquiry-form.js (form behavior)
src/templates/      layout.mjs (head, header, footer) + pages.mjs (page content)
src/build/          illustrations.mjs (brand-colored SVG art, generated at build)
lib/inquiry/        schema.mjs (shared validation) · notify.mjs (email/SMS) · handler.mjs (HTTP)
netlify/functions/  inquiry.mjs (serverless endpoint at /api/inquiry)
scripts/            build.mjs · dev.mjs
tests/              Node test runner: validation, notifications, handler, built site
logo/               Logo SVGs
docs/               Brand, UI, UX, content and setup guides
```

## Documentation

- [Brand guidelines](docs/brand-guidelines.md): positioning, voice, color, type, logo
- [UI guidelines](docs/ui-guidelines.md): tokens, layout, components, accessibility
- [UX guidelines](docs/ux-guidelines.md): journey, navigation, form design
- [Content guidelines](docs/content-guidelines.md): writing, plant accuracy, photo honesty, SEO
- [Setup & deployment](docs/setup-and-deployment.md): configuration, email/SMS, Netlify, photos

## Launch checklist

- [ ] Real business name in `content/site.json` (and `nameIsPlaceholder: false`); update logo wordmarks
- [ ] Public email and/or phone in `content/site.json`
- [ ] Resend domain verified; `RESEND_API_KEY`, `INQUIRY_TO_EMAIL`, `INQUIRY_FROM_EMAIL` set in Netlify
- [ ] Deployed to Netlify with a custom domain and HTTPS
- [ ] Live test inquiry received ([verification steps](docs/setup-and-deployment.md#production-verification))
- [ ] Privacy notice reviewed by the owner
- [ ] *(Optional)* Twilio configured and registered
- [ ] *(When available)* Original project photos added
