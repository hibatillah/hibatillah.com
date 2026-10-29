---
version: alpha
name: Hibatillah
description: "A neutral UI-component system with one deliberately scarce accent. Everything is gray on a near-white background except `primary`, a saturated blue reserved for primary actions, active states, and links. Geist carries all reading text, Geist Mono carries code and micro-labels, and Calloveya is the portfolio wordmark only."

colors:
  background: "oklch(0.99 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.145 0 0)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.145 0 0)"
  primary: "oklch(54.6% 0.245 262.88)"
  primary-foreground: "oklch(0.985 0 0)"
  primary-hover: "oklch(54.6% 0.245 262.88 / 80%)"
  secondary: "oklch(0.97 0 0)"
  secondary-foreground: "oklch(0.205 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.97 0 0)"
  accent-foreground: "oklch(0.205 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  destructive-subtle: "oklch(0.577 0.245 27.325 / 10%)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"

typography:
  h1:
    fontFamily: Geist
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
  h2:
    fontFamily: Geist
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.4
  h3:
    fontFamily: Geist
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.45
  h4:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.5
  h5:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.5
  h6:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0.08em
  body-md:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.75
  body-sm:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: Geist Mono
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  display:
    fontFamily: Calloveya
    fontSize: 2.25rem
    fontWeight: 500
    lineHeight: 1.2

rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px

spacing:
  sm: 8px
  md: 16px
  lg: 24px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 0 10px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.primary-foreground}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 0 10px
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 0 10px
  button-outline-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
  button-destructive:
    backgroundColor: "{colors.destructive-subtle}"
    textColor: "{colors.destructive}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 0 10px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "{spacing.md}"
  input:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 4px 10px
---

## Overview

A component library, not a page layout. The system is neutral: every surface, text, and border is a gray, and exactly one saturated color (`primary`, blue) marks interaction. Components share one control height (32px) and one control radius (`{rounded.lg}`) so buttons and inputs align on a form row.

Page-level layout and the polaroid `ImageFrame` motif from the previous version are out of scope for this document. Styling in the codebase will be migrated to this system separately.

**Known gaps** (do not fill in without the real values):

- No dark theme is modeled. Only light tokens are defined here; ask for the real dark values before documenting dark-mode support.
- The `Calloveya` font file is not part of this spec; `display` falls back to generic `cursive` outside the app.

## Colors

All neutrals have chroma 0.

- **Background** (`{colors.background}`): page surface, near-white rather than pure white.
- **Foreground** (`{colors.foreground}`): primary text, near-black.
- **Card / Popover** (`{colors.card}`, `{colors.popover}`): pure white, one step above background. Same value today; kept separate so they can diverge.
- **Primary** (`{colors.primary}`): the only saturated color. Use for primary actions, active/selected states, and links. Never for large surfaces or decoration.
- **Primary Hover** (`{colors.primary-hover}`): `primary` at 80% opacity. Used only as the `button-primary` hover background, not as a darker shade.
- **Secondary / Muted / Accent** (`{colors.secondary}`, `{colors.muted}`, `{colors.accent}`): one shared light gray for low-emphasis fills (secondary buttons, subtle fills and disabled surfaces, hover rows). Three tokens by design so each can diverge later.
- **Muted Foreground** (`{colors.muted-foreground}`): secondary text, captions, placeholders.
- **Destructive** (`{colors.destructive}`): text and icon color for delete/irreversible actions. **Destructive Subtle** (`{colors.destructive-subtle}`) is the default background (10% opacity). A solid destructive fill is reserved for a true confirm-to-delete step.
- **Border / Input** (`{colors.border}`, `{colors.input}`): 1px dividers and form-control borders. Same value today, separate so inputs can diverge.
- **Ring** (`{colors.ring}`): `focus-visible` ring, applied at 50% opacity.

## Typography

- **Geist** carries every heading (`h1`–`h6`) and all body text.
- **Geist Mono** carries code and uppercase micro-labels (mono + uppercase + wide tracking).
- **Calloveya** (`display`) is the portfolio wordmark only. Never use it for body, UI, or component text.

