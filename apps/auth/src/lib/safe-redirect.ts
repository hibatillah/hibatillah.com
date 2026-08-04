const ALLOWED_HOSTS = ["hibatillah.com", "ledger.hibatillah.com", "auth.hibatillah.com"]

export function safeRedirect(target: string | null, fallback = "/"): string {
	if (!target) return fallback
	try {
		const url = new URL(target, "https://auth.hibatillah.com")
		if (url.protocol !== "https:" && url.hostname !== "localhost") return fallback
		if (!ALLOWED_HOSTS.includes(url.hostname)) return fallback
		return url.toString()
	} catch {
		return fallback
	}
}
