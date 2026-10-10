# Content guidelines

## Voice and tone

Follow **[brand-voice.md](brand-voice.md)**. It defines Robert's voice, when to write as "I" versus neutral copy, tone by section, and the banned-phrase list (checked by `tests/voice.test.mjs`).

Mechanics: short paragraphs (2–4 sentences), active voice, talk to "you".

## Headlines

- Sentence case.
- Say something specific: "Plants that thrive in Broward" beats "Our Plants".
- Hero headlines stay under 8 words; a single italic phrase for emphasis is allowed.

## Service descriptions

Each service in `content/services.json` has:

| Field | Guidance |
|---|---|
| `title` | 2–4 words, plain language |
| `summary` | One sentence on the benefit to the customer |
| `description` | 2–3 sentences in Robert's first person: what he does and why it helps |
| `goodFor` | Who it suits, in a short phrase |

Don't describe regulated or specialized work (tree removal, irrigation installation, pesticide or fertilizer application, hardscape construction) unless the owner confirms they offer it and hold any required licenses.

## Plant education standards

Each plant in `content/plants.json` must:

1. Come from a credible source, preferably **UF/IFAS Extension** (Gardening Solutions, EDIS) or the **Florida-Friendly Landscaping™** program. List the sources in `sources`.
2. State native status accurately. Many tropical plants aren't native; say so.
3. Never include species listed as invasive by the Florida Invasive Species Council or UF/IFAS.
4. Qualify advice that depends on site conditions (drainage, sun, salt, irrigation).
5. Mention toxicity or legal protections when relevant (e.g. coontie toxicity, seagrape dune permits).
6. Update `lastReviewed` whenever plant facts are checked again.

## Photography standards

Use natural light, real and healthy plants, architectural context, and believable compositions. Avoid oversaturation, heavy filters, unrealistic plants, and generic stock that could be anywhere.

**Sourcing order:**
1. The owner's own photos of their own work.
2. Properly licensed photos (currently 8 from Wikimedia Commons), recorded in [image-credits.md](image-credits.md).
3. The built-in illustrations (used for service cards and plant profiles).

Never hotlink or scrape images from other sites. Get permission before showing a client's home, and avoid house numbers, license plates and faces.

## Project portfolio representation

| Type | `kind` in `gallery.json` | Label shown | Requirements |
|---|---|---|---|
| Third-party photo shown for ideas | `inspiration` | "Landscape design inspiration" | Full credit; listed in image-credits.md |
| The owner's real, completed work | `project` | "Completed project" | Real job, homeowner's permission |

Gallery captions describe the **design ideas visible in the photo** (layout, materials, plant structure). "Photographed at…" names where the photographer took it, only when the source states it. Don't name plant species you can't confirm from the photo or its source.

Never present inspiration photos, third-party images, or AI-generated images as completed projects. Don't invent locations or customer results, and don't create before/after pairs unless both photos are of the same real job.

## Customer reviews

- Publish only real reviews from real customers, with their permission (`verified` and `permission` both `true`).
- Show first name and last initial only. Add a location or date only if the customer is comfortable with it.
- Don't rewrite a review's meaning. Fix obvious typos only.
- Show star ratings only for reviews that can be checked: Google reviews with a link.
- Never use sample, placeholder, paraphrased or "representative" reviews on the live site. Samples belong only in `content/reviews.sample.json` for local previews.
- Don't add reviews or ratings to the site's structured data.
- Remove a review promptly if the customer asks.

Setup steps: [Adding customer reviews](setup-and-deployment.md#adding-customer-reviews).

## SEO content principles

- Write for people first. Use phrases like "landscape design in Broward County", "tropical landscaping" and "Florida-friendly landscaping" only where they read naturally.
- Each page has a unique `<title>` and meta description (set in `src/templates/pages.mjs`).
- Answer real questions in FAQ sections rather than adding keyword-only pages.
- Name the service area as "Broward County, Florida." Don't claim specific cities unless the owner actually serves them.
- No blog for now. Add one only when there's time to keep it useful.

## Rules against fabricated claims

Never write, imply or put in structured data:

- Years in business, number of clients or projects
- Awards, rankings, "#1", "best in"
- Licenses, certifications, insurance or bonding
- Reviews, testimonials or star ratings that aren't real, verified and shared with permission
- A street address or storefront
- Completed projects that didn't happen

When the owner provides verified facts, add them in one place (`content/site.json` or page copy) and remove them when they stop being true.
