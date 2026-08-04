import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { ChartContainer, ChartTooltip, type ChartConfig } from "@packages/ui/components/chart"
import { CustomTooltip } from "./custom-tooltip"

type ExpenseRow = { date: string; amount: number; tag: string }

export type TomDataPoint = {
	period: "Early" | "Mid" | "Late"
	average: number
}

export function useTomData(filtered: ExpenseRow[]): TomDataPoint[] {
	return useMemo(() => {
		// Distinct year-month pairs in filtered
		const months = new Set(filtered.map((e) => e.date.slice(0, 7)))

		let earlyDays = 0
		let midDays = 0
		let lateDays = 0

		for (const ym of months) {
			const [y, m] = ym.split("-").map(Number)
			const daysInMonth = new Date(y, m, 0).getDate()
			earlyDays += 10
			midDays += 10
			lateDays += daysInMonth - 20
		}

		let earlyTotal = 0
		let midTotal = 0
		let lateTotal = 0

		for (const e of filtered) {
			const day = parseInt(e.date.slice(8, 10), 10)
			if (day <= 10) earlyTotal += e.amount
			else if (day <= 20) midTotal += e.amount
			else lateTotal += e.amount
		}

		return [
			{
				period: "Early",
				average: earlyDays > 0 ? Math.round(earlyTotal / earlyDays) : 0,
			},
			{
				period: "Mid",
				average: midDays > 0 ? Math.round(midTotal / midDays) : 0,
			},
			{
				period: "Late",
				average: lateDays > 0 ? Math.round(lateTotal / lateDays) : 0,
			},
		]
	}, [filtered])
}

const tomChartConfig: ChartConfig = {
	average: { label: "Avg Daily Spend", color: "oklch(0.65 0.18 10)" },
}

export function TomChart({ data }: { data: TomDataPoint[] }) {
	return (
		<ChartContainer config={tomChartConfig} className="h-full min-h-[300px] w-full">
			<BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis dataKey="period" tickLine={false} axisLine={false} />
				<ChartTooltip cursor={{ fill: "transparent" }} content={<CustomTooltip hideIndicator />} />
				<Bar dataKey="average" fill="var(--color-average)" radius={[4, 4, 0, 0]} />
			</BarChart>
		</ChartContainer>
	)
}
