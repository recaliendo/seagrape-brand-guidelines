# Setup and deployment

## What you need

- [Node.js](https://nodejs.org) 20 or newer. No `npm install` is needed: the project has no dependencies.
- A free [Netlify](https://www.netlify.com) account for hosting.
- A [Resend](https://resend.com) account for inquiry emails (free tier available).
- *(Optional)* A [Twilio](https://www.twilio.com) account for text alerts.

## Local development

```bash
npm run dev        # build + preview at http://localhost:8888, real handler, reads .env
npm run dev:mock   # same, but fakes the email provider so you can test the success screen; nothing is sent
npm run dev:samples  # dev:mock plus labeled sample reviews, to preview the testimonials layout
npm run build      # build into dist/
npm test           # run all automated tests (providers are mocked; nothing is sent)
npm run check      # build + test
```

With no `.env`, `npm run dev` shows the honest "form isn't connected yet" error when you submit. That's what visitors would see if email isn't configured in production.

## Business details

Edit [`content/site.json`](../content/site.json):

| Field | What to enter |
|---|---|
| `name` | Your registered business name. Then set `nameIsPlaceholder` to `false`. |
| `shortName` | The short name shown next to the logo |
| `tagline` | Your chosen tagline |
| `email` | Public contact email (leave `""` to hide) |
| `phone` | Public phone, e.g. `(954) 555-0123` (leave `""` to hide) |
| `serviceArea` | Keep as "Broward County, Florida" unless it changes |
| `hours` | Optional, e.g. `Mon–Fri, 8am–5pm` |
| `url` | Your live domain, e.g. `https://example.com` (Netlify fills this in during deploys if empty) |
| `social` | Only real profiles: `[{"label": "Instagram", "url": "https://instagram.com/yourhandle"}]` |

These feed the header, footer, contact page, privacy notice and search-engine data, so you change them once.

## Connecting email notifications (required before launch)

1. Create a Resend account and **verify your domain** (Resend → Domains). Resend shows DNS records to add at your domain registrar.
2. Create an API key (Resend → API Keys) with "Sending access".
3. In Netlify → **Site configuration → Environment variables**, add:

| Variable | Example |
|---|---|
| `RESEND_API_KEY` | `re_...` (secret) |
| `INQUIRY_TO_EMAIL` | `you@yourdomain.com` (comma-separate for several) |
| `INQUIRY_FROM_EMAIL` | `Website <inquiries@yourdomain.com>` (must be on the verified domain) |
| `SITE_NAME` | `Seagrape Landscape Design` (optional, used in the email text) |

4. Redeploy (Deploys → Trigger deploy).

For local testing, copy `.env.example` to `.env` and fill in the same values. `.env` is git-ignored. Before your domain is verified, Resend only lets you send from its test address to your own account email.

Each notification email includes every form field and a timestamp in Eastern time. **Reply** goes straight to the customer when they gave an email.

## Optional: text message alerts

Add all four in Netlify (SMS stays off unless all four are set):

| Variable | Example |
|---|---|
| `TWILIO_ACCOUNT_SID` | `AC...` |
| `TWILIO_AUTH_TOKEN` | secret |
| `TWILIO_FROM_NUMBER` | `+19545550123` (your Twilio number) |
| `OWNER_SMS_NUMBER` | `+19545550199` (your mobile) |

Note: US carriers require business registration (A2P 10DLC, or toll-free verification) before Twilio numbers can reliably text US phones. Complete that in the Twilio console first.

**Delivery rules:** if email is configured, the visitor sees success only when the email is accepted by Resend. A failed text doesn't block a successful email. If only SMS is configured, the text must succeed.

## Deploying to Netlify

1. Netlify → Add new project → Import from GitHub → choose this repository.
2. Netlify reads `netlify.toml`: build command `npm run build`, publish folder `dist`, functions in `netlify/functions`.
3. Add the environment variables above, then deploy.
4. Add your custom domain (Domain management) and turn on HTTPS.

The inquiry function is served at `/api/inquiry`. Netlify rate-limits it to 10 requests per minute per IP (configured in `netlify/functions/inquiry.mjs`), on top of the in-app limits.

## Production verification

After each deploy that touches the form or settings:

1. Visit `/contact/` on the live site and send a real test inquiry with your own details.
2. Confirm the email arrives, looks right on your phone, and that Reply goes to the address you entered.
3. If SMS is on, confirm the text arrives.
4. Submit the form with an empty name and confirm you see inline errors.
5. Check Netlify → Logs → Functions → `inquiry` for `delivery succeeded`. (Logs show only channel status, never customer details.)

## Adding your own photos

1. Save each photo as a 4:3 WebP or JPEG in two sizes, about 800px and 480px wide, each under 200 KB. Put them in `src/assets/img/photos/`.
2. In `content/services.json`, `content/gallery.json` or `content/plants.json`, add to an item:
   ```json
   "photo": {
     "src": "/img/photos/front-entry-800.webp",
     "srcSmall": "/img/photos/front-entry-480.webp",
     "width": 800, "height": 600,
     "alt": "Layered entry garden with coontie and firebush"
   }
   ```
3. Run `npm run check`.

### Showing your own finished work in the gallery

Add an item to `content/gallery.json` with `"kind": "project"`. It's labeled **Completed project**. Use it only for work you actually did, and get the homeowner's permission first. Leave out house numbers, license plates and faces. A `credit` isn't needed for your own photos.

Once you have a few real projects, consider removing some inspiration photos so your own work stands out.

### Inspiration photos from other sources

Items with `"kind": "inspiration"` are labeled **Landscape design inspiration** and must include a full `credit` (author, source, sourceUrl, license, licenseUrl). The build stops if anything is missing. Record each one in [image-credits.md](image-credits.md). Set `"featured": true` on up to four to show them in the Home page preview; the first featured photo is the large one.

## Adding customer reviews

Reviews live in [`content/reviews.json`](../content/reviews.json). While `items` is empty, the testimonials section is hidden completely.

**Before adding a review:**

- It must be a real customer's real words. Don't edit the meaning; fix only obvious typos.
- Get the customer's permission to show it on the website (a quick "Is it OK if I share this on our website?" by text or email is enough; keep that message).

**Add an entry:**

```json
{
  "name": "Maria Gonzalez",
  "location": "Plantation",
  "date": "2026-11",
  "text": "They listened to exactly what we wanted for our front entry...",
  "source": "Google",
  "sourceUrl": "https://www.google.com/maps/...link to the review...",
  "rating": 5,
  "verified": true,
  "permission": true
}
```

| Field | Notes |
|---|---|
| `name` | Full name is fine; the site shows only first name and last initial ("Maria G."). |
| `location` | Optional. City or neighborhood only, and only if the customer agreed. |
| `date` | Optional. `YYYY-MM` or `YYYY-MM-DD`; shown as "November 2026". |
| `source` | Where the review came from: `Google`, `Email`, `Text message`, `In person`. |
| `sourceUrl` | Optional link to the original review. Required for stars. |
| `rating` | Optional, 1–5. Stars appear **only** when `source` is `Google` and `sourceUrl` is set, so every star rating can be checked. |
| `verified` | Set to `true` once you've confirmed it's a real customer. |
| `permission` | Set to `true` once they've agreed to have it shown. |

**Edit or remove:** change or delete the entry and redeploy. To hide one temporarily, set `"permission": false`.

**Google review link:** when your Google Business Profile is set up, copy its "Ask for reviews" link (it usually starts with `https://g.page/r/`) into `googleReviewUrl`. A "Enjoyed working with us? Share your experience." prompt then appears on the Home page. Only Google links are accepted.

**Previewing the layout:** `npm run dev:samples` shows three obviously labeled sample cards from `content/reviews.sample.json`. Samples never appear in `npm run build`, and a Netlify production build refuses to include them.

**Later: pulling Google reviews automatically.** Reviews are plain data, so a future script could fetch them from the Google Business Profile API and write them into `reviews.json` in the same format. That needs a verified Business Profile and API access, so it isn't set up now. Review stars are intentionally kept out of the site's structured data, because Google doesn't show star ratings that a business publishes about itself.

## Editing services and plants

- **Services:** edit `content/services.json`. Order in the file is the order on the site.
- **Gallery:** edit `content/gallery.json` (see [photos](#adding-your-own-photos) above).
- **Reviews:** edit `content/reviews.json` (see [reviews](#adding-customer-reviews) above).
- **Plants:** edit `content/plants.json`. Set `featured: true` on up to three to show them on the home page. Follow the [plant standards](content-guidelines.md#plant-education-standards).

## Security notes

- Secrets live only in Netlify environment variables and your local `.env`; tests check that no provider key or endpoint reaches the browser.
- Server-side validation, length limits, honeypot field, minimum fill time, per-IP rate limits and duplicate suppression protect the form.
- Line breaks are stripped from single-line fields and all email output is HTML-escaped, which blocks header and HTML injection.
- The site stores no inquiries itself. Your inbox is the record.
- `dist/_headers` sets a Content Security Policy and other security headers on Netlify.
