import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"

import * as schema from "./schema"

function createDb() {
	return drizzle({ client: neon(process.env.IDENTITY_DATABASE_URL!), schema })
}

type Db = ReturnType<typeof createDb>

let _db: Db | undefined

/**
 * Constructing `neon()` eagerly at module scope throws when
 * IDENTITY_DATABASE_URL is unset — which crashes Next.js's build-time page
 * data collection even for routes that never touch the database at build
 * time. Defer construction until the first real property access instead.
 */
export const db: Db = new Proxy({} as Db, {
	get(_, prop) {
		if (!_db) _db = createDb()
		return (_db as unknown as Record<string | symbol, unknown>)[prop]
	},
})
