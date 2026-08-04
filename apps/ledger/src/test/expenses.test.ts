import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { expenses, tags } from "@/lib/db/schema"
import {
	checkConflictingDatesFn,
	deleteExpenseFn,
	deleteTagFn,
	getExpensesPaginatedFn,
	importExpensesFn,
	renameOrMergeTagFn,
	updateExpenseFn,
} from "@/server/expenses"

import { createTestDb, testDbHolder } from "./db"

// `@/lib/db`'s `db` export is a plain module-level Neon connection (no more
// swappable singleton), so route it through the in-memory sqlite test db.
vi.mock("@/lib/db", () => ({
	get db() {
		return testDbHolder.current
	},
}))

const NOW = "2024-01-01T00:00:00.000Z"

type PaginatedInput = Parameters<typeof getExpensesPaginatedFn>[0]

function paginatedInput(overrides: Partial<PaginatedInput["data"]> = {}): PaginatedInput {
	return {
		data: {
			page: 0,
			pageSize: 20,
			sortField: "date",
			sortDir: "desc",
			tagValues: [],
			tagExclude: false,
			dateValues: [],
			dateOperator: "is between",
			amountValues: [],
			amountOperator: "is between",
			...overrides,
		},
	}
}

let db: Awaited<ReturnType<typeof createTestDb>>["db"]

beforeEach(async () => {
	db = (await createTestDb()).db
})

// ---------------------------------------------------------------------------
// getExpensesPaginatedFn
// ---------------------------------------------------------------------------

