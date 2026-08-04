import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	type ChartConfig,
} from "@packages/ui/components/chart"
import { CustomTooltip } from "./custom-tooltip"

type ExpenseRow = { date: string; amount: number; tag: string }

export type MomDataPoint = {
	month: string
	label: string
	thisYear: number
	prevYear: number
}

const MONTH_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const

const MONTH_FULL = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const

export function useMomData(allExpenses: ExpenseRow[], pickerYear: number): MomDataPoint[] {
	return useMemo(() => {
		const result: MomDataPoint[] = MONTH_SHORT.map((month, i) => ({
			month,
			label: MONTH_FULL[i],
			thisYear: 0,
			prevYear: 0,
		}))

		for (const e of allExpenses) {
			const year = parseInt(e.date.slice(0, 4), 10)
			const monthIdx = parseInt(e.date.slice(5, 7), 10) - 1

			if (year === pickerYear) result[monthIdx].thisYear += e.amount
			else if (year === pickerYear - 1) result[monthIdx].prevYear += e.amount
		}

		return result
	}, [allExpenses, pickerYear])
}

const momChartConfig: ChartConfig = {
	thisYear: { label: "This Year", color: "oklch(0.65 0.15 145)" },
	prevYear: { label: "Prev Year", color: "oklch(0.65 0.05 270)" },
}

export function MomChart({ data, pickerYear }: { data: MomDataPoint[]; pickerYear: number }) {
	return (
		<ChartContainer config={momChartConfig} className="h-[300px] w-full">
			<BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis dataKey="month" tickLine={false} axisLine={false} />
				<ChartTooltip content={<CustomTooltip />} />
				<ChartLegend content={<ChartLegendContent />} />
				<Bar
					dataKey="thisYear"
					name={String(pickerYear)}
					fill="var(--color-thisYear)"
					radius={[2, 2, 0, 0]}
				/>
				<Bar
					dataKey="prevYear"
					name={String(pickerYear - 1)}
					fill="var(--color-prevYear)"
					radius={[2, 2, 0, 0]}
				/>
			</BarChart>
		</ChartContainer>
	)
}
