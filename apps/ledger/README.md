# Ledger

Personal expense tracker that ingests CSV exports and visualizes spending patterns through a dashboard. Single-user app deployed on Cloudflare Workers with D1 (SQLite).

**Features:** year-scoped dashboard with 8+ charts, server-side paginated expense data sheet with filtering and sorting, tag management, CSV import with conflict detection, passkey + Google OAuth.

## Setup

```bash
npm install
```

Create a `.dev.vars` file in the project root with your local secrets (used by Wrangler/Miniflare — equivalent to `.env` for Cloudflare Workers):

```bash
BASE_URL=http://localhost:3000
BETTER_AUTH_SECRET=<any-random-string>
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
```

## Development

```bash
npm run dev
```

The dev server runs at `http://localhost:3000`. Server-side code runs inside Miniflare (Cloudflare Workers emulation) via `@cloudflare/vite-plugin`, so **the local D1 database is used — not `dev.db`**.

> **Note:** Never use `drizzle-kit migrate` — it targets `dev.db` which is unused. Always use `wrangler d1 execute` for both local and production.

### Applying migrations locally

| Create `.dev.vars` file that store secrets to use for wrangler commands.

After cloning or after any schema change, apply all pending migrations to the local D1:

```bash
npx wrangler d1 execute ledger --local --file=./drizzle/0000_brave_lightspeed.sql
npx wrangler d1 execute ledger --local --file=./drizzle/0001_fresh_next_avengers.sql
npx wrangler d1 execute ledger --local --file=./drizzle/0002_even_speedball.sql
npx wrangler d1 execute ledger --local --file=./drizzle/0003_clean_vance_astro.sql
npx wrangler d1 execute ledger --local --file=./drizzle/0004_tags_registry.sql
```

### Seed the local database

After applying migrations, seed the owner user row — **required before passkey registration will work**:

```bash
npm run db:seed
```

This inserts the owner account into the local D1. Without it, passkey registration fails with `"Owner account not found"`. Safe to re-run (uses `INSERT OR IGNORE`).

### Schema changes

1. Edit `src/lib/db/schema.ts`
2. Generate a new migration:
   ```bash
   npm run db:generate
   ```
3. Apply it locally:
   ```bash
   npx wrangler d1 execute ledger --local --file=./drizzle/<new-migration>.sql
   ```
4. Apply it to production:
   ```bash
   npx wrangler d1 execute ledger --remote --file=./drizzle/<new-migration>.sql
   ```

## Production deployment

### First-time D1 setup

Apply all migrations to the production D1 database:

```bash
npx wrangler d1 execute ledger --remote --file=./drizzle/0000_brave_lightspeed.sql
npx wrangler d1 execute ledger --remote --file=./drizzle/0001_fresh_next_avengers.sql
npx wrangler d1 execute ledger --remote --file=./drizzle/0002_even_speedball.sql
npx wrangler d1 execute ledger --remote --file=./drizzle/0003_clean_vance_astro.sql
npx wrangler d1 execute ledger --remote --file=./drizzle/0004_tags_registry.sql
```

### Deploy

```bash
npm run deploy
```

### GitHub Actions

| Workflow              | Trigger                                       | What it does                                                 |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `preview-deploy.yml`  | PR opened/pushed, or manual (enter PR number) | Deploys `ledger-pr-{n}.workers.dev`, posts URL as PR comment |
| `preview-cleanup.yml` | PR closed or merged                           | Deletes the preview worker                                   |
| `deploy.yml`          | Manual only                                   | Deploys to production (`ledger` worker)                      |

Required repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Testing

```bash
npm run test        # vitest run
```

Integration tests live in `src/test/` and run against an in-memory `better-sqlite3` database (no Cloudflare runtime needed). `vitest.config.ts` is a separate config that omits `@cloudflare/vite-plugin`.

## Other commands

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier
```
