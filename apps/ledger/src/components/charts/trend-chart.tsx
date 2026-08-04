import { useMemo } from "react"
import { Bar, ComposedChart, CartesianGrid, Line, XAxis, YAxis } from "recharts"

import { formatIDR } from "@/lib/utils"

import { ChartContainer, ChartTooltip } from "@packages/ui/components/chart"
import { CustomTooltip } from "./custom-tooltip"
import type { BarDataPoint } from "./expense-chart"

export type TrendDataPoint = {
	label: string
	tick?: string
	spend: number
	avg: number
}

export function useTrendData(
	barData: BarDataPoint[],
	tags: string[],
	isYearMode: boolean,
): TrendDataPoint[] {
	return useMemo(() => {
		const window = isYearMode ? 2 : 7
		const spends = barData.map((point) =>
			tags.reduce((sum, t) => sum + ((point[t] as number) ?? 0), 0),
		)

		return barData.map((point, i) => {
			const start = Math.max(0, i - window + 1)
			const slice = spends.slice(start, i + 1)
			const avg = slice.length > 0 ? Math.round(slice.reduce((s, v) => s + v, 0) / slice.length) : 0

			return {
				label: point.label as string,
				tick: point.tick as string | undefined,
				spend: spends[i],
				avg,
			}
		})
	}, [barData, tags, isYearMode])
}

const trendChartConfig = {
	spend: { label: "Spend", color: "oklch(0.65 0.14 220)" },
	avg: { label: "Avg", color: "oklch(0.75 0.15 85)" },
}

export function TrendChart({ data }: { data: TrendDataPoint[] }) {
	const maxSpend = Math.max(...data.map((d) => d.spend), 0)

	return (
		<ChartContainer config={trendChartConfig} className="h-[300px] w-full">
			<ComposedChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis dataKey="tick" tickLine={false} axisLine={false} interval="preserveStartEnd" />
				<YAxis
					tickLine={false}
					axisLine={false}
					tickFormatter={formatIDR}
					width={65}
					domain={[0, maxSpend]}
				/>
				<ChartTooltip content={<CustomTooltip />} />
				<Bar dataKey="spend" fill="var(--color-spend)" radius={[2, 2, 0, 0]} />
				<Line type="monotone" dataKey="avg" stroke="var(--color-avg)" strokeWidth={2} dot={false} />
			</ComposedChart>
		</ChartContainer>
	)
}
