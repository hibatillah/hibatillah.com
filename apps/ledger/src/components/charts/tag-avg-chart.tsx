import { useMemo } from "react"
import { Bar, BarChart, XAxis } from "recharts"

import { ChartContainer, ChartTooltip, type ChartConfig } from "@packages/ui/components/chart"
import { CustomTooltip } from "./custom-tooltip"

export type TagAvgDataPoint = { tag: string; average: number }

type ExpenseRow = { date: string; amount: number; tag: string }

export function useTagAvgData(
	filtered: ExpenseRow[],
	activeDays: number,
	isYearMode: boolean,
): TagAvgDataPoint[] {
	return useMemo(() => {
		const denominator = isYearMode
			? new Set(filtered.map((e) => e.date.slice(0, 7))).size
			: activeDays
		if (denominator === 0) return []
		const totals = new Map<string, number>()

		for (const e of filtered) {
			totals.set(e.tag, (totals.get(e.tag) ?? 0) + e.amount)
		}

		return Array.from(totals.entries())
			.map(([tag, total]) => ({
				tag,
				average: Math.round(total / denominator),
			}))
			.sort((a, b) => b.average - a.average)
			.slice(0, 10)
	}, [filtered, activeDays, isYearMode])
}

export function TagAvgChart({ data, config }: { data: TagAvgDataPoint[]; config: ChartConfig }) {
	if (!data.length) {
		return <p className="py-8 text-center text-muted-foreground">No data</p>
	}

	const dataWithFill = data.map((entry) => ({
		...entry,
		fill: (config[entry.tag]?.color as string) ?? "oklch(0.65 0.05 270)",
	}))

	return (
		<ChartContainer config={config} className="h-[300px] w-full">
			<BarChart data={dataWithFill} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
				<XAxis dataKey="tag" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
				<ChartTooltip cursor={{ fill: "transparent" }} content={<CustomTooltip />} />
				<Bar dataKey="average" radius={[4, 4, 0, 0]} />
			</BarChart>
		</ChartContainer>
	)
}
