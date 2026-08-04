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
