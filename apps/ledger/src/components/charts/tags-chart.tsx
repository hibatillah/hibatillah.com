import { useMemo } from "react"
import { Label, Pie, PieChart } from "recharts"

import { formatIDR } from "@/lib/utils"

import { ChartContainer, ChartTooltip, type ChartConfig } from "@packages/ui/components/chart"

export type DonutDataPoint = { name: string; value: number }

type ExpenseRow = { date: string; amount: number; tag: string }

export function useDonutData(filtered: ExpenseRow[]): DonutDataPoint[] {
	return useMemo(() => {
		const totals = new Map<string, number>()

		for (const e of filtered) {
			totals.set(e.tag, (totals.get(e.tag) ?? 0) + e.amount)
		}

		return Array.from(totals.entries())
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value)
	}, [filtered])
}

function DonutTooltip({
	active,
	payload,
	total,
}: {
	active?: boolean
	payload?: Array<{ name: string; value: number; payload: { fill: string } }>
	total: number
}) {
	if (!active || !payload?.length) return null
	const { name, value, payload: inner } = payload[0]
	const pct = total > 0 ? Math.round((value / total) * 100) : 0

	return (
		<div className="rounded-xl bg-popover px-3 py-2 text-xs shadow-lg ring-1 ring-foreground/5">
			<div className="flex items-center gap-2">
				<div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: inner.fill }} />
				<span className="font-medium text-foreground">{name}</span>
			</div>
			<div className="mt-0.5 space-x-4 pl-4 font-mono">
				<span className="text-muted-foreground">{pct}%</span>
				<span className="text-foreground">{formatIDR(value)}</span>
			</div>
		</div>
	)
}

export function TagsChart({ data, config }: { data: DonutDataPoint[]; config: ChartConfig }) {
	const total = data.reduce((acc, curr) => acc + curr.value, 0)

	if (!data.length) {
		return <p className="py-8 text-center text-muted-foreground">No data</p>
	}

	return (
		<ChartContainer config={config} className="mx-auto aspect-square h-[300px]">
			<PieChart>
				<ChartTooltip cursor={false} content={<DonutTooltip total={total} />} />
				<Pie
					data={data.map((entry) => ({
						...entry,
						fill: (config[entry.name]?.color as string) ?? `var(--color-${entry.name})`,
					}))}
					dataKey="value"
					nameKey="name"
					innerRadius={80}
					strokeWidth={5}
				>
					<Label
						content={({ viewBox }) => {
							if (viewBox && "cx" in viewBox && "cy" in viewBox) {
								return (
									<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
										<tspan
											x={viewBox.cx}
											y={viewBox.cy ?? 0}
											className="fill-foreground text-2xl font-bold"
										>
											{total.toLocaleString()}
										</tspan>
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy ?? 0) + 24}
											className="fill-muted-foreground text-base"
										>
											Total
										</tspan>
									</text>
								)
							}
						}}
					/>
				</Pie>
			</PieChart>
		</ChartContainer>
	)
}
