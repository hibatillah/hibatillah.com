import { redirect } from "@tanstack/react-router"
import { createMiddleware } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"

import { auth } from "@/lib/auth"

import { getSessionFn } from "./auth"

/**
 * Server function middleware — throws a redirect to the centralized login
 * (apps/auth) if unauthenticated. Chain with `.middleware([authMiddleware])`
 * on any server function that requires auth.
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const request = getRequest()
	const session = await auth.api.getSession({ headers: request.headers })
	if (!session) {
		const returnTo = encodeURIComponent(request.url)
		throw redirect({ href: `https://auth.hibatillah.com/login?redirect=${returnTo}` })
	}
	return next()
})

/**
 * Route `beforeLoad` helper — throws a redirect to the centralized login
 * (apps/auth) if unauthenticated. `currentUrl` must come from the router's
 * isomorphic `location.href` (not `getRequest()`), since this runs in the
 * client bundle too — a direct server-only import here would break the
 * client build.
 * @example
 * beforeLoad: ({ location }) => requireAuth(location.href)
 */
export async function requireAuth(currentUrl: string) {
	const session = await getSessionFn()
	if (!session) {
		const returnTo = encodeURIComponent(currentUrl)
		throw redirect({ href: `https://auth.hibatillah.com/login?redirect=${returnTo}` })
	}
}
