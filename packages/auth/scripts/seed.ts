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
