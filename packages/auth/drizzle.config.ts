import { defineConfig } from "drizzle-kit"

export default defineConfig({
	schema: "./src/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.IDENTITY_DATABASE_URL!,
	},
})
