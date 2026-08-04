# Monorepo Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan phase-by-phase. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Commit policy:** Do NOT commit after individual phases. The working tree stays uncommitted (but saved on disk) across the whole plan. There is exactly one commit, in Phase 7, after everything below has been implemented and verified. If you need to pause between phases, leave the tree dirty — do not commit partial work.
>
> **Testing policy:** Do not run typecheck/lint/build/dev checks after each phase. Implement every phase's file changes, then run the full verification pass once, in Phase 7. This is intentional — the user will also review manually at the end.

**Goal:** Turn this repo (`hibatillah/hibatillah.com`) into the single Turborepo + Bun monorepo for all of hibatillah's apps: the existing portfolio, a new shared UI package, a new centralized-identity auth package + app, and the `ledger` expense tracker (currently its own repo at `~/code/ledger`, on Cloudflare Workers + D1 + npm). One plan, seven phases, executed in order — each phase depends on the file layout the previous one leaves behind.

**Decisions locked in for this revision** (superseding the previous draft):

- **App folder name:** keep `apps/portfolio` (not `apps/main`). `main` collides conceptually with the `master`/`main` git branch name and is less descriptive once `apps/ledger` and `apps/auth` sit next to it — `portfolio` stays self-explanatory.
- **Shared dependency versions:** declared once via a **Bun catalog** in the root `package.json` (`workspaces.catalog`), so `apps/*`/`packages/*` reference `"catalog:"` instead of repeating version strings.
- **Single `CLAUDE.md`:** one root-level file for the whole monorepo. No per-app `CLAUDE.md`. App-specific notes (commands, conventions) live as sections within the root file.
- **Config file format:** `.oxlintrc.json` → `oxlint.config.ts`, `.oxfmtrc.json` → `oxfmt.config.ts`. Confirmed both tools support `.ts` config via `defineConfig()` (oxlint: [config-file-reference](https://oxc.rs/docs/guide/usage/linter/config-file-reference.html); oxfmt: [config docs](https://oxc.rs/docs/guide/usage/formatter/config)). Requires Node ≥22.18 or ≥24 to execute — already satisfied by this repo's `engines.node >=24.12.0`.
- **Full scope, one plan:** this single plan now covers the scaffold, `packages/ui`, `packages/auth` + `apps/auth`, the `apps/ledger` migration off Cloudflare/D1, and cross-subdomain SSO wiring. Nothing is deferred to a follow-up plan.
- **Ledger history:** brought in as a plain copy (`cp`-then-`git add`), not `git subtree`/`git filter-repo`. This is a solo repo and preserving ledger's separate commit history inside this repo's history isn't worth the added complexity — ledger's existing history stays intact in the `hibatillah/ledger` repo, which is simply archived/left private after the move.

---

## Repo layout at the end of this plan

```
hibatillah.com/
├── apps/
│   ├── portfolio/     # Next.js — hibatillah.com (existing app, moved)
│   ├── auth/          # Next.js — auth.hibatillah.com (new — login/signup)
│   └── ledger/        # TanStack Start — ledger.hibatillah.com (moved from ~/code/ledger)
├── packages/
│   ├── ui/            # shared shadcn/base-ui components, hooks, lib
│   └── auth/           # Better Auth config + identity schema/db client (Neon "identity" db)
├── package.json        # workspaces + catalog
├── turbo.json
├── tsconfig.base.json
├── oxlint.config.ts
├── oxfmt.config.ts
└── CLAUDE.md            # single, root-level
```

Two Neon databases in one Neon project: **identity** (owned by `packages/auth`) and **ledger** (owned by `apps/ledger`). No shared `packages/db` or `packages/schema` — each app/package that owns a database keeps its schema and client colocated with itself.

---

## Before you start

Confirm you're in `C:\Users\hibat\code\portfolio`, on a clean working tree, on `master`. Also confirm `~/code/ledger` exists and is the source for Phase 5.

- [ ] **Step 0: Create the branch**

```bash
git checkout -b feat/monorepo-merge
```

---

## Phase 1: Monorepo scaffold

Move the existing portfolio into `apps/portfolio`, add root workspace tooling. No behavior change to the site itself.

**Files:**

- Create: `apps/portfolio/` (via `git mv` of existing files)
- Create: `package.json` (new root manifest), `turbo.json`, `tsconfig.base.json`, `oxlint.config.ts`, `oxfmt.config.ts`, `CLAUDE.md` (root)
- Modify: `apps/portfolio/package.json`, `apps/portfolio/tsconfig.json`, `.gitignore`
- Delete: `.oxlintrc.json`, `.oxfmtrc.json`, `apps/portfolio/CLAUDE.md` (folded into root)

- [ ] **Step 1: Move all portfolio app files into `apps/portfolio/`**

```bash
mkdir -p apps/portfolio
git mv src apps/portfolio/src
git mv public apps/portfolio/public
git mv registry apps/portfolio/registry
git mv registry.json apps/portfolio/registry.json
git mv components.json apps/portfolio/components.json
git mv next.config.ts apps/portfolio/next.config.ts
git mv next-env.d.ts apps/portfolio/next-env.d.ts
git mv postcss.config.mjs apps/portfolio/postcss.config.mjs
git mv tsconfig.json apps/portfolio/tsconfig.json
git mv package.json apps/portfolio/package.json
git mv DESIGN.md apps/portfolio/DESIGN.md
git mv README.md apps/portfolio/README.md
git rm CLAUDE.md
mv .env.local apps/portfolio/.env.local 2>/dev/null || echo "no .env.local at root, skipping"
rm -f tsconfig.tsbuildinfo
```

- [ ] **Step 2: Write the new root `package.json`** with a Bun catalog for versions shared across `apps/portfolio`, `apps/auth`, and (from Phase 5) `apps/ledger` — both Next.js apps and TanStack Start share React, Base UI, and most utility libs, per `~/code/ledger/package.json`'s dependency list mirroring this repo's:

```json
{
	"name": "hibatillah",
	"version": "0.0.0",
	"private": true,
	"homepage": "https://hibatillah.com",
	"repository": {
		"type": "git",
		"url": "https://github.com/hibatillah/hibatillah.com"
	},
	"workspaces": {
		"packages": ["apps/*", "packages/*"],
		"catalog": {
			"react": "^19.2.6",
			"react-dom": "^19.2.6",
			"typescript": "^6.0.3",
			"tailwindcss": "^4.3.0",
			"tw-animate-css": "^1.4.0",
			"tailwind-merge": "^3.5.0",
			"@base-ui/react": "1.3.0",
			"class-variance-authority": "^0.7.1",
			"clsx": "^2.1.1",
			"cmdk": "^1.1.1",
			"date-fns": "^4.1.0",
			"lucide-react": "^1.16.0",
			"sonner": "^2.0.7",
			"vaul": "^1.1.2",
			"zod": "^4.3.6",
			"drizzle-orm": "^0.45.2",
			"drizzle-kit": "^0.31.10",
			"better-auth": "^1.6.2",
			"@types/react": "^19.2.15",
			"@types/react-dom": "^19.2.3"
		}
	},
	"scripts": {
		"dev": "turbo run dev",
		"dev:portfolio": "turbo run dev --filter=@apps/portfolio",
		"dev:auth": "turbo run dev --filter=@apps/auth",
		"dev:ledger": "turbo run dev --filter=@apps/ledger",
		"build": "turbo run build",
		"build:portfolio": "turbo run build --filter=@apps/portfolio",
		"build:auth": "turbo run build --filter=@apps/auth",
		"build:ledger": "turbo run build --filter=@apps/ledger",
		"start": "turbo run start",
		"lint": "oxlint .",
		"lint:fix": "oxlint --fix .",
		"format": "oxfmt --disable-nested-config .",
		"format:check": "oxfmt --check --disable-nested-config .",
		"prepare": "husky"
	},
	"devDependencies": {
		"husky": "^9.1.7",
		"lint-staged": "^16.2.7",
		"oxfmt": "^0.51.0",
		"oxlint": "^1.66.0",
		"turbo": "^2.6.1"
	},
	"lint-staged": {
		"*.{js,jsx,ts,tsx}": ["oxlint --fix", "oxfmt"],
		"*.json": "oxfmt"
	},
	"ignoreScripts": ["sharp", "unrs-resolver"],
	"trustedDependencies": ["sharp", "unrs-resolver"],
	"engines": {
		"bun": ">=1.3.5",
		"node": ">=24.12.0"
	},
	"packageManager": "bun@1.3.5"
}
```

Note: `workspaces` becomes an object (`packages` + `catalog`), not the bare array from before — this is Bun's catalog syntax (mirrors the `sanctuarynode/acure` convention). Any package can reference a cataloged version with the literal string `"catalog:"` instead of a version range.

- [ ] **Step 3: Rewrite `apps/portfolio/package.json`** to drop root-level concerns and point catalog-shared deps at `"catalog:"`:

```json
{
	"name": "@apps/portfolio",
	"version": "1.1.0",
	"scripts": {
		"dev": "next dev",
		"build": "next build",
		"start": "next start"
	},
	"dependencies": {
		"@base-ui/react": "catalog:",
		"@better-upload/client": "^3.0.17",
		"@ecosy/next-themes": "^0.4.6",
		"@mdx-js/loader": "^3.1.1",
		"@mdx-js/react": "^3.1.1",
		"@next/mdx": "^16.1.2",
		"@tanstack/react-query": "^5.90.20",
		"@types/mdx": "^2.0.13",
		"@vercel/analytics": "^1.6.1",
		"@vercel/edge-config": "^1.4.3",
		"@vercel/speed-insights": "^1.3.1",
		"better-all": "^0.0.5",
		"class-variance-authority": "catalog:",
		"clsx": "catalog:",
		"cmdk": "catalog:",
		"date-fns": "catalog:",
		"flags": "^4.2.0",
		"lucide-react": "catalog:",
		"motion": "^12.25.0",
		"next": "^16.2.6",
		"react": "catalog:",
		"react-day-picker": "^9.14.0",
		"react-dom": "catalog:",
		"react-dropzone": "^15.0.0",
		"react-hotkeys-hook": "^5.2.1",
		"remark-frontmatter": "^5.0.0",
		"remark-gfm": "^4.0.1",
		"remark-mdx-frontmatter": "^5.2.0",
		"shadcn": "^4.2.0",
		"sharp": "^0.34.5",
		"sonner": "catalog:",
		"tailwind-merge": "catalog:",
		"tailwind-scrollbar-hide": "^4.0.0",
		"vaul": "catalog:",
		"zwitch": "2.0.4"
	},
	"devDependencies": {
		"@tailwindcss/postcss": "^4.3.0",
		"@types/node": "^20",
		"@types/react": "catalog:",
		"@types/react-dom": "catalog:",
		"@vercel/toolbar": "^0.2.6",
		"babel-plugin-react-compiler": "1.0.0",
		"tailwindcss": "catalog:",
		"tw-animate-css": "catalog:",
		"typescript": "catalog:"
	}
}
```

- [ ] **Step 4: Delete the stale single-package lockfile**

```bash
rm -f bun.lock
```

(Don't `bun install` yet — Phase 6 does one clean install after every package/app exists, so it only needs to run once.)

- [ ] **Step 5: Write `tsconfig.base.json`**

```json
{
	"compilerOptions": {
		"target": "ES2017",
		"lib": ["dom", "dom.iterable", "esnext"],
		"allowJs": true,
		"skipLibCheck": true,
		"strict": true,
		"noEmit": true,
		"esModuleInterop": true,
		"module": "esnext",
		"moduleResolution": "bundler",
		"resolveJsonModule": true,
		"isolatedModules": true,
		"jsx": "react-jsx",
		"incremental": true
	}
}
```

- [ ] **Step 6: Point `apps/portfolio/tsconfig.json` at the base**

```json
{
	"extends": "../../tsconfig.base.json",
	"compilerOptions": {
		"plugins": [{ "name": "next" }],
		"paths": { "@/*": ["./src/*"] }
	},
	"include": [
		"next-env.d.ts",
		"**/*.ts",
		"**/*.tsx",
		".next/types/**/*.ts",
		".next/dev/types/**/*.ts",
		"**/*.mts"
	],
	"exclude": ["node_modules", "registry"]
}
```

- [ ] **Step 7: Delete `.oxlintrc.json` / `.oxfmtrc.json`, write `oxlint.config.ts` and `oxfmt.config.ts` at root**

```bash
git rm .oxlintrc.json .oxfmtrc.json
```

`oxlint.config.ts`:

```ts
import { defineConfig } from "oxlint"

export default defineConfig({
	categories: {
		correctness: "warn",
	},
	rules: {
		"eslint/no-unused-vars": "warn",
		"typescript/no-deprecated": "warn",
		"jsdoc/check-tag-names": "warn",
	},
	plugins: ["nextjs", "import", "jsdoc"],
	ignorePatterns: ["**/node_modules/**", "**/.next/**", "**/public/**", "**/registry/**"],
})
```

`oxfmt.config.ts`:

```ts
import { defineConfig } from "oxfmt"

export default defineConfig({
	bracketSameLine: false,
	semi: false,
	useTabs: true,
	experimentalTailwindcss: {
		stylesheet: "./apps/portfolio/src/app/globals.css",
		attributes: ["className", "tw"],
		functions: ["cn", "cva"],
	},
	ignorePatterns: ["**/node_modules/**", "**/.next/**", "**/public/**", "**/registry/**"],
})
```

`ignorePatterns` keep the `**/` prefix (matches inside `apps/*`/`packages/*`, not just repo root). The Tailwind stylesheet path is repointed since this config now lives at repo root, not inside the app.

- [ ] **Step 8: Write `turbo.json`**

```json
{
	"$schema": "https://turborepo.com/schema.json",
	"tasks": {
		"dev": { "cache": false, "persistent": true },
		"build": { "outputs": [".next/**", "!.next/cache/**", ".output/**"], "cache": false },
		"start": { "dependsOn": ["build"], "cache": false, "persistent": true }
	}
}
```

- [ ] **Step 9: Fix `.gitignore` anchoring** (the leading `/` on `node_modules` and `.next/` would silently stop matching once those paths exist at `apps/*/node_modules` instead of repo root) — replace the full file:

```gitignore
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
.next/
/out/

# tanstack start / nitro
.output/
.vinxi/
.tanstack/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
routeTree.gen.ts

# claude code
.claude/
.agents/
```

Added `.output/`/`.vinxi/`/`.tanstack/` (TanStack Start / Nitro build artifacts, needed once `apps/ledger` lands in Phase 5) and `routeTree.gen.ts` (TanStack Router's generated file, analogous to `next-env.d.ts`).

- [ ] **Step 10: Write the single root `CLAUDE.md`**

````markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working anywhere in this monorepo. There is only one `CLAUDE.md` in this repo — it covers every app and package.

## Structure

Bun workspaces (`apps/*`, `packages/*`) orchestrated with Turborepo (`turbo.json`). Shared dependency versions live in the root `package.json`'s `workspaces.catalog` — reference them from any app/package with `"<pkg>": "catalog:"` instead of hardcoding a version.

- `apps/portfolio` — Next.js portfolio site, hibatillah.com. Public, no auth.
- `apps/auth` — Next.js, auth.hibatillah.com. Centralized login/signup (Better Auth), used by every other app for SSO.
- `apps/ledger` — TanStack Start, ledger.hibatillah.com. Single-user expense tracker; deployed on Vercel, data in Neon Postgres.
- `packages/ui` — shared UI components (shadcn-style, built on Base UI), hooks, and `lib/utils` — consumed by any app that wants them.
- `packages/auth` — Better Auth configuration and the identity database's Drizzle schema/client (Neon "identity" database: user/session/account/passkey/verification). This is the ONLY shared database in the monorepo — it exists specifically so every app can validate one shared session via cross-subdomain cookies. Business data (ledger's expenses/tags/settings) stays in each app's own database; there is no shared `packages/db` or `packages/schema`.

Single root `oxlint.config.ts` / `oxfmt.config.ts` / `tsconfig.base.json` — apps/packages extend the base tsconfig but do not define their own lint/format config.

## Commands

Run from the repo root:

```bash
bun dev              # all apps' dev servers via turbo
bun dev:portfolio    # just apps/portfolio
bun dev:auth         # just apps/auth
bun dev:ledger       # just apps/ledger
bun build            # build all apps
bun lint             # oxlint, whole repo
bun format           # oxfmt, whole repo
```
````

## SSO / auth architecture

- One Neon project, two databases: `identity` (owned by `packages/auth`) and `ledger` (owned by `apps/ledger`).
- Better Auth's `crossSubDomainCookies` (domain: `hibatillah.com`) — no full OIDC. Any app under `*.hibatillah.com` can read the same session cookie directly.
- `apps/auth` is the only app that mounts Better Auth's HTTP API (`/api/auth/*`) and renders `/login` (+ an unlinked `/signup`, not yet exposed publicly since ledger stays single-user). Other apps (currently just `apps/ledger`) import `packages/auth`'s `betterAuth()` instance to call `auth.api.getSession()` locally against the shared cookie — no network hop to `apps/auth` needed for a session check, only for the actual login/OAuth/passkey flows.
- Unauthenticated requests to a protected app redirect to `https://auth.hibatillah.com/login?redirect=<url>`. The `redirect` param is validated against an allowlist of `*.hibatillah.com` origins before being honored (open-redirect protection) — see `apps/auth/src/lib/safe-redirect.ts`.

## Git workflow

Solo repo — never open pull requests. Feature branches merge straight into `master` locally (`git checkout master && git merge <branch> && git push`), then get deleted.

````

---

## Phase 2: Extract `packages/ui`

Pull the shadcn/Base UI component layer that both `apps/portfolio` and (from Phase 5) `apps/ledger` need, into a shared package — mirroring `sanctuarynode/acure`'s `packages/ui` subpath-export shape.

**Files:**
- Create: `packages/ui/package.json`, `packages/ui/src/components/ui/*`, `packages/ui/src/hooks/*`, `packages/ui/src/lib/utils.ts`, `packages/ui/src/globals.css`, `packages/ui/postcss.config.mjs`, `packages/ui/tsconfig.json`
- Modify: `apps/portfolio/package.json` (add `@packages/ui` dependency), every import in `apps/portfolio/src` that currently pulls from `@/components/ui/*` and now needs `@packages/ui/components/*`

`apps/portfolio/src/components/ui/svgs/` and the shadcn `registry/` stay in `apps/portfolio` — the registry publishes portfolio-specific custom components (`responsive-dialog`, `description-list`, `upload-dropzone`, `data-table-filter`), which is a different concern from a shared runtime package consumed by ledger.

- [ ] **Step 1: Diff the two apps' `src/components/ui/` to find the actual overlap**

Compare `apps/portfolio/src/components/ui/*.tsx` against `~/code/ledger/src/components/ui/*.tsx`. Ledger's list (already captured): `alert`, `button`, `button-group`, `calendar`, `card`, `chart`, `checkbox`, `command`, `data-table`, `dialog`, `drawer`, `dropdown-menu`, `empty`, `field`, `input`, `input-group`, `item`, `kbd`, `label`, `navigation-menu`, `popover`, `responsive-dialog`, `responsive-sheet`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`. Move every file present in **both** apps into `packages/ui/src/components/ui/`; leave anything portfolio-only (or ledger-only, until Phase 5 lands) where it is for now — Phase 5's Step on ledger's `src/components/ui` re-checks this same overlap once ledger's files physically exist in the repo, and moves any newly-overlapping ones then.

- [ ] **Step 2: Move `src/lib/utils.ts` (the `cn()` helper) and any shared hooks** (e.g. `use-mobile`) into `packages/ui/src/lib/` and `packages/ui/src/hooks/` respectively, via `git mv`.

- [ ] **Step 3: Write `packages/ui/package.json`** with a subpath exports map:

```json
{
	"name": "@packages/ui",
	"version": "0.0.0",
	"private": true,
	"exports": {
		"./components/*": "./src/components/ui/*.tsx",
		"./hooks/*": "./src/hooks/*.ts",
		"./lib/*": "./src/lib/*.ts",
		"./globals.css": "./src/globals.css",
		"./postcss.config": "./postcss.config.mjs"
	},
	"dependencies": {
		"@base-ui/react": "catalog:",
		"class-variance-authority": "catalog:",
		"clsx": "catalog:",
		"cmdk": "catalog:",
		"lucide-react": "catalog:",
		"react": "catalog:",
		"react-dom": "catalog:",
		"sonner": "catalog:",
		"tailwind-merge": "catalog:",
		"vaul": "catalog:"
	},
	"devDependencies": {
		"@types/react": "catalog:",
		"@types/react-dom": "catalog:",
		"tailwindcss": "catalog:",
		"typescript": "catalog:"
	}
}
````

- [ ] **Step 4: Move the Tailwind entry stylesheet.** Copy `apps/portfolio/src/app/globals.css`'s `@theme`/design-token block (fonts, color variables, the `font-calloveya` remap) into `packages/ui/src/globals.css` as the shared base; `apps/portfolio/src/app/globals.css` keeps only portfolio-specific overrides and `@import "@packages/ui/globals.css"` at the top. (`apps/ledger/src/styles.css`, once moved in Phase 5, does the same.)

- [ ] **Step 5: Write `packages/ui/tsconfig.json`** extending the root base:

```json
{
	"extends": "../../tsconfig.base.json",
	"compilerOptions": {
		"jsx": "react-jsx"
	},
	"include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

- [ ] **Step 6: Add `@packages/ui` as a workspace dependency of `apps/portfolio/package.json`** (`"@packages/ui": "workspace:*"`), and update every import site in `apps/portfolio/src` that referenced a moved component/hook/lib file — from `@/components/ui/button` to `@packages/ui/components/button`, from `@/lib/utils` to `@packages/ui/lib/utils`, etc. Use a repo-wide search for `@/components/ui/` and `@/lib/utils` inside `apps/portfolio/src` to find every call site; there is no compatibility shim — update all of them in this phase.

---

## Phase 3: `packages/auth` — identity schema, db client, Better Auth config

The one intentionally-shared database in the monorepo. Postgres (Neon), not SQLite — this is a fresh schema, not a port of ledger's D1 auth tables (Phase 5 drops those from ledger entirely once this package exists).

**Files:**

- Create: `packages/auth/package.json`, `packages/auth/src/schema.ts`, `packages/auth/src/db.ts`, `packages/auth/src/auth.ts`, `packages/auth/src/index.ts`, `packages/auth/drizzle.config.ts`, `packages/auth/tsconfig.json`

- [ ] **Step 1: Write `packages/auth/src/schema.ts`** — the pg translation of ledger's current `user`/`session`/`account`/`verification`/`passkey` sqlite tables (source: `~/code/ledger/src/lib/db/schema.ts` lines 1-113), switching `sqliteTable`→`pgTable`, `integer(..., {mode:"timestamp_ms"})`→`timestamp(..., {mode:"date"})`, and `integer(..., {mode:"boolean"})`→`boolean(...)`:

```ts
import { relations, sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
})

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
)

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "date" }),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: "date" }),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
)

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
)

export const passkey = pgTable(
	"passkey",
	{
		id: text("id").primaryKey(),
		name: text("name"),
		publicKey: text("public_key").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		credentialID: text("credential_id").notNull(),
		counter: integer("counter").notNull(),
		deviceType: text("device_type").notNull(),
		backedUp: boolean("backed_up").notNull(),
		transports: text("transports"),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		aaguid: text("aaguid"),
	},
	(table) => [
		index("passkey_userId_idx").on(table.userId),
		index("passkey_credentialID_idx").on(table.credentialID),
	],
)

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	passkeys: many(passkey),
}))

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const passkeyRelations = relations(passkey, ({ one }) => ({
	user: one(user, { fields: [passkey.userId], references: [user.id] }),
}))
```

- [ ] **Step 2: Write `packages/auth/src/db.ts`** — a direct `export const db`, per your earlier decision to drop the `createDB()`-factory pattern now that there's no Cloudflare binding to thread per-request. Uses `neon-http` (HTTP-based, no connection pool to leak across serverless invocations — the right driver for Vercel Fluid Compute, vs. plain `postgres`/TCP which needs pool lifecycle management):

```ts
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"

import * as schema from "./schema"

const sql = neon(process.env.IDENTITY_DATABASE_URL!)

export const db = drizzle({ client: sql, schema })
```

- [ ] **Step 3: Write `packages/auth/src/auth.ts`** — the shared `betterAuth()` instance, adapted from `~/code/ledger/src/lib/auth/index.ts` (drop the Cloudflare `Env`/`getEnv()` threading, switch the adapter to `provider: "pg"`, add `crossSubDomainCookies` + `trustedOrigins`):

```ts
import { passkey } from "@better-auth/passkey"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { db } from "./db"

const isProd = process.env.NODE_ENV === "production"
const rootDomain = "hibatillah.com"

export const auth = betterAuth({
	baseURL: process.env.AUTH_BASE_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: "pg" }),
	advanced: {
		crossSubDomainCookies: {
			enabled: true,
			domain: rootDomain,
		},
	},
	trustedOrigins: [
		`https://${rootDomain}`,
		`https://ledger.${rootDomain}`,
		`https://auth.${rootDomain}`,
	],
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			prompt: "login",
			disableSignUp: true,
		},
	},
	plugins: [
		passkey({
			rpName: "hibatillah",
			rpID: isProd ? rootDomain : "localhost",
			origin: process.env.AUTH_BASE_URL,
			authenticatorSelection: {
				residentKey: "required",
				userVerification: "preferred",
			},
		}),
	],
})

