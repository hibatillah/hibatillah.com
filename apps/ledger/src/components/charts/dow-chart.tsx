import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { ChartContainer, ChartTooltip, type ChartConfig } from "@packages/ui/components/chart"
import { CustomTooltip } from "./custom-tooltip"

type ExpenseRow = { date: string; amount: number; tag: string }

export type DowDataPoint = { dow: string; label: string; average: number }

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DOW_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon=1...Sun=0

export function useDowData(filtered: ExpenseRow[]): DowDataPoint[] {
	return useMemo(() => {
		const dayTotals = new Map<string, number>()
		for (const e of filtered) {
			const day = e.date.slice(0, 10)
			dayTotals.set(day, (dayTotals.get(day) ?? 0) + e.amount)
		}

		const dowTotal = new Array(7).fill(0)
		const dowDays = new Array(7).fill(0)

		for (const [date, total] of dayTotals) {
			const [y, m, d] = date.split("-").map(Number)
			const dow = new Date(y, m - 1, d).getDay()
			dowTotal[dow] += total
			dowDays[dow]++
		}

		return DOW_ORDER.map((dow, i) => ({
			dow: DOW_LABELS[i],
			label: DOW_FULL[i],
			average: dowDays[dow] > 0 ? Math.round(dowTotal[dow] / dowDays[dow]) : 0,
		}))
	}, [filtered])
}

const dowChartConfig: ChartConfig = {
	average: { label: "Avg Spend", color: "oklch(0.72 0.15 65)" },
}

export function DowChart({ data }: { data: DowDataPoint[] }) {
	return (
		<ChartContainer config={dowChartConfig} className="h-full min-h-[300px] w-full">
			<BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis dataKey="dow" tickLine={false} axisLine={false} />
				<ChartTooltip cursor={{ fill: "transparent" }} content={<CustomTooltip hideIndicator />} />
				<Bar dataKey="average" fill="var(--color-average)" radius={[4, 4, 0, 0]} />
			</BarChart>
		</ChartContainer>
	)
}
