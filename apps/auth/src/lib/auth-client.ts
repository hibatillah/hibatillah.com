import { createAuthClient } from "better-auth/react"
import { passkeyClient } from "@better-auth/passkey/client"

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL,
	plugins: [passkeyClient()],
})