export type Auth = typeof auth
```

Dropped vs. ledger's original: the `resolveUser` owner-only passkey registration guard (ledger-specific single-owner assumption — re-add it in `apps/ledger`'s own usage if still needed there, not in the shared package) and `tanstackStartCookies()` (that plugin is TanStack-Start-specific; `apps/auth`, being Next.js, doesn't need it — Phase 5 adds it back locally in `apps/ledger` if ledger's own TanStack Start server needs the same-request cookie helper).

- [ ] **Step 4: Write `packages/auth/src/index.ts`** re-exporting `auth`, `db`, and the schema for consumers.

- [ ] **Step 5: Write `packages/auth/drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit"

export default defineConfig({
	schema: "./src/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.IDENTITY_DATABASE_URL!,
	},
})
```

- [ ] **Step 6: Write `packages/auth/package.json`**

```json
{
	"name": "@packages/auth",
	"version": "0.0.0",
	"private": true,
	"scripts": {
		"db:generate": "drizzle-kit generate",
		"db:migrate": "drizzle-kit migrate",
		"db:studio": "drizzle-kit studio"
	},
	"exports": {
		".": "./src/index.ts"
	},
	"dependencies": {
		"@better-auth/passkey": "^1.6.11",
		"@neondatabase/serverless": "^1.0.2",
		"better-auth": "catalog:",
		"drizzle-orm": "catalog:"
	},
	"devDependencies": {
		"drizzle-kit": "catalog:",
		"typescript": "catalog:"
	}
}
```

- [ ] **Step 7: Write `packages/auth/tsconfig.json`** extending the root base (same shape as `packages/ui/tsconfig.json` from Phase 2, `include: ["src/**/*.ts"]`).

- [ ] **Step 8: Create the Neon project/database.** In the Vercel/Neon dashboard (or via `vercel env` once the CLI is installed), create one Neon project with two databases: `identity` and `ledger`. Set `IDENTITY_DATABASE_URL` (pointing at the `identity` database) in this package's local `.env` and in Vercel's env vars for both `apps/auth` and `apps/ledger` (both need to read the identity DB — `apps/auth` to serve the API, `apps/ledger` to call `getSession()`). This is an external/manual step — note it and move on; Phase 7 doesn't attempt to automate account/dashboard actions.

- [ ] **Step 9: Write `packages/auth/scripts/seed.ts` — bootstrap the owner account.** `socialProviders.google.disableSignUp: true` blocks brand-new emails from signing up via Google, but Better Auth's account linking (`accountLinking.enabled`, default `true`) implicitly links a Google sign-in to an **existing** `user` row with a matching email — it does not require that user to already have an `account` row. So seeding a bare `user` row for the owner's email before their first login is sufficient; no `disableSignUp` toggling or passkey `requireSession` override needed. This was confirmed against Better Auth's own docs (`/docs/reference/options#accountlinking`), not assumed.

