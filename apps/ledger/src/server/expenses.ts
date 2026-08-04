import { createServerFn } from "@tanstack/react-start"
import {
	and,
	asc,
	count,
	desc,
	eq,
	gt,
	gte,
	inArray,
	like,
	lt,
	lte,
	notInArray,
	or,
	sql,
} from "drizzle-orm"
import { z } from "zod"

import { db } from "@/lib/db"
import { expenses, tags } from "@/lib/db/schema"
import { pickColor } from "@/lib/tag-colors"

import { authMiddleware } from "./middleware"

/** Inserts registry rows for any expense tags not yet in `tags`. */
async function ensureExpenseTagsInRegistry() {
	const allExpenses = await db.select({ tag: expenses.tag }).from(expenses)
	const uniqueTags = [...new Set(allExpenses.map((e) => e.tag))]
	if (uniqueTags.length === 0) return

	const existing = await db.select({ name: tags.name }).from(tags)
	const have = new Set(existing.map((r) => r.name))
	const missing = uniqueTags.filter((t) => !have.has(t))

	if (missing.length === 0) return

	const now = new Date().toISOString()
	const newEntries = missing.map((name) => ({
		name,
		color: pickColor(),
		createdAt: now,
	}))
	const CHUNK = 20

	for (let i = 0; i < newEntries.length; i += CHUNK) {
		await db
			.insert(tags)
			.values(newEntries.slice(i, i + CHUNK))
			.onConflictDoNothing()
	}
}

export const getExpensesByYearFn = createServerFn()
	.middleware([authMiddleware])
	.inputValidator(z.number())
	.handler(async ({ data: year }) => {
		return db
			.select()
			.from(expenses)
			.where(or(like(expenses.date, `${year}-%`), like(expenses.date, `${year - 1}-%`)))
			.orderBy(desc(expenses.date))
	})

function buildDateCondition(values: string[], op: string) {
	if (!values.length) return undefined

	switch (op) {
		case "is":
			return eq(expenses.date, values[0])
		case "is between":
			return and(gte(expenses.date, values[0]), lte(expenses.date, values[1]))
		case "is on or after":
		case "is after":
			return gte(expenses.date, values[0])
		case "is on or before":
		case "is before":
			return lte(expenses.date, values[0])
		default:
			return undefined
	}
}

function buildAmountCondition(values: number[], op: string) {
	if (!values.length) return undefined

	switch (op) {
		case "is between":
			return and(gte(expenses.amount, values[0]), lte(expenses.amount, values[1]))
		case "is greater than or equal to":
			return gte(expenses.amount, values[0])
		case "is less than or equal to":
			return lte(expenses.amount, values[0])
		case "is greater than":
			return gt(expenses.amount, values[0])
		case "is less than":
			return lt(expenses.amount, values[0])
		case "is":
			return eq(expenses.amount, values[0])
		default:
			return undefined
	}
}

const paginatedInputSchema = z.object({
	page: z.number().int().min(0),
	pageSize: z.number().int().min(1).max(100),
	sortField: z.enum(["date", "amount", "createdAt"]).default("date"),
	sortDir: z.enum(["asc", "desc"]).default("desc"),
	tagValues: z.array(z.string()).default([]),
	tagExclude: z.boolean().default(false),
	dateValues: z.array(z.string()).default([]),
	dateOperator: z.string().default("is between"),
	amountValues: z.array(z.number()).default([]),
	amountOperator: z.string().default("is between"),
})

export const getExpensesPaginatedFn = createServerFn()
	.middleware([authMiddleware])
	.inputValidator(paginatedInputSchema)
	.handler(async ({ data }) => {
		const {
			page,
			pageSize,
			sortField,
			sortDir,
			tagValues,
			tagExclude,
			dateValues,
			dateOperator,
			amountValues,
			amountOperator,
		} = data

		const tagCond = tagValues.length
			? tagExclude
				? notInArray(expenses.tag, tagValues)
				: inArray(expenses.tag, tagValues)
			: undefined

		const dateCond = buildDateCondition(dateValues, dateOperator)
		const amtCond = buildAmountCondition(amountValues, amountOperator)
		const where = and(tagCond, dateCond, amtCond)

		const [countRow] = await db.select({ total: count() }).from(expenses).where(where)

		const sortCol = {
			date: expenses.date,
			amount: expenses.amount,
			createdAt: expenses.createdAt,
		}[sortField]

		const rows = await db
			.select()
			.from(expenses)
			.where(where)
			.orderBy(sortDir === "asc" ? asc(sortCol) : desc(sortCol))
			.limit(pageSize)
			.offset(page * pageSize)

		return { rows, total: countRow.total }
	})

export const updateExpenseFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(
		z.object({
			id: z.number().int().positive(),
			date: z.string().min(1),
			amount: z.number().int().positive(),
			tag: z.string().min(1),
		}),
	)
	.handler(async ({ data }) => {
		await ensureExpenseTagsInRegistry()
		await db
			.update(expenses)
			.set({
				date: data.date,
				amount: data.amount,
				tag: data.tag,
			})
			.where(eq(expenses.id, data.id))
	})

