# Project notes for Claude Code

Static website for Robert's small, owner-operated landscaping business in Broward County, FL. Zero dependencies, Node 20+.

## Before writing any customer-facing copy

Read [docs/brand-voice.md](docs/brand-voice.md). Write as Robert ("I") for personal and service copy, and keep plant facts and form text neutral. Never invent biography, credentials, reviews, projects, prices or statistics. `content/owner.json` is the only source of facts about Robert. Banned phrases are enforced by `tests/voice.test.mjs`.

## Content integrity

- Third-party photos are "Landscape design inspiration", fully credited (docs/image-credits.md), never presented as Robert's work.
- Reviews render only if real, verified and permitted (`content/reviews.json`). Never add sample or invented reviews there.
- Plant facts need UF/IFAS-type sources (docs/content-guidelines.md).

## Where things live

- Editable content: `content/*.json`
- Design tokens (single source): `src/assets/css/tokens.css`
- Pages: `src/templates/pages.mjs` and `layout.mjs`
- Inquiry form and handler: `lib/inquiry/`, `netlify/functions/inquiry.mjs`

## Commands

- `npm run check`: build and run all tests. Run it before every commit.
- `npm run dev:mock`: local preview at http://localhost:8888 with a fake email provider.
- `npm run dev:samples`: the same, plus labeled sample reviews.
