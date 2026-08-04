import { passkey } from "@better-auth/passkey"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { db } from "./db"

const isProd = process.env.NODE_ENV === "production"
const rootDomain = "hibatillah.com"

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
		}),
	],
})

export type Auth = typeof auth
