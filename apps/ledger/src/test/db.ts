import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"

import * as schema from "@/lib/db/schema"

const DDL = `
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    tag TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tags (
    name TEXT PRIMARY KEY,
    color TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`

/**
 * In-memory Postgres (pglite) stand-in for `@/lib/db`'s real Neon connection,
 * for tests. There's no more `setDb()`/singleton to swap the real `db` export
 * at runtime — `@/lib/db` is now a plain module-level export (see
 * `src/lib/db/index.ts`) — so callers must `vi.mock("@/lib/db", ...)` and
 * route it through `testDbHolder.current`, set in `beforeEach`.
 */
export const testDbHolder: { current: ReturnType<typeof drizzle> | null } = {
	current: null,
}

export async function createTestDb() {
	const client = new PGlite()
	await client.exec(DDL)

	const db = drizzle(client, { schema })
	testDbHolder.current = db

	return { db, client }
}