```ts
import { db } from "../src/db"
import { user } from "../src/schema"

const OWNER_EMAIL = "hibatillahhabib@gmail.com"
const OWNER_NAME = "hibatillah"

async function seed() {
	const existing = await db.query.user.findFirst({ where: (u, { eq }) => eq(u.email, OWNER_EMAIL) })
	if (existing) {
		console.log(`Owner user already seeded (id: ${existing.id})`)
		return
	}
	const [created] = await db
		.insert(user)
		.values({
			id: crypto.randomUUID(),
			name: OWNER_NAME,
			email: OWNER_EMAIL,
			emailVerified: true,
		})
		.returning()
	console.log(`Seeded owner user: ${created.id}`)
}

seed()
```

Add a `"db:seed": "bun run scripts/seed.ts"` script to `packages/auth/package.json`. This only inserts a `user` row — it does NOT create a `session`/`account`/`passkey` row, since the first Google sign-in (via implicit account linking) or first passkey registration-after-that-first-login creates those. Run this once, manually, against the real Neon `identity` database after Step 8 — not part of Phase 7's automated verification (it needs `IDENTITY_DATABASE_URL` pointed at production, not a throwaway).

---

## Phase 4: `apps/auth` — centralized login/signup

Standalone Next.js app for `auth.hibatillah.com`. Mounts `packages/auth`'s Better Auth instance as an API route and renders the login UI (+ an unlinked signup route).

