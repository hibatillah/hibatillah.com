import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"

import * as schema from "./schema"

function createDb() {
	return drizzle({ client: neon(process.env.LEDGER_DATABASE_URL!), schema })
}

type Db = ReturnType<typeof createDb>

let _db: Db | undefined

/**
 * Constructing `neon()` eagerly at module scope throws when
 * LEDGER_DATABASE_URL is unset — which crashes build-time bundling for any
 * route that transitively imports this module, even ones that never touch
 * the database. Defer construction until the first real property access.
 */
export const db: Db = new Proxy({} as Db, {
	get(_, prop) {
		if (!_db) _db = createDb()
		return (_db as unknown as Record<string | symbol, unknown>)[prop]
	},
})
