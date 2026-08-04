import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/lib/db"
import { settings } from "@/lib/db/schema"

import { authMiddleware } from "./middleware"

export const getSettingsFn = createServerFn({ method: "GET" }).handler(async () => {
	const row = await db.query.settings.findFirst({
		where: eq(settings.key, "googleAuthEnabled"),
	})

	return { googleAuthEnabled: row?.value === "true" }
})

export const updateSettingsFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(z.object({ googleAuthEnabled: z.boolean() }))
	.handler(async ({ data }) => {
		await db
			.insert(settings)
			.values({
				key: "googleAuthEnabled",
				value: String(data.googleAuthEnabled),
			})
			.onConflictDoUpdate({
				target: settings.key,
				set: { value: String(data.googleAuthEnabled) },
			})

		return { success: true }
	})