**Files:**

- Create: `apps/auth/package.json`, `apps/auth/next.config.ts`, `apps/auth/tsconfig.json`, `apps/auth/src/app/api/auth/[...all]/route.ts`, `apps/auth/src/app/login/page.tsx`, `apps/auth/src/app/signup/page.tsx`, `apps/auth/src/lib/auth-client.ts`, `apps/auth/src/lib/safe-redirect.ts`

- [ ] **Step 1: Write `apps/auth/package.json`**

```json
{
	"name": "@apps/auth",
	"version": "0.0.0",
	"private": true,
	"scripts": {
		"dev": "next dev --port 3001",
		"build": "next build",
		"start": "next start"
	},
	"dependencies": {
		"@packages/auth": "workspace:*",
		"@packages/ui": "workspace:*",
		"better-auth": "catalog:",
		"next": "^16.2.6",
		"react": "catalog:",
		"react-dom": "catalog:"
	},
	"devDependencies": {
		"@types/node": "^20",
		"@types/react": "catalog:",
		"@types/react-dom": "catalog:",
		"tailwindcss": "catalog:",
		"typescript": "catalog:"
	}
}
```

- [ ] **Step 2: Write the Better Auth route handler** — `apps/auth/src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from "@packages/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

- [ ] **Step 3: Write `apps/auth/src/lib/auth-client.ts`** — the Better Auth React client, pointed at this app's own origin (cookies are shared cross-subdomain, so the client only ever needs to talk to `auth.hibatillah.com`):

```ts
import { createAuthClient } from "better-auth/react"
import { passkeyClient } from "@better-auth/passkey/client"

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL,
	plugins: [passkeyClient()],
})
```

- [ ] **Step 4: Write `apps/auth/src/lib/safe-redirect.ts`** — the open-redirect guard for the `?redirect=` query param used by other apps' login-redirect flow:

```ts
const ALLOWED_HOSTS = ["hibatillah.com", "ledger.hibatillah.com", "auth.hibatillah.com"]

