import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"

import { formatIDR } from "@/lib/utils"

/** Recharts tooltip props vary by chart; keep loose for compatibility. */
export type TooltipEntry = {
	active?: boolean
	payload?: unknown
	label?: string | number
}

export type CustomTooltipProps = TooltipEntry & {
	/** Sum of series below date (e.g. stacked bar daily total); shows "Total 0" when empty/zero. */
	showFooterTotal?: boolean
	/** Hide the colored indicator box next to each row (use for single-series charts). */
	hideIndicator?: boolean
}

function formatLabel(raw?: string | number): string {
	const s = raw === undefined || raw === null ? "" : String(raw)
	if (!s) return ""

	try {
		return format(parseISO(s), "PPP", { locale: id })
	} catch {
		return s
	}
}

function payloadTotal(payload: unknown): number {
	if (!Array.isArray(payload)) return 0

	return payload.reduce((sum, p) => {
		if (typeof p !== "object" || p === null) return sum

		const v = (p as { value?: unknown }).value
		const n = typeof v === "number" ? v : Number(v)

		return sum + (Number.isFinite(n) ? n : 0)
	}, 0)
}

function firstRowLabel(payload: unknown, label: string | number | undefined): string {
	if (!Array.isArray(payload) || payload.length === 0) {
		return label === undefined || label === null ? "" : String(label)
	}

	const row = payload[0]
	if (typeof row !== "object" || row === null) {
		return label === undefined || label === null ? "" : String(label)
	}

	const nested = (row as { payload?: { label?: string } }).payload?.label
	if (nested) return nested
	return label === undefined || label === null ? "" : String(label)
}

type PayloadRow = {
	name?: unknown
	value?: unknown
	color?: string
	fill?: string
	payload?: { fill?: string }
}

function asPayloadRows(payload: unknown): PayloadRow[] {
	if (!Array.isArray(payload)) return []

	return payload.filter((p): p is PayloadRow => typeof p === "object" && p !== null) as PayloadRow[]
}

export function CustomTooltip({
	active,
	payload,
	label,
	showFooterTotal,
	hideIndicator,
}: CustomTooltipProps) {
	if (!active) return null
	if (!showFooterTotal && !asPayloadRows(payload).length) return null

	const displayLabel = firstRowLabel(payload, label)
	const total = payloadTotal(payload)
	const rows = asPayloadRows(payload)

	return (
		<div className="flex flex-col gap-px rounded-xl bg-popover px-3 py-2 text-xs shadow-lg ring-1 ring-foreground/5">
			<span className="font-medium text-foreground">{formatLabel(displayLabel)}</span>
			{showFooterTotal && (
				<span className="mb-1 text-muted-foreground">Total {formatIDR(total)}</span>
			)}
			{rows
				.filter((p) => (Number(p.value) || 0) > 0)
				.map((p, i) => (
					<div key={i} className="flex items-center gap-2">
						{!hideIndicator && (
							<div
								className="h-2 w-2 shrink-0 rounded-[2px]"
								style={{
									backgroundColor: p.color ?? p.fill ?? p.payload?.fill,
								}}
							/>
						)}
						<span className="text-muted-foreground">{String(p.name ?? "")}</span>
						<span className="ml-auto pl-4 font-mono font-medium">
							{formatIDR(Number(p.value) || 0)}
						</span>
					</div>
				))}
		</div>
	)
}
