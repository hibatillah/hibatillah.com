import { describe, expect, it } from "vitest"

import serverEntry from "@/server"

// Nitro's dev/prod server looks for a default export shaped like
// `{ fetch }`, not a bare handler function — exporting the function
// directly produces "No fetch handler exported from server.ts" at runtime.
describe("server entry", () => {
	it("default-exports an object with a fetch handler", () => {
		expect(serverEntry).toHaveProperty("fetch")
		expect(typeof serverEntry.fetch).toBe("function")
	})
})