export function safeRedirect(target: string | null, fallback = "/"): string {
	if (!target) return fallback
	try {
		const url = new URL(target, "https://auth.hibatillah.com")
		if (url.protocol !== "https:" && url.hostname !== "localhost") return fallback
		if (!ALLOWED_HOSTS.includes(url.hostname)) return fallback
		return url.toString()
	} catch {
		return fallback
	}
}
```

- [ ] **Step 5: Write `apps/auth/src/app/login/page.tsx`** — email/password + Google + passkey sign-in, reading `?redirect=` via `safeRedirect()` and calling `router.push` (or a full `window.location.assign`, since the destination is cross-subdomain) on success. Build this against `packages/ui`'s `Button`/`Input`/`Card` components.

- [ ] **Step 6: Write `apps/auth/src/app/signup/page.tsx`** — same shape as login but for account creation. Do not link to it from anywhere (no nav link, no "Don't have an account?" on the login page) — per your instruction, it exists and works but stays undiscoverable while ledger is single-user.

- [ ] **Step 7: Write `apps/auth/next.config.ts` and `apps/auth/tsconfig.json`** (same base shape as `apps/portfolio`'s, extending `../../tsconfig.base.json`, transpiling `@packages/ui`/`@packages/auth` via `transpilePackages: ["@packages/ui", "@packages/auth"]` in `next.config.ts` since they ship TS source, not prebuilt JS).

---

## Phase 5: `apps/ledger` — migrate off Cloudflare/D1/npm

Move ledger's source from `~/code/ledger` into this repo at `apps/ledger`, then migrate: npm → Bun, Cloudflare Workers → Vercel, D1 (SQLite) → Neon (Postgres, "ledger" database), and drop ledger's local auth tables/routes in favor of `packages/auth`'s shared identity db. Framework stays TanStack Start — nothing here changes the app's UI or business logic, only its infrastructure.

**Files:**

- Create: `apps/ledger/` (copied from `~/code/ledger`, then modified in place)
- Modify: `apps/ledger/package.json`, `apps/ledger/vite.config.ts`, `apps/ledger/src/server.ts`, `apps/ledger/src/lib/db/*`, `apps/ledger/src/lib/auth/*`, `apps/ledger/drizzle.config.ts`, `apps/ledger/src/lib/db/schema.ts` (trimmed to business tables only)
- Delete: `apps/ledger/wrangler.jsonc`, `apps/ledger/.github/workflows/*` (Cloudflare-specific CI), `apps/ledger/src/lib/db/singleton.ts` (no longer needed without per-request Cloudflare binding threading)

- [ ] **Step 1: Copy ledger's source into the repo** (plain copy, no git history carried over — see "Decisions locked in" above):

```bash
mkdir -p apps/ledger
cp -r ~/code/ledger/src apps/ledger/src
cp -r ~/code/ledger/public apps/ledger/public
cp -r ~/code/ledger/drizzle apps/ledger/drizzle
cp -r ~/code/ledger/scripts apps/ledger/scripts
cp ~/code/ledger/components.json apps/ledger/components.json
cp ~/code/ledger/tsconfig.json apps/ledger/tsconfig.json
cp ~/code/ledger/vite.config.ts apps/ledger/vite.config.ts
cp ~/code/ledger/vitest.config.ts apps/ledger/vitest.config.ts
cp ~/code/ledger/drizzle.config.ts apps/ledger/drizzle.config.ts
cp ~/code/ledger/.env.example apps/ledger/.env.example
cp ~/code/ledger/README.md apps/ledger/README.md
git add apps/ledger
```

Do **not** copy: `package.json`/`package-lock.json` (rewritten in Step 2), `wrangler.jsonc` (Cloudflare-only, deleted), `drizzle.config.prod.ts` (Cloudflare-prod-specific, superseded by a single Neon-pointed config), `.github/` (Cloudflare deploy workflows — replaced by Vercel's own git integration, no workflow file needed), `node_modules`, `.wrangler/`, `dist/`, `CLAUDE.md` (folded into root per Phase 1's decision).

- [ ] **Step 2: Write `apps/ledger/package.json`** — Bun instead of npm, drop Cloudflare/Wrangler deps, add Neon:

```json
{
	"name": "@apps/ledger",
	"version": "0.0.0",
	"private": true,
	"scripts": {
		"dev": "vite dev --port 3002",
		"build": "vite build",
		"test": "vitest run",
		"db:generate": "drizzle-kit generate",
		"db:migrate": "drizzle-kit migrate",
		"db:studio": "drizzle-kit studio",
		"db:seed": "bun run scripts/seed.ts"
	},
	"dependencies": {
		"@base-ui/react": "catalog:",
		"@fontsource-variable/geist": "^5.2.9",
		"@neondatabase/serverless": "^1.0.2",
		"@packages/auth": "workspace:*",
		"@packages/ui": "workspace:*",
		"@tailwindcss/vite": "^4.3.0",
		"@tanstack/react-devtools": "^0.10.5",
		"@tanstack/react-form": "^1.32.0",
		"@tanstack/react-hotkeys": "^0.10.0",
		"@tanstack/react-query": "^5.100.14",
		"@tanstack/react-router": "^1.170.8",
		"@tanstack/react-router-devtools": "^1.167.0",
		"@tanstack/react-router-ssr-query": "^1.167.0",
		"@tanstack/react-start": "^1.168.13",
		"@tanstack/react-table": "^8.21.3",
		"@tanstack/router-plugin": "^1.166.13",
		"better-auth": "catalog:",
		"class-variance-authority": "catalog:",
		"clsx": "catalog:",
		"cmdk": "catalog:",
		"date-fns": "catalog:",
		"drizzle-orm": "catalog:",
		"heat-graph": "^0.0.9",
		"lucide-react": "catalog:",
		"next-themes": "^0.4.6",
		"papaparse": "^5.5.3",
		"react": "catalog:",
		"react-day-picker": "^10.0.1",
		"react-dom": "catalog:",
		"recharts": "^3.8.1",
		"sonner": "catalog:",
		"tailwind-merge": "catalog:",
		"tw-animate-css": "catalog:",
		"vaul": "catalog:",
		"vite-tsconfig-paths": "^6.1.1",
		"zod": "catalog:"
	},
	"devDependencies": {
		"@testing-library/dom": "^10.4.1",
		"@testing-library/react": "^16.3.2",
		"@types/node": "^25.9.1",
		"@types/papaparse": "^5.5.2",
		"@types/react": "catalog:",
		"@types/react-dom": "catalog:",
		"@vitejs/plugin-react": "^6.0.2",
		"drizzle-kit": "catalog:",
		"jsdom": "^29.1.1",
		"nitro": "^3.0.0",
		"typescript": "catalog:",
		"vite": "^8.0.14",
		"vitest": "^4.1.7",
		"web-vitals": "^5.1.0"
	}
}
```

Removed: `@cloudflare/vite-plugin`, `@cloudflare/workers-types`, `better-sqlite3`, `@types/better-sqlite3`, `wrangler`, `@better-auth/passkey`/`shadcn` (passkey now lives in `packages/auth`; `shadcn` CLI isn't needed at runtime — reinstall as a dev-only tool later if you re-run the CLI). Added `nitro` (TanStack Start's Vercel deploy path goes through the Nitro Vite plugin, per [Vercel's TanStack Start docs](https://vercel.com/docs/frameworks/full-stack/tanstack-start)) and `@neondatabase/serverless`.

- [ ] **Step 3: Rewrite `apps/ledger/vite.config.ts`** — swap the Cloudflare plugin for Nitro's Vercel preset:

```ts
import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	plugins: [
		devtools(),
		viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackStart(),
		nitro({ preset: "vercel" }),
		viteReact(),
	],
})
```

Verify the exact Nitro option name/shape against `nitro`'s current docs at execution time — the `nitro({ preset: "vercel" })` shape reflects what's documented as of this plan being written ([TanStack Start hosting guide](https://tanstack.com/start/v0/docs/framework/react/guide/hosting), [Vercel's TanStack Start docs](https://vercel.com/docs/frameworks/full-stack/tanstack-start)); Vercel also auto-detects the TanStack Start framework from `package.json`, so an explicit `vercel.json` shouldn't be needed.

- [ ] **Step 4: Trim `apps/ledger/src/lib/db/schema.ts`** to business tables only — delete the `user`/`session`/`account`/`verification`/`passkey` tables and their relations (lines 1-19, 21-113 of the original) entirely; keep only `settings`, `tags`, `expenses` (lines 115-136 of the original), translated from `sqliteTable` to `pgTable`:

```ts
import { sql } from "drizzle-orm"
import { pgTable, text, integer, index } from "drizzle-orm/pg-core"

export const settings = pgTable("settings", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
})

export const tags = pgTable("tags", {
	name: text("name").primaryKey(),
	color: text("color").notNull(),
	createdAt: text("created_at").notNull(),
})

export const expenses = pgTable(
	"expenses",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		date: text("date").notNull(),
		amount: integer("amount").notNull(),
		tag: text("tag").notNull(),
		createdAt: text("created_at").notNull(),
	},
	(table) => [index("expenses_tag_idx").on(table.tag)],
)
```

(`integer(...).primaryKey({autoIncrement: true})` in sqlite-core becomes `integer(...).primaryKey().generatedAlwaysAsIdentity()` in pg-core — Postgres identity column, the modern equivalent of `SERIAL`.)

- [ ] **Step 5: Rewrite `apps/ledger/src/lib/db/index.ts`** — direct `export const db` against Neon, same pattern as `packages/auth/src/db.ts`, no more `createDb(d1)`/Proxy-based lazy singleton (that existed only to defer binding access until a Cloudflare Worker request arrived — Neon has no such per-request binding):

```ts
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"

import * as schema from "./schema"

const sql = neon(process.env.LEDGER_DATABASE_URL!)

export const db = drizzle({ client: sql, schema })
```

- [ ] **Step 6: Delete `apps/ledger/src/lib/db/singleton.ts`** and every `setDb`/`getDb`/`setEnv`/`getEnv` call site (currently: `src/server.ts`, `src/lib/auth/index.ts` — grep for `db/singleton` across `apps/ledger/src` to catch any others). `db` is now a plain module import everywhere.

- [ ] **Step 7: Delete `apps/ledger/src/lib/auth/index.ts`'s local `createAuth`/`getAuth`**, and replace ledger's auth usage with `packages/auth`'s shared instance. Everywhere ledger currently does `import { getAuth } from "@/lib/auth"` (e.g. `src/server/middleware.ts`, `src/routes/api/auth/*`), change to `import { auth } from "@packages/auth"` and call `auth.api.getSession(...)` directly — no more per-request `getAuth()` lazy-init, since `packages/auth`'s `db`/`auth` are already plain module-level exports.

If ledger's owner-only passkey registration guard (the `resolveUser` check against `hibatillahhabib@gmail.com`, dropped from the shared package in Phase 3 Step 3) is still wanted for ledger specifically, re-add it here as a ledger-local passkey plugin instance layered on top of the shared `auth` config, rather than back in `packages/auth` (keeps that constraint scoped to ledger, not baked into the shared identity package that `apps/auth`/future apps also use).

- [ ] **Step 8: Rewrite `apps/ledger/src/server.ts`** — drop the Cloudflare `fetch(request, env)` Worker export and `Env` type entirely; TanStack Start's Nitro/Vercel target uses the framework's default server entry, not a hand-rolled Worker handler:

```ts
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server"

export default createStartHandler(defaultStreamHandler)
```

- [ ] **Step 9: Rewrite `apps/ledger/drizzle.config.ts`** for Postgres:

```ts
import { defineConfig } from "drizzle-kit"

export default defineConfig({
	schema: "./src/lib/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.LEDGER_DATABASE_URL!,
	},
})
```

Delete the old `drizzle/*.sql` migrations and `drizzle/meta/` (they're SQLite-dialect migrations against tables that either no longer exist here, in the case of auth tables, or need fresh Postgres-dialect migrations, in the case of `settings`/`tags`/`expenses`) — regenerate with `bun run db:generate` against the new pg schema once dependencies are installed (Phase 7).

- [ ] **Step 10: Migrate ledger's existing D1 data into the new Neon `ledger` database.** This is real user data (expenses/tags/settings), not a throwaway dev seed — export then import:

```bash
cd ~/code/ledger
npx wrangler d1 export ledger --remote --output=/tmp/ledger-d1-export.sql
```

Convert the exported SQLite `INSERT` statements' data into `psql`-compatible inserts against the new Neon `ledger` database (column shapes are the same for `settings`/`tags`/`expenses`; only `expenses.id` needs to import as plain integers, which Postgres identity columns accept via explicit `INSERT ... (id, ...) VALUES (...)` — the sequence can be reset afterward with `SELECT setval(...)` to continue after the max imported id). Verify row counts match between the D1 export and the Neon `ledger` database before considering this step done.

- [ ] **Step 11: Delete `apps/ledger/wrangler.jsonc` and `.github/workflows/`** (`deploy.yml`, `preview-deploy.yml`, `preview-cleanup.yml` — all Cloudflare-specific; Vercel's own Git integration handles preview/production deploys without a workflow file).

- [ ] **Step 12: Re-check the `packages/ui` overlap now that ledger's files physically exist** (Phase 2 Step 1's deferred check). Diff `apps/ledger/src/components/ui/*` against what's already in `packages/ui/src/components/ui/` — move any additional overlapping files (there's likely near-total overlap per the file list captured during planning: `alert`, `button-group`, `chart`, `command`, `data-table`, `empty`, `field`, `input-group`, `item`, `kbd`, `navigation-menu`, etc. are ledger-only-so-far names not yet in the portfolio's set — confirm case-by-case) into `packages/ui`, delete the duplicates from both `apps/portfolio/src/components/ui` and `apps/ledger/src/components/ui`, and update import sites in both apps. `apps/ledger/src/components/data-table-filter/` and `apps/ledger/src/components/charts/`, `dashboard/`, `expense/`, `passkey/` stay ledger-local — they're ledger-specific composed components, not generic UI primitives.

- [ ] **Step 13: Write `apps/ledger/tsconfig.json`** extending the root base (keep `vite-tsconfig-paths`' existing `@/*` path mapping and TanStack Router's route-tree include, adjust `extends` to `../../tsconfig.base.json`).

---

## Phase 6: Cross-subdomain SSO wiring

Wire the actual redirect-to-login-and-back flow. `apps/portfolio` stays fully public (no auth) — this phase only touches `apps/ledger` and `apps/auth`.

**Files:**

- Modify: `apps/ledger/src/server/middleware.ts`, `apps/ledger/src/routes/login.tsx` (or delete, if login now fully lives in `apps/auth`), `apps/ledger/src/routes/api/auth/*`

- [ ] **Step 1: Update ledger's `authMiddleware`/`requireAuth`** (`src/server/middleware.ts`) to redirect to the centralized login instead of a local `/login` route:

```ts
import { redirect } from "@tanstack/react-router"
import { createMiddleware } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"

import { auth } from "@packages/auth"

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const request = getRequest()
	const session = await auth.api.getSession({ headers: request.headers })
	if (!session) {
		const returnTo = encodeURIComponent(request.url)
		throw redirect({ href: `https://auth.hibatillah.com/login?redirect=${returnTo}` })
	}
	return next()
})
```

- [ ] **Step 2: Delete `apps/ledger/src/routes/login.tsx`** — login now lives solely at `apps/auth`. If ledger's root route (`src/routes/__root.tsx`) or router config references the local `/login` path directly (not just via the middleware redirect), update those references to the external URL too.

- [ ] **Step 3: Confirm ledger no longer mounts its own `/api/auth/*` handler** — Delete `apps/ledger/src/routes/api/auth/` entirely. Ledger only ever calls `auth.api.getSession()` for read-only session checks; the actual login/signup/OAuth-callback/passkey-registration HTTP endpoints belong exclusively to `apps/auth`'s `/api/auth/[...all]/route.ts` from Phase 4.

- [ ] **Step 4: Set matching env vars across `apps/auth` and `apps/ledger`** — both need `BETTER_AUTH_SECRET` (same value, since they share one Better Auth config/db) and `IDENTITY_DATABASE_URL`; `apps/auth` additionally needs `AUTH_BASE_URL=https://auth.hibatillah.com`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; `apps/ledger` additionally needs `LEDGER_DATABASE_URL`. Document these in each app's `.env.example` (create `apps/ledger/.env.example` if the copied one from Phase 5 doesn't already list the new Postgres/identity vars, replacing the old `CLOUDFLARE_*`/D1 ones).

---

## Phase 7: Full verification pass and single commit

Everything above happens with an uncommitted, dirty working tree. This is the only phase that runs checks and the only phase that commits.

- [ ] **Step 1: One clean install for the whole workspace**

```bash
rm -rf node_modules apps/portfolio/node_modules apps/auth/node_modules apps/ledger/node_modules packages/ui/node_modules packages/auth/node_modules
bun install
```

Expected: completes with no errors, including `sharp`'s native postinstall build (checks the root-level `trustedDependencies` placement from Phase 1).

- [ ] **Step 2: Generate and run Drizzle migrations for both new Postgres schemas**

```bash
cd packages/auth && bun run db:generate && bun run db:migrate && cd ../..
cd apps/ledger && bun run db:generate && bun run db:migrate && cd ../..
```

Confirm this against the Neon databases created in Phase 3 Step 8, then re-run Phase 5 Step 10's data import against the now-migrated `ledger` database if it hasn't been done yet.

- [ ] **Step 3: Typecheck every workspace**

```bash
cd apps/portfolio && bunx tsc --noEmit && cd ../..
cd apps/auth && bunx tsc --noEmit && cd ../..
cd apps/ledger && bunx tsc --noEmit && cd ../..
cd packages/ui && bunx tsc --noEmit && cd ../..
cd packages/auth && bunx tsc --noEmit && cd ../..
```

- [ ] **Step 4: Lint and format check, whole repo**

```bash
bun run lint
bun run format:check
```

- [ ] **Step 5: Production build, every app**

```bash
bun run build
```

Expected: `apps/portfolio/.next`, `apps/auth/.next`, and `apps/ledger/.output` (Nitro's build output dir) all produced; Turborepo reports all three `build` tasks succeeded.

- [ ] **Step 6: Dev server smoke check, each app** — start each with `bun run dev:portfolio` / `bun run dev:auth` / `bun run dev:ledger` in turn. Since subdomain-based cross-subdomain cookies don't work against plain `localhost` (there's no shared root domain locally), the fullest local check is: portfolio renders unchanged; auth's `/login` and `/signup` render and the Better Auth API responds; ledger's protected routes redirect to `auth`'s login URL (the redirect firing correctly is verifiable locally even though the cookie won't actually carry over without deployed subdomains). Full end-to-end SSO (login on `auth.hibatillah.com`, land authenticated on `ledger.hibatillah.com`) needs an actual deploy to verify — call this out explicitly as a manual post-deploy check, not something this phase can complete locally.

- [ ] **Step 7: Review, then the one commit**

```bash
git status
git add -A
git commit -m "feat: merge portfolio, ledger, and a new centralized auth app into one Bun/Turborepo monorepo"
```

---

## Manual follow-up (outside this plan)

- **Vercel projects:** create/link three Vercel projects (`portfolio-v3` already exists — update its Root Directory from `.` to `apps/portfolio`; create new projects for `apps/auth` and `apps/ledger` with Root Directory set accordingly), each pointed at the same repo/branch.
- **DNS:** point `auth.hibatillah.com` at the new Vercel project (`ledger.hibatillah.com` and `hibatillah.com` already exist).
- **Neon project/database creation** (Phase 3 Step 8) and **D1→Neon data migration** (Phase 5 Step 10) are real, manual, data-affecting operations — do them carefully and verify row counts, not as a rushed side effect of running this plan.
- **`hibatillah/ledger` GitHub repo:** once `apps/ledger` is confirmed working here, decide whether to archive or delete the standalone `hibatillah/ledger` repo — not part of this plan, since it's a separate, reversible decision made after everything above is verified.
