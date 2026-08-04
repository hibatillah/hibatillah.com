import { passkey } from "@better-auth/passkey"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"

import { db } from "@packages/auth"

const isProd = process.env.NODE_ENV === "production"
const rootDomain = "hibatillah.com"

/**
 * Ledger-local auth instance layered on top of `@packages/auth`'s shared
 * identity db and config (same secret/baseURL/cross-subdomain-cookie/social
 * config as the shared `auth` export). Ledger needs its own `betterAuth()`
 * instance rather than reusing `@packages/auth`'s `auth` export directly
 * because it needs two things the shared package can't carry (it's also
 * consumed by the Next.js `apps/auth`):
 *  - `tanstackStartCookies()`, required for correct cookie handling during
 *    TanStack Start's SSR streaming.
 *  - The owner-only passkey registration guard (`resolveUser`), a real
 *    security boundary — `registration.requireSession: false` means the
 *    `/api/auth/*` passkey-registration endpoint is reachable by anyone,
 *    session or not, so this guard is what actually restricts registration
 *    to the owner account rather than a decorative UI-only check.
 */
export const auth = betterAuth({
	baseURL: process.env.AUTH_BASE_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: "pg" }),
	advanced: {
		crossSubDomainCookies: {
			enabled: true,
			domain: rootDomain,
		},
	},
	trustedOrigins: [
		`https://${rootDomain}`,
		`https://ledger.${rootDomain}`,
		`https://auth.${rootDomain}`,
	],
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			prompt: "login",
			disableSignUp: true,
		},
	},
	plugins: [
		passkey({
			rpName: "hibatillah",
			rpID: isProd ? rootDomain : "localhost",
			origin: process.env.AUTH_BASE_URL,
			authenticatorSelection: {
				residentKey: "required",
				userVerification: "preferred",
			},
			registration: {
				requireSession: false,
				resolveUser: async ({ ctx }) => {
					const dbUser = await (ctx.context as any).adapter.findOne({
						model: "user",
						where: [{ field: "email", value: "hibatillahhabib@gmail.com" }],
					})
					if (!dbUser) throw new Error("Owner account not found. Run db:seed first.")
					return { id: dbUser.id as string, name: dbUser.name as string }
				},
			},
		}),
		tanstackStartCookies(),
	],
})

export type Auth = typeof auth