describe("getExpensesPaginatedFn", () => {
	it("returns all rows with no filters; total matches row count", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW },
			{ date: "2024-01-16", amount: 20000, tag: "transport", createdAt: NOW },
			{ date: "2024-01-17", amount: 5000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(paginatedInput())

		expect(result.total).toBe(3)
		expect(result.rows).toHaveLength(3)
	})

	it("paginates correctly across pages", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-11", amount: 1000, tag: "food", createdAt: NOW },
			{ date: "2024-01-12", amount: 2000, tag: "food", createdAt: NOW },
			{ date: "2024-01-13", amount: 3000, tag: "food", createdAt: NOW },
		])

		const page0 = await getExpensesPaginatedFn(paginatedInput({ page: 0, pageSize: 2 }))
		const page1 = await getExpensesPaginatedFn(paginatedInput({ page: 1, pageSize: 2 }))

		expect(page0.total).toBe(3)
		expect(page0.rows).toHaveLength(2)
		expect(page1.total).toBe(3)
		expect(page1.rows).toHaveLength(1)
	})

	it("filters by tagValues", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW },
			{ date: "2024-01-15", amount: 5000, tag: "transport", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(paginatedInput({ tagValues: ["food"] }))

		expect(result.total).toBe(1)
		expect(result.rows[0]?.tag).toBe("food")
	})

	it("excludes tags when tagExclude is true", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW },
			{ date: "2024-01-15", amount: 5000, tag: "transport", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({ tagValues: ["food"], tagExclude: true }),
		)

		expect(result.total).toBe(1)
		expect(result.rows[0]?.tag).toBe("transport")
	})

	it("filters by date 'is'", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW },
			{ date: "2024-01-16", amount: 5000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({ dateValues: ["2024-01-15"], dateOperator: "is" }),
		)

		expect(result.total).toBe(1)
		expect(result.rows[0]?.date).toBe("2024-01-15")
	})

	it("filters by date 'is between' (inclusive)", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-10", amount: 1000, tag: "food", createdAt: NOW },
			{ date: "2024-01-15", amount: 2000, tag: "food", createdAt: NOW },
			{ date: "2024-01-20", amount: 3000, tag: "food", createdAt: NOW },
			{ date: "2024-01-25", amount: 4000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({
				dateValues: ["2024-01-15", "2024-01-20"],
				dateOperator: "is between",
			}),
		)

		expect(result.total).toBe(2)
	})

	it("filters by date 'is on or after'", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-10", amount: 1000, tag: "food", createdAt: NOW },
			{ date: "2024-01-20", amount: 2000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({
				dateValues: ["2024-01-15"],
				dateOperator: "is on or after",
			}),
		)

		expect(result.total).toBe(1)
		expect(result.rows[0]?.date).toBe("2024-01-20")
	})

	it("filters by date 'is before'", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-10", amount: 1000, tag: "food", createdAt: NOW },
			{ date: "2024-01-20", amount: 2000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({
				dateValues: ["2024-01-15"],
				dateOperator: "is before",
			}),
		)

		expect(result.total).toBe(1)
		expect(result.rows[0]?.date).toBe("2024-01-10")
	})

	it("filters by amount 'is'", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW },
			{ date: "2024-01-16", amount: 20000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({ amountValues: [10000], amountOperator: "is" }),
		)

		expect(result.total).toBe(1)
		expect(result.rows[0]?.amount).toBe(10000)
	})

	it("filters by amount 'is between'", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 5000, tag: "food", createdAt: NOW },
			{ date: "2024-01-15", amount: 15000, tag: "food", createdAt: NOW },
			{ date: "2024-01-15", amount: 25000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({
				amountValues: [10000, 20000],
				amountOperator: "is between",
			}),
		)

		expect(result.total).toBe(1)
		expect(result.rows[0]?.amount).toBe(15000)
	})

	it("filters by amount 'is greater than'", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 5000, tag: "food", createdAt: NOW },
			{ date: "2024-01-15", amount: 15000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({
				amountValues: [5000],
				amountOperator: "is greater than",
			}),
		)

		expect(result.total).toBe(1)
		expect(result.rows[0]?.amount).toBe(15000)
	})

	it("filters by amount 'is less than'", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 5000, tag: "food", createdAt: NOW },
			{ date: "2024-01-15", amount: 15000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({
				amountValues: [15000],
				amountOperator: "is less than",
			}),
		)

		expect(result.total).toBe(1)
		expect(result.rows[0]?.amount).toBe(5000)
	})

	it("sorts by date asc", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-20", amount: 1000, tag: "food", createdAt: NOW },
			{ date: "2024-01-10", amount: 2000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({ sortField: "date", sortDir: "asc" }),
		)

		expect(result.rows[0]?.date).toBe("2024-01-10")
		expect(result.rows[1]?.date).toBe("2024-01-20")
	})

	it("sorts by date desc", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-10", amount: 1000, tag: "food", createdAt: NOW },
			{ date: "2024-01-20", amount: 2000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({ sortField: "date", sortDir: "desc" }),
		)

		expect(result.rows[0]?.date).toBe("2024-01-20")
	})

	it("sorts by amount asc", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 30000, tag: "food", createdAt: NOW },
			{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW },
		])

		const result = await getExpensesPaginatedFn(
			paginatedInput({ sortField: "amount", sortDir: "asc" }),
		)

		expect(result.rows[0]?.amount).toBe(10000)
		expect(result.rows[1]?.amount).toBe(30000)
	})
})

// ---------------------------------------------------------------------------
// checkConflictingDatesFn
// ---------------------------------------------------------------------------

describe("checkConflictingDatesFn", () => {
	it("returns empty array when DB is empty", async () => {
		const result = await checkConflictingDatesFn({
			data: { dates: ["2024-01-15"] },
		})
		expect(result).toEqual([])
	})

	it("returns conflicting days when overlap exists", async () => {
		await db
			.insert(expenses)
			.values([{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW }])

		const result = await checkConflictingDatesFn({
			data: { dates: ["2024-01-15", "2024-01-16"] },
		})

		expect(result).toEqual(["2024-01-15"])
	})

	it("returns empty array when no input dates match DB", async () => {
		await db
			.insert(expenses)
			.values([{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW }])

		const result = await checkConflictingDatesFn({
			data: { dates: ["2024-02-01"] },
		})

		expect(result).toEqual([])
	})
})

// ---------------------------------------------------------------------------
// importExpensesFn
// ---------------------------------------------------------------------------

