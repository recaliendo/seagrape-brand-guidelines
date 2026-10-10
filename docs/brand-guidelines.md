# Brand guidelines

> "Seagrape Landscape Design" is a **working name**. It lives in one place, `content/site.json`, so renaming the business is a one-line change. Everything below still applies after a rename.

## Mission and positioning

**Mission:** Beautiful landscaping should feel personal, natural and thoughtfully designed for the people who enjoy it.

**Positioning:** A small, owner-operated landscape design business in Broward County, Florida, run by Robert. It stands out through personal attention, creative ideas and plant knowledge, not size or volume.

**Brand promise:** Thoughtful landscaping, personal attention, and a genuine love for South Florida's natural beauty.

**Primary message (tagline):** *Thoughtful landscaping, personally designed.*
**Supporting line:** *Personal attention from the person caring for your landscape.*

We chose this direction over "Rooted in South Florida. Inspired by You." because it names both halves of the promise, care and design, in plain words.

## Who we serve

| Audience | What they want from us |
|---|---|
| Homeowners refreshing an existing yard | Someone to listen, edit what's there and make it feel intentional again |
| New homeowners and recent transplants | Guidance on what grows here and a plan they can trust |
| People with a specific small idea | Permission to ask about a planter pair, an entry bed or one shady corner |
| Homeowners planning a larger change | A collaborative design process and honest talk about scope and budget |

## Personality

- **Authentic.** A real local business that values relationships.
- **Crafted.** Care in plant selection, arrangement and finish.
- **Custom.** Each landscape reflects the owner's property, lifestyle and budget.
- **Locally knowledgeable.** Comfortable with tropical, subtropical and native Florida plants.
- **Approachable.** No project is too small to ask about.
- **Quietly sophisticated.** Elegant and modern without feeling expensive or intimidating.

## Voice and tone

The full guide is **[brand-voice.md](brand-voice.md)**: personality, the five voice principles, when to write as "I", tone by section, banned phrases, before-and-after examples, and rules for AI-written content.

In short: Robert, a down-to-earth Wisconsin transplant who loves South Florida's plants, talking to a neighbor about their yard. Warm, quietly knowledgeable, specific, never pushy.

**Never claim** anything Robert hasn't confirmed: years of experience, numbers of clients, awards, rankings ("#1 in Broward"), licenses, certifications, insurance, reviews, ratings, or completed projects.

## Owner introduction

The Home page's "Meet Robert" section is the brand's personal center. Its text lives in [`content/owner.json`](../content/owner.json) and covers only facts Robert provided. Until a real photo exists it shows an illustrated garden placeholder captioned "Robert — Owner & Landscaping Enthusiast". Never use a stock photo of a person to stand in for him.

## Visual identity

The full token list lives in [`src/assets/css/tokens.css`](../src/assets/css/tokens.css); see [UI guidelines](ui-guidelines.md) for usage.

### Color

| Role | Token | Hex | Use |
|---|---|---|---|
| Page background | `--color-canvas` | `#FBFAF6` | Warm white base for every page |
| Alternate section | `--color-ivory` | `#F6F2EA` | Every other section, info cards |
| Panels | `--color-sand` | `#EDE6D8` | Image mats, notices |
| Borders | `--color-stone` | `#DDD5C5` | Card borders, dividers |
| Soft sage | `--color-sage-100` | `#E8EEE4` | Section tint, chips, plant cards |
| Primary | `--color-leaf-700` | `#3E5E48` | Buttons, links |
| Deep foliage | `--color-leaf-900` | `#1F3529` | Headings, footer, CTA band |
| Body text | `--color-ink` | `#26302A` | Paragraphs |
| Secondary text | `--color-ink-muted` | `#56615A` | Ledes, captions |
| Accent | `--color-terracotta` | `#B8694C` | Decorative rules, step numerals, illustration only |
| Accent text | `--color-terracotta-text` | `#974F37` | Eyebrow labels, required markers |
| Wood | `--color-wood` | `#9C7A5B` | Illustration, non-native badge |

Rules: keep pages mostly light (canvas, ivory, sage). Use deep foliage green for one strong moment per page (the CTA band and footer). Terracotta is a spice, never a background. No black backgrounds, corporate blue, saturated tropical colors or harsh gradients.

### Typography

- **Display:** Newsreader (serif), weights 400–600, with italic for emphasis in the hero. Used for headings, quotes and step numerals.
- **Body:** Figtree (sans-serif), weights 400–700, for body text, navigation, buttons and forms.
- Headings in sentence case. Body text never below 16px.

### Logo

Files in [`/logo`](../logo): primary, reversed (on deep green), one-color, mark, and favicon. The mark is a round seagrape leaf with soft blush veins.

- Clear space: half the leaf's height on every side.
- Minimum size: lockup 140px wide on screen; mark 24px.
- Don't stretch, rotate, recolor the leaf, add effects, or swap in a palm tree.
- The SVG wordmarks use live text. Before printing, open them in a design tool with Newsreader and Figtree installed and convert text to outlines.
- The website header renders the business name from `content/site.json`, so it updates automatically on rename. Update the logo SVG wordmarks separately.

### Photography

See [content guidelines](content-guidelines.md#photography-standards). In short: natural light, real plants, architectural context, believable compositions. Never present inspiration or AI imagery as completed work.

## Consistency checklist

- [ ] Copy makes no unverified claims.
- [ ] Colors come from tokens, not one-off hex values.
- [ ] One primary (green) button per view; secondary actions use the outline style.
- [ ] Images are labeled honestly ("Landscape design inspiration" vs. "Completed project") and third-party photos are credited.
- [ ] Testimonials are real, verified and shared with permission; never samples or paraphrases.
- [ ] The CTA always reads "Start Your Project" and goes to `/contact/#inquiry`.
