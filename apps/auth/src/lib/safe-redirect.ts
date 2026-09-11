const isProd = process.env.NODE_ENV === "production"
const ALLOWED_HOSTS = isProd
	? ["hibatillah.com", "ledger.hibatillah.com", "auth.hibatillah.com"]
	: ["hibatillah.test", "ledger.hibatillah.test", "auth.hibatillah.test"]

export function safeRedirect(target: string | null, fallback = "/"): string {
	if (!target) return fallback
	try {
		const url = new URL(
			target,
			process.env.NEXT_PUBLIC_AUTH_BASE_URL ?? "https://auth.hibatillah.com",
		)
		if (url.protocol !== "https:") return fallback
		if (!ALLOWED_HOSTS.includes(url.hostname)) return fallback
		return url.toString()
	} catch {
		return fallback
	}
}
