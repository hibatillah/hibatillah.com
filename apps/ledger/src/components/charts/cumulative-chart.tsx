import { useMemo } from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import { ChartContainer, ChartTooltip, type ChartConfig } from "@packages/ui/components/chart"
import { CustomTooltip } from "./custom-tooltip"
import type { BarDataPoint } from "./expense-chart"

export type LineDataPoint = { label: string; tick?: string; total: number }

export function useCumulativeLineData(barData: BarDataPoint[], tags: string[]): LineDataPoint[] {
	return useMemo(() => {
		let running = 0

		return barData.map((point) => {
			const dayTotal = tags.reduce((sum, t) => sum + ((point[t] as number) ?? 0), 0)
			running += dayTotal

			return {
				label: point.label as string,
				tick: point.tick as string | undefined,
				total: running,
			}
		})
	}, [barData, tags])
}

export function CumulativeLineChart({ data }: { data: LineDataPoint[] }) {
	const lineChartConfig: ChartConfig = {
		total: { label: "Cumulative", color: "oklch(0.65 0.18 290)" },
	}

	return (
		<ChartContainer config={lineChartConfig} className="aspect-auto h-[300px] w-full">
			<LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis
					dataKey="tick"
					tickLine={false}
					axisLine={false}
					interval={data.length > 15 ? 4 : 0}
				/>
				<ChartTooltip content={<CustomTooltip hideIndicator />} />
				<Line
					type="monotone"
					dataKey="total"
					stroke="var(--color-total)"
					strokeWidth={3}
					dot={false}
				/>
			</LineChart>
		</ChartContainer>
	)
}
