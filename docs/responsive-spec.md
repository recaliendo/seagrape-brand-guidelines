# Responsive layout specification

How every page behaves from a 320px phone to a 2560px monitor. Values live in `src/assets/css/tokens.css` (tokens) and `src/assets/css/site.css` (rules). All pages share the same header, footer, container and section rules, so this spec applies site-wide.

Last QA pass: October 2026, measured on Home, Services & Projects, South Florida Plants and Contact at 320, 375, 768, 900, 1024, 1280, 1440, 1920 and 2560px.

## Breakpoints

| Name | Min width | What changes |
|---|---|---|
| base | 0 | Single column; Menu button; hero text above the photo; Robert's portrait at 70% width |
| sm | 40em (640px) | Two-column forms, grids and steps; hero photo capped at 22rem while stacked |
| md | 56em (896px) | Two-column hero (text 1.25fr, photo 0.75fr), services index in two columns, split sections, Meet Robert side by side, sticky contact sidebar |
| nav | 60em (960px) | Full navigation replaces the Menu button (moved from 56em, where the links wrapped) |
| lg | 64em (1024px) | Three-column card grids and growing-conditions grid |
| xl | 90em (1440px) | Container widens from 72rem to 80rem (1152 → 1280px) |
| 2xl | 120em (1920px) | Root font size 112.5%: type, spacing and container (80rem = 1440px) all scale together |
| 3xl | 150em (2400px) | Root font size 125% (container = 1600px) |

Media queries use `em`, so they follow the browser's base size, not the scaled root.

## Containers and line length

| Element | Rule |
|---|---|
| Page container | `max-width: var(--container)`: 1152 → 1280 → 1440 → 1600px by breakpoint |
| Side gutter | `clamp(1rem, 4vw, 2.5rem)`, never below 16px |
| Paragraph measure | `--measure: 38rem`. Measured at 55–73 characters per line on desktop; 27–39 on phones (expected for narrow screens) |
| Section spacing | `clamp(3rem, 2rem + 3.5vw, 5rem)` vertical padding (tightened in the October 2026 design pass) |

Why scale the root instead of only widening the container: on a 2560px screen, a wider container alone stretches card rows and leaves text tiny. Scaling the rem-based system keeps proportions identical to a 1440px laptop, only larger.

## Typography scale

| Token | Range | At 375 / 1280 / 1920px |
|---|---|---|
| `--text-3xl` (h1) | `clamp(2.375rem, 1.6rem + 2.9vw, 4.5rem)` | 38 / 63 / 81px |
| `--text-2xl` (h2) | `clamp(1.75rem, 1.35rem + 1.3vw, 2.75rem)` | 28 / 38 / 50px |
| `--text-xl` (h3) | `clamp(1.375rem, 1.2rem + 0.6vw, 1.625rem)` | 22 / 26 / 29px |
| `--text-base` (body) | 1.0625rem | 17 / 17 / 19px |

Body text never drops below 16px. Headings use `text-wrap: balance`; the hero h1 is limited to 13 characters per line so it breaks into three calm lines.

## Images

| Image | Rule |
|---|---|
| Hero photo | 4:5, plain 4px frame. Stacked: full width, capped at 22rem on tablets. Side by side: width = the smaller of 30rem, the column, or (screen height − 12rem) × 0.8, so the whole hero fits the first screen from 1024×768 to 2560×1440. |
| Cards, gallery, services | 3:2, `object-fit: cover`, `width`/`height` attributes set (no layout shift) |
| Plant cards | 3:2 |
| Robert's portrait | 4:5, max 28rem, sticky beside the story from md up |
| Photos | WebP at 800px and 480px with `srcset`/`sizes`; phones load the 480px file |
| Loading | Hero `fetchpriority="high"` + preload; everything else `loading="lazy"` |

## Components

**Navigation:** sticky; a hairline border appears after scrolling. The Menu button (44px tall) opens a full-width panel below 960px; Escape closes it and returns focus. Links don't wrap (`white-space: nowrap`). The current page has an underline (desktop) or a dot (mobile). The "Start Your Project" button stays in the header at every width.

**Hero:** a deep-green band (`--color-leaf-900`) with a warm-white headline (`--text-hero`, always three lines on desktop), a limestone italic phrase, a limestone primary button and a text link, plus a real photo with its credit. Stacked text-first below 896px.

**Card grids:** fixed column counts (1 → 2 → 3) instead of auto-fill, so wider containers never produce a fourth column with a lone card. Cards in a row share height; plant cards align to the top so opening "care & design tips" doesn't stretch neighbors.

**Forms:** inputs at least 48px; radio chips and checkboxes at least 44px; two-column rows from 640px; inline errors with `aria-invalid` plus a focusable summary; spinner and "Sending…" while submitting; the success message replaces the form.

**Inner page headers:** ivory band; from 896px the headline sits left and the intro right, which keeps the band short.

**Footer:** auto-fit columns that stack on phones; links have 4px vertical padding for easier tapping.

## Accessibility and performance results

| Check | Result |
|---|---|
| Horizontal overflow | None on any page at any tested width |
| Tap targets under 24px | Only links inside sentences (credits, sources, footer text), which WCAG 2.5.8 exempts |
| Color contrast | Tested in `tests/site.test.mjs`; all text pairs ≥ 4.5:1 |
| Keyboard | Skip link, visible focus ring, menu Escape handling, native `<details>` disclosures |
| Layout shift | Every image has width and height; fonts use `display=swap` |
| LCP | Hero photo preloaded (640px WebP, about 87 KB) |

## Maintaining it

- Change widths or type in `tokens.css`, not in component rules.
- New card grids: reuse `.grid.grid--3` or `.grid--2` rather than writing new auto-fill rules.
- After layout changes, run `npm run check` and look at 375, 768, 1024, 1440 and 1920px.