describe("importExpensesFn", () => {
	it("appends rows without touching existing rows", async () => {
		await db
			.insert(expenses)
			.values([{ date: "2024-01-10", amount: 5000, tag: "existing", createdAt: NOW }])

		await importExpensesFn({
			data: {
				rows: [{ date: "2024-01-20", amount: 10000, tag: "food" }],
			},
		})

		const all = await db.select().from(expenses)

		expect(all).toHaveLength(2)
		expect(all.some((r) => r.tag === "existing")).toBe(true)
		expect(all.some((r) => r.tag === "food")).toBe(true)
	})

	it("overrides rows on specified dates", async () => {
		await db
			.insert(expenses)
			.values([{ date: "2024-01-15", amount: 5000, tag: "old", createdAt: NOW }])

		await importExpensesFn({
			data: {
				rows: [{ date: "2024-01-15", amount: 20000, tag: "new" }],
				overrideDates: ["2024-01-15"],
			},
		})

		const all = await db.select().from(expenses)

		expect(all).toHaveLength(1)
		expect(all[0]?.tag).toBe("new")
		expect(all[0]?.amount).toBe(20000)
	})

	it("auto-inserts tags into the registry", async () => {
		await importExpensesFn({
			data: {
				rows: [
					{ date: "2024-01-15", amount: 10000, tag: "food" },
					{ date: "2024-01-15", amount: 5000, tag: "transport" },
				],
			},
		})

		const allTags = await db.select().from(tags)
		const names = allTags.map((t) => t.name)

		expect(names).toContain("food")
		expect(names).toContain("transport")
	})

	it("does not duplicate tags on re-import", async () => {
		await db.insert(tags).values([{ name: "food", color: "red", createdAt: NOW }])

		await importExpensesFn({
			data: {
				rows: [{ date: "2024-01-15", amount: 10000, tag: "food" }],
			},
		})

		const foodTags = await db.select().from(tags).where(eq(tags.name, "food"))
		expect(foodTags).toHaveLength(1)
	})

	it("returns inserted count", async () => {
		const result = await importExpensesFn({
			data: {
				rows: [
					{ date: "2024-01-15", amount: 10000, tag: "food" },
					{ date: "2024-01-16", amount: 5000, tag: "food" },
				],
			},
		})

		expect(result).toEqual({ inserted: 2 })
	})
})

// ---------------------------------------------------------------------------
// updateExpenseFn
// ---------------------------------------------------------------------------

describe("updateExpenseFn", () => {
	it("updates date, amount, and tag for the given id", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW },
			{ date: "2024-01-16", amount: 20000, tag: "transport", createdAt: NOW },
		])

		const [target] = await db
			.select({ id: expenses.id })
			.from(expenses)
			.where(eq(expenses.tag, "food"))

		await updateExpenseFn({
			data: {
				id: target!.id,
				date: "2024-02-01",
				amount: 99000,
				tag: "shopping",
			},
		})

		const updated = await db.select().from(expenses).where(eq(expenses.id, target!.id))

		expect(updated[0]?.date).toBe("2024-02-01")
		expect(updated[0]?.amount).toBe(99000)
		expect(updated[0]?.tag).toBe("shopping")
	})

	it("does not affect other rows", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW },
			{ date: "2024-01-16", amount: 20000, tag: "transport", createdAt: NOW },
		])
		const [target] = await db
			.select({ id: expenses.id })
			.from(expenses)
			.where(eq(expenses.tag, "food"))

		await updateExpenseFn({
			data: {
				id: target!.id,
				date: "2024-02-01",
				amount: 99000,
				tag: "shopping",
			},
		})

		const other = await db.select().from(expenses).where(eq(expenses.tag, "transport"))

		expect(other).toHaveLength(1)
		expect(other[0]?.amount).toBe(20000)
	})
})

// ---------------------------------------------------------------------------
// deleteExpenseFn
// ---------------------------------------------------------------------------

describe("deleteExpenseFn", () => {
	it("deletes the target row", async () => {
		await db
			.insert(expenses)
			.values([{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW }])
		const [target] = await db.select({ id: expenses.id }).from(expenses)

		await deleteExpenseFn({ data: { id: target!.id } })

		const all = await db.select().from(expenses)
		expect(all).toHaveLength(0)
	})

	it("does not affect other rows", async () => {
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW },
			{ date: "2024-01-16", amount: 20000, tag: "transport", createdAt: NOW },
		])
		const [target] = await db
			.select({ id: expenses.id })
			.from(expenses)
			.where(eq(expenses.tag, "food"))

		await deleteExpenseFn({ data: { id: target!.id } })
		const remaining = await db.select().from(expenses)

		expect(remaining).toHaveLength(1)
		expect(remaining[0]?.tag).toBe("transport")
	})
})

