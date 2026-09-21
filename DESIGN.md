---
version: alpha
name: Portfolio Monorepo
description: Neutral, ink-on-paper UI built on shadcn/Base UI — one shared token set in packages/ui, consumed by the portfolio site, the ledger app, and the auth app.
colors:
  primary: "oklch(54.6% 0.245 262.88)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  secondary-foreground: "oklch(0.205 0 0)"
  background: "oklch(99% 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.145 0 0)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.145 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.97 0 0)"
  accent-foreground: "oklch(0.205 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
typography:
  h1:
    fontFamily: Geist
    fontSize: 1.75rem
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
    letterSpacing: "0.08em"
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
    rounded: "{rounded.lg}"
    height: 32px
    padding: "0 10px"
  button-primary-hover:
    backgroundColor: "oklch(54.6% 0.245 262.88 / 80%)"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: "0 10px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: "0 10px"
  button-destructive:
    backgroundColor: "oklch(0.577 0.245 27.325 / 10%)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: "0 10px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: 16px
  input:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: "4px 10px"
---

## Overview

The repo is a Bun/Turborepo monorepo (`apps/portfolio`, `apps/auth`, `apps/ledger`)
sharing one visual language through `packages/ui`. Every app pulls its color,
radius, and font tokens from `packages/ui/src/globals.css` (`@packages/ui/globals.css`)
so a change to the palette or radius scale propagates everywhere without
per-app duplication — `apps/ledger` is the one exception today, since it
predates the shared package and still carries its own copy of the same
token values in `apps/ledger/src/styles.css`.

The aesthetic is neutral and content-first: near-white background, near-black
text, a single blue accent (`primary`) reserved for interactive emphasis, and
no decorative color beyond that. Both light and dark themes exist — dark mode
is a `.dark` class scope defined alongside the light tokens in the same file,
not a second token set — see that file for the dark values.

## Colors

- **`primary`** (`oklch(54.6% 0.245 262.88)`) — the only saturated color in the
  system. Reserved for primary actions, active/selected states, and links.
  Never used for large surfaces.
- **`background` / `foreground`** — near-white (`oklch(99% 0 0)`) on near-black
  (`oklch(0.145 0 0)`). The base reading surface.
- **`card` / `popover`** — pure white, used to lift surfaces a step above
  `background` (cards, dropdowns, dialogs).
- **`secondary` / `muted` / `accent`** — the same light-gray value
  (`oklch(0.97 0 0)`) used for low-emphasis fills (secondary buttons, muted
  backgrounds, hover states). They are distinct tokens in code so each can
  diverge later, but currently share one value.
- **`muted-foreground`** — mid-gray (`oklch(0.556 0 0)`) for secondary text:
  captions, timestamps, placeholder copy.
- **`destructive`** — reserved for delete/irreversible actions, almost always
  at reduced opacity as a background (`/10`) with the full-strength color as
  text, per `button-destructive`.
- **`border` / `input` / `ring`** — structural grays for dividers, form
  borders, and the focus ring (`ring` at `/50` opacity on focus-visible).

## Typography

One typeface, Geist, for everything except the wordmark. Headings step down
from `h1` (1.75rem/600) to `h6` (0.8125rem/500, uppercase, letter-spaced) —
see `Heading2`/`Heading3` in `apps/portfolio/src/components/contents.tsx` and
the cascade in `typeset.css` (`packages/ui/src/typeset.css`, imported as
`@packages/ui/typeset.css`) for how these apply to rendered markdown/rich
content. Geist Mono is used for code and a handful of uppercase micro-labels
(section eyebrows use `body-sm`-scale mono, uppercase, wide tracking).
Calloveya is a single-use display face for the portfolio wordmark only — it
is never used for body or UI copy.

`typeset.css`'s `--typeset-font-body` / `--typeset-font-heading` are the
override points for swapping either face per app; both `apps/portfolio` and
`apps/ledger` currently point both at `--font-sans` (Geist) so headings and
body read as one family.

## Layout

Radius and spacing both derive from a single `--radius` base (`0.625rem`) via
`calc()` in `packages/ui/src/globals.css`'s `@theme inline` block — `sm`
through `4xl` all scale off that one variable, so retuning `--radius` retunes
every rounded corner in the app at once. Spacing follows Tailwind's default
4px-based scale; there is no custom spacing scale layered on top of it.

## Shapes

Corner radius scales from 6px (`sm`, small controls) to 14px (`xl`, cards and
dialogs). Buttons and inputs at default size use `lg` (10px); compact
(`xs`/`sm`) button sizes clamp to a smaller radius so they don't look
over-rounded relative to their height.

## Components

- **`button-primary`** — the only high-emphasis surface in the system; solid
  `primary` fill, drops to 80% opacity on hover rather than a darker shade.
- **`button-secondary` / `button-outline`** — low-emphasis actions; outline
  sits directly on `background` with a visible border, secondary uses the
  shared light-gray fill.
- **`button-destructive`** — intentionally muted by default (10% tint
  background, full-strength text color), not a solid red fill — keeps
  destructive actions visible without making them visually loud by default.
- **`card`** — `xl` radius, `card` background, a 1px `foreground/10` ring
  (not a hard `border` token) rather than the standard border color, which
  reads as softer for content containers than for inputs/buttons.
- **`input`** — same height and radius as a default button so the two align
  on a form row; background is fully transparent (relies on the page/card
  background beneath it), not a filled `muted` surface.

## Do's and Don'ts

- **Do** pull tokens from `@packages/ui/globals.css`; don't hardcode hex/oklch
  values in a component when a token already covers it.
- **Do** treat `primary` as scarce — one accent color, used for one job
  (interaction). Don't introduce a second saturated color for emphasis.
- **Do** use `destructive` at reduced-opacity background by default (see
  `button-destructive`); reserve a solid destructive fill for true
  confirm-to-delete moments, not routine "remove" buttons.
- **Don't** use Calloveya outside the portfolio wordmark — it has no defined
  weight/style pairing for body or UI text.
- **Do** wrap rendered markdown/rich content in `.typeset` (see
  `packages/ui/src/typeset.css`) instead of re-deriving heading/paragraph
  spacing per component.