Rendered prose (MDX, markdown) uses shadcn Typeset: `src/app/typeset.css` plus the `typeset-portfolio` preset, which sets Geist for body and headings, Geist Mono for code, `1.75` leading and `1.25em` flow, and overrides `h1` to `1.5em`. The other heading sizes and weights in the table below are Typeset defaults.

`h6` is the outlier: uppercase, `0.08em` tracking, used as a section eyebrow rather than a reading heading. `body-sm` is also the scale uppercase mono eyebrows sit at.

| Token     | Size      | Weight | Line height | Use                                        |
| --------- | --------- | ------ | ----------- | ------------------------------------------ |
| `h1`      | 1.5rem    | 600    | 1.3         | Page/section top-level heading             |
| `h2`      | 1.25rem   | 600    | 1.4         | Sub-section heading                        |
| `h3`      | 1.125rem  | 600    | 1.45        | Card/panel heading                         |
| `h4`      | 1rem      | 600    | 1.5         | Minor heading, form-section label          |
| `h5`      | 0.875rem  | 500    | 1.5         | Small inline heading                       |
| `h6`      | 0.8125rem | 500    | 1.5         | Uppercase eyebrow, 0.08em tracking         |
| `body-md` | 1rem      | 400    | 1.75        | Default paragraph                          |
| `body-sm` | 0.875rem  | 400    | 1.5         | Card descriptions, form hints, table cells |
| `mono`    | 0.875rem  | 400    | 1.5         | Inline code, code blocks, micro-labels     |
| `display` | 2.25rem   | 500    | 1.2         | Wordmark only                              |

## Layout

Only three spacing steps are named: `{spacing.sm}` 8px (icon-to-label gaps, chip padding), `{spacing.md}` 16px (card padding, gap between form fields), `{spacing.lg}` 24px (section-level gaps). Anything finer uses Tailwind's default 4px scale rather than a new token.

## Elevation & Depth

Flat. Depth comes from the `card` surface sitting one step above `background`, not from shadows. `Card` adds a 1px `foreground` ring at 10% opacity instead of the `border` token, which reads softer on a content container. Do not add drop shadows.

Focus is a 2px ring in `{colors.ring}` at 50% opacity.

## Shapes

`--radius` is 10px (`0.625rem`) and is the single source of truth; the rest derive from it via `calc()`, so retuning it retunes every corner.

| Token          | Value | Use                                                                     |
| -------------- | ----- | ----------------------------------------------------------------------- |
| `{rounded.sm}` | 6px   | Chips; compact (xs/sm) buttons, clamped so they don't look over-rounded |
| `{rounded.md}` | 8px   | Reserved step between sm and the control radius                         |
| `{rounded.lg}` | 10px  | Default buttons and inputs (shared so they align on a form row)         |
| `{rounded.xl}` | 14px  | Cards and dialogs                                                       |

## Components

- **Button** — variants `primary`, `secondary`, `outline`, `destructive`. All are 32px tall with `0 10px` padding and `{rounded.lg}`. `primary` is the only high-emphasis surface; hover drops it to `primary-hover` instead of darkening. `outline` sits on `background` with a `border`. `destructive` defaults to `destructive-subtle`.
- **Card** — `card` background, `{rounded.xl}`, `{spacing.md}` padding, 1px `foreground/10` ring. Title in `h3`, description in `body-sm` + `muted-foreground`.
- **Input** — 32px tall, `{rounded.lg}`, 1px `input` border, fully transparent background (it relies on the surface beneath). Placeholder in `muted-foreground`; focus swaps the border to `ring` and adds the ring.

## Do's and Don'ts

### Do

- Pull every value from these tokens; don't hardcode a color or radius that a token covers.
- Treat `primary` as scarce: one accent, one job (interaction).
- Use exactly one `primary` button per view or form.
- Default `destructive` actions to `destructive-subtle`; use a solid fill only for a confirm-to-delete step.
- Pair `Input` with a default `Button` on one row; their shared height and radius is what aligns them.

### Don't

- Don't introduce a second saturated color for emphasis.
- Don't use Calloveya (`display`) outside the portfolio wordmark.
- Don't give `Input` a filled `muted` background; inputs stay transparent.
- Don't give `Card` the standard `border` color or a drop shadow.
- Don't invent dark-mode values; they are not yet specified.