export const deleteExpenseFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(z.object({ id: z.number().int().positive() }))
	.handler(async ({ data }) => {
		await db.delete(expenses).where(eq(expenses.id, data.id))
	})

export const deleteAllExpensesFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.handler(async () => {
		await db.delete(expenses)
		await db.delete(tags)
	})

export const getTagColorsFn = createServerFn()
	.middleware([authMiddleware])
	.handler(async () => {
		await ensureExpenseTagsInRegistry()
		const rows = await db.select().from(tags)

		return Object.fromEntries(rows.map((r) => [r.name, r.color])) as Record<string, string>
	})

export type TagWithStats = {
	name: string
	color: string
	createdAt: string
	expenseCount: number
}

export const getTagsWithStatsFn = createServerFn()
	.middleware([authMiddleware])
	.handler(async () => {
		await ensureExpenseTagsInRegistry()

		const rows = await db
			.select({
				name: tags.name,
				color: tags.color,
				createdAt: tags.createdAt,
				expenseCount: count(expenses.id),
			})
			.from(tags)
			.leftJoin(expenses, eq(expenses.tag, tags.name))
			.groupBy(tags.name, tags.color, tags.createdAt)
			.orderBy(tags.name)

		return rows.map((r) => ({
			...r,
			expenseCount: Number(r.expenseCount),
		})) as TagWithStats[]
	})

export const updateTagColorFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(z.object({ tag: z.string(), color: z.string() }))
	.handler(async ({ data }) => {
		const now = new Date().toISOString()
		await db
			.insert(tags)
			.values({ name: data.tag, color: data.color, createdAt: now })
			.onConflictDoUpdate({ target: tags.name, set: { color: data.color } })
	})

const renameOrMergeInput = z.object({
	from: z.string().min(1),
	to: z.string().min(1),
})

export const renameOrMergeTagFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(renameOrMergeInput)
	.handler(async ({ data }) => {
		const { from, to } = data
		if (from === to) return

		// D1 doesn't support BEGIN transactions; run steps in safe order:
		// 1. Ensure target tag exists  2. Migrate expenses  3. Remove source tag
		const [fromRow] = await db.select().from(tags).where(eq(tags.name, from)).limit(1)

		const [toRow] = await db.select().from(tags).where(eq(tags.name, to)).limit(1)

		if (!toRow) {
			await db.insert(tags).values({
				name: to,
				color: fromRow?.color ?? pickColor(),
				createdAt: fromRow?.createdAt ?? new Date().toISOString(),
			})
		}

		await db.update(expenses).set({ tag: to }).where(eq(expenses.tag, from))
		await db.delete(tags).where(eq(tags.name, from))
	})

export const deleteTagFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(z.object({ name: z.string().min(1) }))
	.handler(async ({ data }) => {
		const [{ count }] = await db
			.select({ count: sql<number>`count(*)`.mapWith(Number) })
			.from(expenses)
			.where(eq(expenses.tag, data.name))

		if (count > 0) {
			throw new Error("TAG_IN_USE")
		}

		await db.delete(tags).where(eq(tags.name, data.name))
	})

export const checkConflictingDatesFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(z.object({ dates: z.array(z.string()) }))
	.handler(async ({ data }) => {
		if (data.dates.length === 0) return []

		const inputDays = [...new Set(data.dates.map((d) => d.slice(0, 10)))]
		const allRows = await db
			.selectDistinct({ day: sql<string>`substr(${expenses.date}, 1, 10)` })
			.from(expenses)
		const existingDays = new Set(allRows.map((r) => r.day))

		return inputDays.filter((d) => existingDays.has(d))
	})

export const importExpensesFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(
		z.object({
			rows: z.array(
				z.object({
					date: z.string(),
					amount: z.number().int().positive(),
					tag: z.string().min(1),
				}),
			),
			overrideDates: z.array(z.string()).optional(),
		}),
	)
	.handler(async ({ data }) => {
		const { rows: data_rows, overrideDates } = data
		if (data_rows.length === 0) return { inserted: 0 }

		const CHUNK = 20

		if (overrideDates && overrideDates.length > 0) {
			const DCHUNK = 50
			for (let i = 0; i < overrideDates.length; i += DCHUNK) {
				const chunk = overrideDates.slice(i, i + DCHUNK)
				await db.delete(expenses).where(or(...chunk.map((d) => like(expenses.date, `${d}%`))))
			}
		}

		const now = new Date().toISOString()
		const rows = data_rows.map((row) => ({ ...row, createdAt: now }))

		try {
			for (let i = 0; i < rows.length; i += CHUNK) {
				await db.insert(expenses).values(rows.slice(i, i + CHUNK))
			}

			const uniqueTags = [...new Set(data_rows.map((r) => r.tag))]
			const colorEntries = uniqueTags.map((name) => ({
				name,
				color: pickColor(),
				createdAt: now,
			}))

			for (let i = 0; i < colorEntries.length; i += CHUNK) {
				await db
					.insert(tags)
					.values(colorEntries.slice(i, i + CHUNK))
					.onConflictDoNothing()
			}

			return { inserted: data_rows.length }
		} catch (err) {
			console.error("Import expenses failed:", err)
			throw err
		}
	})
