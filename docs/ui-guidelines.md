# UI design guidelines

This describes what is implemented in `src/assets/css/tokens.css` (design tokens) and `src/assets/css/site.css` (components). The build concatenates both into `dist/css/site.css`.

## Design tokens: the single source of truth

All color, type, spacing, radius and motion values are CSS custom properties in [`tokens.css`](../src/assets/css/tokens.css). Components only reference tokens. The illustration generator also reads `tokens.css` at build time, so changing a green there updates the artwork too.

To restyle the brand, edit `tokens.css` and run `npm run check`. The contrast test fails if text colors drop below WCAG AA (4.5:1).

## Layout

| Token | Value | Use |
|---|---|---|
| `--container` | 72rem → 80rem | Max content width (1152px; 1280px from 1440px screens; scales to 1440/1600px on very large screens) |
| `--measure` | 38rem | Max width for paragraphs |
| `--gutter` | 16px → 40px (fluid) | Side padding; never below 16px |
| `--section-space` | 72px → 112px (fluid) | Vertical rhythm between sections |

Sections alternate backgrounds (`.section`, `.section--ivory`, `.section--sage`) instead of using heavy dividers. Grids use `auto-fill` with a minimum card width so they collapse to one column on phones without extra media queries.

**Breakpoints and large screens:** see [responsive-spec.md](responsive-spec.md) for the full breakpoint table, container widths by screen size, the type scale and component behavior.

## Spacing

4px base scale: `--space-1` (4px) through `--space-9` (112px). Use `gap` on flex/grid parents instead of margins between siblings.

## Typography

| Element | Token | Size | Font |
|---|---|---|---|
| H1 | `--text-3xl` | 38px → 64px | Newsreader 450 |
| H2 | `--text-2xl` | 28px → 40px | Newsreader 500 |
| H3 | `--text-xl` | 22px → 26px | Newsreader 500 |
| Lede | `--text-lg` | 20px | Figtree 400, muted |
| Body | `--text-base` | 17px / 1.65 | Figtree 400 |
| Small | `--text-sm` | 15px | Figtree |
| Label | 0.75rem | Caps, 0.12em tracking | Figtree 600, `--color-ink-muted`; page headers and the hero only |

Every page has exactly one H1 (enforced by tests), and headings don't skip levels.

## Components

| Component | Class | Notes |
|---|---|---|
| Primary button | `.btn.btn-primary` | Deep green rectangle, 4px radius (limestone on the dark hero). One per view. "Start Your Project" uses this. |
| Secondary button | `.btn.btn-secondary` | Green outline. |
| Light button | `.btn.btn-light` | On the dark CTA band only. |
| Text link | `.text-link` | Underlined arrow link for "see more". |
| Card | `.card` | No box: a 3:2 photo (4px radius) with text below. Used only for things compared side by side (gallery, plants). No hover shadow or zoom. |
| Gallery card | `figure.card.gallery-card` | Photo with a `.tag` label ("Landscape design inspiration" or "Completed project"), category eyebrow, title, caption, "Photographed at" line and `.credit` line. |
| Inspiration mosaic | `.mosaic` | Home preview of up to 4 featured photos: one large lead tile plus three; labels sit on an ivory chip so text never depends on the photo for contrast. Credits line below. |
| Inspiration CTA | `.inspo-cta` | Light sage panel after the gallery linking to the inquiry form. |
| Review | `figure.review` | Top rule, serif quote, name + optional location, date and source. Optional `.stars` (Google-linked reviews only). Static grid, no carousel. |
| Review prompt | `.review-ask` | "Enjoyed working with us?" with a Google review button; shown only when a Google link is configured. |
| Sample review | `.review--sample` + `.sample-flag` | Dashed red border and a red "not a real review" label. Development preview only. |
| Plant card | `.card.plant-card` | Native badge, facts list, `<details>` for care tips. |
| Steps | `ol.steps` | Real sequences only; numbers come from CSS counters. |
| FAQ | `.faq` + `<details>` | Keyboard accessible without JavaScript. |
| Notice | `.notice` | Neutral info between two hairlines, e.g. "these are inspiration photos". |
| CTA band | `ctaBand()` in `layout.mjs` | The page's one dark moment, before the footer. |
| Hero photo | `.hero-photo` | A real photo in a plain 4:5 frame with a credit caption; sized to the screen height on desktop. |
| Services index | `.service-index` | Home: two-column list of services (title + one line), hairline rules, no images. |
| Text link | `.text-link` | Secondary action: underlined text with an arrow; terracotta underline on hover. |

## Navigation

- Sticky header with a hairline border that appears after scrolling.
- Desktop: inline links plus the "Start Your Project" button. The current page has `aria-current="page"` and a deep-green underline.
- Below 896px: a "Menu" button (`aria-expanded`, `aria-controls`) opens a full-width panel. Escape closes it and returns focus to the button. Without JavaScript, the links simply wrap and stay visible.

## Forms

- Labels sit above fields. Required fields show an asterisk, explained once at the top.
- Inputs are at least 48px tall; radio "chips" and checkboxes are at least 44px.
- Errors appear inline under the field (`.field.has-error`), are linked by `aria-describedby`, set `aria-invalid`, and are also listed in a focusable summary at the top.
- The submit button shows a spinner and "Sending…", and is disabled while sending.

## Images

- Every `<img>` has `width` and `height` (no layout shift), `alt` text, and `loading="lazy"` except the hero (`fetchpriority="high"` and preloaded).
- Aspect ratios: hero 4:5, service and gallery 4:3, plants 3:2. Use `object-fit: cover`.
- Photos ship as WebP at 800px and 480px wide with `srcset`/`sizes`, so phones download the small file. Keep each file under 200 KB (a test enforces this for gallery photos).
- Decorative images next to a heading that says the same thing use `alt=""`.

## Interactive states

- Focus: 3px blue-green outline (`--color-focus`) with offset, on every interactive element.
- Hover: color shifts within 220ms (`--duration`) on the `--ease` curve.
- Motion: color and underline changes only (150ms). No scroll animations, zooms, shadows or moving arrows; the form spinner is the only animation. Everything is disabled under `prefers-reduced-motion`.

## Accessibility conventions

- Skip link to `#main`.
- Semantic landmarks: `header`, `nav`, `main`, `aside`, `footer`.
- Color is never the only signal (errors have text and an icon marker).
- Text contrast is tested automatically (`tests/site.test.mjs`).
