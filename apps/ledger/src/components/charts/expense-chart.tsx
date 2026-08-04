import { useMemo } from "react"
import type { DateRange } from "react-day-picker"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { buildExpenseBarData } from "@/lib/dashboard/expense-bar-data"
import { formatIDR } from "@/lib/utils"

import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	type ChartConfig,
} from "@packages/ui/components/chart"
import { CustomTooltip } from "./custom-tooltip"

export type BarDataPoint = {
	label: string
	tick?: string
	[key: string]: string | number | undefined
}

type ExpenseRow = { date: string; amount: number; tag: string }

export function useExpenseBarData(
	filtered: ExpenseRow[],
	dateRange: DateRange,
	tags: string[],
	year: number,
): BarDataPoint[] {
	return useMemo(
		() => buildExpenseBarData(filtered, dateRange, tags, year),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[filtered, dateRange, tags],
	)
}

export function ExpenseBarChart({
	data,
	config,
	tags,
}: {
	data: BarDataPoint[]
	config: ChartConfig
	tags: string[]
}) {
	const maxStackValue = Math.max(
		...data.map((d) => tags.reduce((sum, tag) => sum + ((d[tag] as number) || 0), 0)),
		0,
	)

	return (
		<ChartContainer config={config} className="aspect-auto h-[400px] w-full md:h-[300px]">
			<BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis dataKey="tick" tickLine={false} axisLine={false} interval="preserveStartEnd" />
				<YAxis
					tickLine={false}
					axisLine={false}
					tickFormatter={formatIDR}
					width={65}
					domain={[0, maxStackValue]}
				/>
				<ChartTooltip content={(props) => <CustomTooltip {...props} showFooterTotal />} />
				<ChartLegend content={<ChartLegendContent className="max-sm:mt-2" />} />
				{tags.map((tag) => (
					<Bar key={tag} dataKey={tag} stackId="stack" fill={`var(--color-${tag})`} />
				))}
			</BarChart>
		</ChartContainer>
	)
}
