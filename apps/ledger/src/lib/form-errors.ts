/** TanStack Form + Zod / Standard Schema issues are often objects with `message`. */
export function formatValidatorIssue(err: unknown): string {
	if (typeof err === "string") return err
	if (err !== null && typeof err === "object") {
		const msg = (err as { message?: unknown }).message
		if (typeof msg === "string" && msg.length > 0) return msg
	}
	return "Invalid value"
}
