# Content guidelines

## Voice and tone

Warm, genuine, confident, knowledgeable, clear. Short paragraphs (2–4 sentences). Active voice. Talk to "you" and about "we."

Avoid corporate jargon ("solutions", "leverage", "premier"), aggressive sales language ("Act now!"), luxury exaggeration ("estate-caliber"), and filler ("In today's fast-paced world…").

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
| `description` | 2–3 sentences: what we do and why it helps |
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
2. Properly licensed photos, with license terms kept on file.
3. The built-in illustrations (current default).

Never hotlink or scrape images from other sites. Get permission before showing a client's home, and avoid house numbers, license plates and faces.

## Project portfolio representation

| Type | `kind` in `gallery.json` | Label shown |
|---|---|---|
| Illustration or style reference | `style` | "Style reference" |
| The owner's real, completed work | `project` | "Completed project" |

Never present inspiration photos, third-party images, or AI-generated images as completed projects. Don't create before/after pairs unless both photos are of the same real job.

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
- Reviews, testimonials, star ratings
- A street address or storefront
- Completed projects that didn't happen

When the owner provides verified facts, add them in one place (`content/site.json` or page copy) and remove them when they stop being true.
