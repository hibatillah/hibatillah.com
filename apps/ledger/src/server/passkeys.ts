import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"

import { auth } from "@/lib/auth"
import { toMs } from "@/lib/utils"

import { authMiddleware } from "./middleware"

export const getPasskeysFn = createServerFn()
	.middleware([authMiddleware])
	.handler(async () => {
		const request = getRequest()
		const passkeys = await auth.api.listPasskeys({
			headers: request.headers,
		})
		return (passkeys ?? []).sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt))
	})
