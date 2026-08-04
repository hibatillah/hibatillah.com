import { beforeEach, describe, expect, it, vi } from "vitest"

import { getPasskeysFn } from "@/server/passkeys"

const listPasskeysMock = vi.hoisted(() => vi.fn<() => Promise<unknown>>())

vi.mock("@/lib/auth", () => ({
	auth: {
		api: { listPasskeys: listPasskeysMock },
	},
}))

vi.mock("@tanstack/react-start/server", () => ({
	getRequest: () => ({ headers: new Headers() }),
}))

beforeEach(() => {
	listPasskeysMock.mockResolvedValue([
		{ id: "2", name: "iPhone", createdAt: new Date("2024-06-01") },
		{ id: "1", name: "MacBook", createdAt: new Date("2024-01-01") },
	])
})

describe("getPasskeysFn", () => {
	it("returns passkeys sorted by createdAt ascending", async () => {
		const result = await getPasskeysFn()

		expect(result[0]?.name).toBe("MacBook")
		expect(result[1]?.name).toBe("iPhone")
	})

	it("returns empty array when listPasskeys resolves to null", async () => {
		listPasskeysMock.mockResolvedValueOnce(null)

		const result = await getPasskeysFn()

		expect(result).toEqual([])
	})
})