// ---------------------------------------------------------------------------
// deleteTagFn
// ---------------------------------------------------------------------------

describe("deleteTagFn", () => {
	it("throws TAG_IN_USE when expenses reference the tag", async () => {
		await db.insert(tags).values([{ name: "food", color: "red", createdAt: NOW }])
		await db
			.insert(expenses)
			.values([{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW }])

		await expect(deleteTagFn({ data: { name: "food" } })).rejects.toThrow("TAG_IN_USE")
	})

	it("deletes tag when no expenses reference it", async () => {
		await db.insert(tags).values([{ name: "food", color: "red", createdAt: NOW }])

		await deleteTagFn({ data: { name: "food" } })
		const remaining = await db.select().from(tags)

		expect(remaining).toHaveLength(0)
	})
})

// ---------------------------------------------------------------------------
// renameOrMergeTagFn
// ---------------------------------------------------------------------------

describe("renameOrMergeTagFn", () => {
	it("renames tag when target does not exist", async () => {
		await db.insert(tags).values([{ name: "food", color: "oklch(0.72 0.17 145)", createdAt: NOW }])
		await db
			.insert(expenses)
			.values([{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW }])

		await renameOrMergeTagFn({ data: { from: "food", to: "dining" } })

		const allTags = await db.select().from(tags)
		const names = allTags.map((t) => t.name)

		expect(names).not.toContain("food")
		expect(names).toContain("dining")

		const movedExpenses = await db.select().from(expenses).where(eq(expenses.tag, "dining"))

		expect(movedExpenses).toHaveLength(1)
	})

	it("inherits source color on rename", async () => {
		const sourceColor = "oklch(0.72 0.17 145)"
		await db.insert(tags).values([{ name: "food", color: sourceColor, createdAt: NOW }])

		await renameOrMergeTagFn({ data: { from: "food", to: "dining" } })

		const [dining] = await db.select().from(tags).where(eq(tags.name, "dining"))
		expect(dining?.color).toBe(sourceColor)
	})

	it("merges expenses into existing target tag", async () => {
		await db.insert(tags).values([
			{ name: "food", color: "red", createdAt: NOW },
			{ name: "dining", color: "blue", createdAt: NOW },
		])
		await db.insert(expenses).values([
			{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW },
			{ date: "2024-01-16", amount: 5000, tag: "dining", createdAt: NOW },
		])

		await renameOrMergeTagFn({ data: { from: "food", to: "dining" } })

		const allTags = await db.select().from(tags)
		expect(allTags.map((t) => t.name)).not.toContain("food")

		const diningExpenses = await db.select().from(expenses).where(eq(expenses.tag, "dining"))

		expect(diningExpenses).toHaveLength(2)
	})

	it("target keeps its original color on merge", async () => {
		await db.insert(tags).values([
			{ name: "food", color: "red", createdAt: NOW },
			{ name: "dining", color: "blue", createdAt: NOW },
		])

		await renameOrMergeTagFn({ data: { from: "food", to: "dining" } })

		const [dining] = await db.select().from(tags).where(eq(tags.name, "dining"))
		expect(dining?.color).toBe("blue")
	})

	it("is a no-op when from equals to", async () => {
		await db.insert(tags).values([{ name: "food", color: "red", createdAt: NOW }])
		await db
			.insert(expenses)
			.values([{ date: "2024-01-15", amount: 10000, tag: "food", createdAt: NOW }])

		await renameOrMergeTagFn({ data: { from: "food", to: "food" } })

		const allTags = await db.select().from(tags)
		expect(allTags).toHaveLength(1)

		const allExpenses = await db.select().from(expenses)
		expect(allExpenses[0]?.tag).toBe("food")
	})
})
