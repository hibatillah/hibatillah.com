import { vi } from "vitest"

const builder = () => {
	const self: any = {
		middleware: () => self,
		inputValidator: () => self,
		server: () => self,
		handler: (fn: any) => fn,
	}
	return self
}

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => builder(),
	createMiddleware: () => builder(),
}))

vi.mock("@/server/middleware", () => ({
	authMiddleware: {},
}))
