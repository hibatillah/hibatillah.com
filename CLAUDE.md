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

## SSO / auth architecture

- One Neon project, two databases: `identity` (owned by `packages/auth`) and `ledger` (owned by `apps/ledger`).
- Better Auth's `crossSubDomainCookies` (domain: `hibatillah.com`) — no full OIDC. Any app under `*.hibatillah.com` can read the same session cookie directly.
- `apps/auth` is the only app that mounts Better Auth's HTTP API (`/api/auth/*`) and renders `/login` (+ an unlinked `/signup`, not yet exposed publicly since ledger stays single-user). Other apps (currently just `apps/ledger`) import `packages/auth`'s `betterAuth()` instance to call `auth.api.getSession()` locally against the shared cookie — no network hop to `apps/auth` needed for a session check, only for the actual login/OAuth/passkey flows.
- Unauthenticated requests to a protected app redirect to `https://auth.hibatillah.com/login?redirect=<url>`. The `redirect` param is validated against an allowlist of `*.hibatillah.com` origins before being honored (open-redirect protection) — see `apps/auth/src/lib/safe-redirect.ts`.

## Git workflow

Solo repo — never open pull requests. Feature branches merge straight into `master` locally (`git checkout master && git merge <branch> && git push`), then get deleted.
