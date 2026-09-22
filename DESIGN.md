# Aker — Style Reference (GradPortal frontend)

> darkroom gallery wall — monumental type over muted landscape photography, exhibit-label restraint.

**Theme:** light. Proxima Nova is licensed; we substitute **Montserrat** (per the spec's own
substitute list). Lora is loaded from Google Fonts for the serif editorial accent.

## Non-negotiables (the voice)
- Display/section headings use weight **300**, never 600/700. Authority through restraint.
- `--radius-full: 80px` on every button and pill. `--radius-lg: 8px` on every card and image.
  The 1584px radius is reserved for nav pills, badges and tags only.
- **Ember `#b75928` is the only chromatic accent** — link text and one warm highlight per
  section. Pine/Tide/Cedar/Coral are *card surfaces*, never text or button colors.
- No drop shadows, no gradients. Depth comes from photography and surface contrast.
- Body copy is left-aligned, max-width ~600px. Never centered.
- Default action = ghost text + trailing `→`. Filled dark buttons are rare and deliberate.
- Full-bleed 100vw photography bands alternate with max-width 1200px white canvas.

## Colors
| Name | Value | Token | Role |
|------|-------|-------|------|
| Ink | `#000000` | `--color-ink` | Primary text, hairline borders, icon strokes |
| Paper | `#ffffff` | `--color-paper` | Canvas, card surfaces, text on dark |
| Char | `#1c1c1c` | `--color-char` | Dark panels, nav pill, elevated dark cards |
| Midnight | `#070707` | `--color-midnight` | Deepest surface, dark feature cards, modals |
| Iron | `#262626` | `--color-iron` | Mid-dark panel behind photography |
| Slate | `#38464a` | `--color-slate` | Cool-tinted dark surface |
| Mist | `#e5e4e4` | `--color-mist` | Light card surfaces, hairlines on white |
| Smoke | `#8d8d8d` | `--color-smoke` | Muted helper text, inactive metadata |
| Pewter | `#666666` | `--color-pewter` | Secondary body text |
| Ember | `#b75928` | `--color-ember` | Link text, brand accent — the single accent |
| Pine | `#193f32` | `--color-pine` | Dark green feature-card surface |
| Tide | `#002934` | `--color-tide` | Deep teal card surface |
| Driftwood | `#537179` | `--color-driftwood` | Decorative strokes, icon line-work |
| Cedar | `#776157` | `--color-cedar` | Warm brown card surface |
| Coral | `#df6a6b` | `--color-coral` | Warm-pink card surface |
| Primary Action Fill | `#494949` | `--color-primary-action-fill` | Filled action background |

## Type scale
| Role | Size | Line height | Tracking | Token |
|------|------|-------------|----------|-------|
| body | 15px | 1.5 | 0.15px | `--text-body` |
| subheading | 18px | 1.5 | 0.18px | `--text-subheading` |
| heading-sm | 22px | 1.25 | -0.44px | `--text-heading-sm` |
| heading | 36px | 1.2 | -0.72px | `--text-heading` |
| heading-lg | 62px | 1.1 | -1.55px | `--text-heading-lg` |
| display | 168px | 0.8 | -4.2px | `--text-display` |

Montserrat weights 300/400/500/600. Lora 400 at 15–18px only, body accent — never a heading.

## Spacing & layout
Scale: 4 5 6 8 10 12 13 14 16 19 20 22 24 32 48 64.
Page max-width 1200px · section gap 80px · card padding 16px · element gap 16px.
Density: comfortable.

## Components
- **Brand wordmark** — Montserrat 300, 168px, lh 0.80, tracking -4.2px. Paper on photography,
  Ink on light. The hero anchor.
- **Navigation pill** — Char fill, 1584px radius, ~32px tall, 13px horizontal padding.
  "GRADPORTAL" 12px weight 500 Paper + hamburger. Fixed top-right, 24px margin.
- **Navigation card** — Char fill, 8px radius, 4:3 image left + text right. Title 15px/400 Paper,
  description 12px/400 Mist, 14px right-arrow. Two per row.
- **Text-arrow button** — no fill, no border. 13–15px weight 400 + trailing →. Pill variant adds
  an 80px-radius outline with 19px vertical / 16px horizontal padding.
- **Filled dark button** — Char fill, 80px radius, Paper 13px weight 500. Used sparingly.
- **Section label** — 12px weight 400 Smoke, tracking 0.12px, left-aligned, 6–8px above heading.
- **Section heading** — weight 300, 36–62px, lh 1.10–1.20, tracking -0.02em.
- **Two-column feature card** — equal grid, 16px gap. Left: Mist fill, 8px radius, overline +
  36–48px weight-300 heading + bottom-left text-arrow. Right: full-bleed photo, 8px radius,
  Paper overline and heading overlaid.
- **Full-bleed hero** — 100vw photography, no radius, full viewport height. Wordmark bottom-left,
  intro paragraph top-left (15px Paper, max-width 400px), nav pill top-right.
- **Numbered list item** — "01" 12px Smoke + label 18px/400 Ink, 6px row gap, 1px Mist hairline
  above each row, 24px vertical padding.
- **Pill badge / tag** — 1584px radius, 6–8px vertical / 14px horizontal padding, Mist fill with
  Ink text (or transparent with Paper on dark). 12px weight 500.

## Imagery
Muted, desaturated landscape / cityscape / campus photography, 50–70% of a section opener.
Full-bleed with no radius in hero contexts, 8px radius in cards. Cool and desaturated, with
terracotta notes in-subject to tie back to Ember. No illustrations, no 3D, no abstract graphics.

## Don't
- No weight 600/700 at display sizes.
- No accent hue other than Ember for text or buttons.
- No `box-shadow` for elevation, no gradients.
- No centered body paragraphs.
- No 1584px radius on cards or images.
- No Lora above 18px, and never as a heading.
