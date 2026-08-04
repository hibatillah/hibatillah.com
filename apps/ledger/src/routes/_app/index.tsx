import { useHotkeys } from "@tanstack/react-hotkeys"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { addMonths, endOfMonth, format, parseISO, startOfMonth, subMonths } from "date-fns"
import {
	ArrowBigUpDashIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	PlusIcon,
	RotateCcwIcon,
	TablePropertiesIcon,
	TagsIcon,
	UploadIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { CumulativeLineChart, useCumulativeLineData } from "@/components/charts/cumulative-chart"
import { DowChart, useDowData } from "@/components/charts/dow-chart"
import { ExpenseBarChart, useExpenseBarData } from "@/components/charts/expense-chart"
import { HeatmapChart, useHeatmapData } from "@/components/charts/heatmap-chart"
import { MomChart, useMomData } from "@/components/charts/mom-chart"
import { TagAvgChart, useTagAvgData } from "@/components/charts/tag-avg-chart"
import { TagsChart, useDonutData } from "@/components/charts/tags-chart"
import { TomChart, useTomData } from "@/components/charts/tom-chart"
import { TrendChart, useTrendData } from "@/components/charts/trend-chart"
import { DateFilterPopover } from "@/components/dashboard/date-filter-popover"
import { ExtraStatCards, useExtraStats } from "@/components/dashboard/extra-stats-cards"
import { StatCards } from "@/components/dashboard/stats-cards"
import { AddExpenseDialog } from "@/components/expense/add-expense-dialog"
import { CreateTagDialog } from "@/components/expense/create-tag-dialog"
import { ExpensesDataSheet } from "@/components/expense/expenses-data-sheet"
import { ExpensesTagsSheet } from "@/components/expense/expenses-tags-sheet"
import { UploadCsvSheet } from "@/components/expense/upload-csv-sheet"
import { Button } from "@packages/ui/components/button"
import { ButtonGroup } from "@packages/ui/components/button-group"
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@packages/ui/components/chart"
import { Kbd } from "@packages/ui/components/kbd"
import { Skeleton } from "@packages/ui/components/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@packages/ui/components/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@packages/ui/components/tooltip"
import {
	defaultDateFilterState,
	filterExpensesByDateFilter,
	getFullMonthIfCovers,
	getRangeBarStrategy,
	isDefaultDateFilterState,
	type DateFilterState,
} from "@/lib/dashboard/date-filter"
import { capitalize } from "@/lib/utils"
import { getExpensesByYearFn, getTagColorsFn } from "@/server/expenses"

export {
	defaultDateFilterState,
	isDefaultDateFilterState,
	type DateFilterState,
} from "@/lib/dashboard/date-filter"

export const Route = createFileRoute("/_app/")({
	component: Dashboard,
	head: () => ({
		meta: [{ title: "Dashboard | Hibatillah's Ledger" }],
	}),
})

function Dashboard() {
	const [dateFilter, setDateFilter] = useState<DateFilterState>(() => defaultDateFilterState())
	const { dateRange, pickerYear } = dateFilter

	const { data: allExpenses = [], isLoading } = useQuery({
		queryKey: ["expenses", "year", pickerYear],
		queryFn: () => getExpensesByYearFn({ data: pickerYear }),
	})
	const { data: tagColorMap = {} } = useQuery({
		queryKey: ["tagColors"],
		queryFn: () => getTagColorsFn(),
	})

	const tags = useMemo(
		() => [...new Set([...Object.keys(tagColorMap), ...allExpenses.map((e) => e.tag)])].sort(),
		[allExpenses, tagColorMap],
	)

	const chartConfig = useMemo((): ChartConfig => {
		return Object.fromEntries(
			tags.map((tag) => [
				tag,
				{
					label: capitalize(tag),
					color: tagColorMap[tag] ?? "oklch(0.65 0.05 270)",
				},
			]),
		)
	}, [tags, tagColorMap])

	const filtered = useMemo(
		() => filterExpensesByDateFilter(allExpenses, dateRange, pickerYear),
		[allExpenses, dateRange, pickerYear],
	)

	const summary = useMemo(() => {
		if (!filtered.length) {
			return {
				total: 0,
				dailyAverage: 0,
				biggestDate: null as string | null,
				biggestAmount: 0,
				entryCount: 0,
				activeDays: 0,
			}
		}

		const total = filtered.reduce((sum, e) => sum + e.amount, 0)
		const entryCount = filtered.length

		const byDate = new Map<string, number>()

		for (const e of filtered) {
			const day = e.date.slice(0, 10)
			byDate.set(day, (byDate.get(day) ?? 0) + e.amount)
		}

		const activeDays = byDate.size
		const dailyAverage = activeDays > 0 ? Math.round(total / activeDays) : 0

		let biggestDate: string | null = null
		let biggestAmount = 0

		for (const [date, amt] of byDate) {
			if (amt > biggestAmount) {
				biggestAmount = amt
				biggestDate = date
			}
		}

		return {
			total,
			dailyAverage,
			biggestDate,
			biggestAmount,
			entryCount,
			activeDays,
		}
	}, [filtered])

	const isYearMode = getRangeBarStrategy(dateRange) !== "daily"

	const barData = useExpenseBarData(filtered, dateRange, tags, pickerYear)
	const lineData = useCumulativeLineData(barData, tags)
	const donutData = useDonutData(filtered)
	const tagAvgData = useTagAvgData(filtered, summary.activeDays, isYearMode)
	const extraStats = useExtraStats(filtered)
	const trendData = useTrendData(barData, tags, isYearMode)
	const momData = useMomData(allExpenses, pickerYear)
	const heatmapData = useHeatmapData(filtered, dateRange, pickerYear, isYearMode)
	const dowData = useDowData(filtered)
	const tomData = useTomData(filtered)

	const biggestDateFormatted = useMemo(() => {
		if (!summary.biggestDate) return "—"

		try {
			return format(parseISO(summary.biggestDate), "MMM d, yyyy")
		} catch {
			return summary.biggestDate
		}
	}, [summary.biggestDate])

	const barChartTitle =
		getRangeBarStrategy(dateRange) === "daily" ? "Daily Spending" : "Monthly Spending"

	const filterIsDefault = isDefaultDateFilterState(dateFilter)

	const navMode: "year" | "month" | null = useMemo(() => {
		if (!dateRange.from) return "year"

		const to = dateRange.to ?? dateRange.from
		if (getFullMonthIfCovers(dateRange.from, to)) return "month"

		return null
	}, [dateRange])

	const handlePrev = useCallback(() => {
		if (navMode === "month") {
			const prev = subMonths(dateRange.from!, 1)

			setDateFilter({
				dateRange: { from: startOfMonth(prev), to: endOfMonth(prev) },
				pickerYear: prev.getFullYear(),
			})
		} else if (navMode === "year") {
			setDateFilter({
				dateRange: { from: undefined },
				pickerYear: dateFilter.pickerYear - 1,
			})
		}
	}, [navMode, dateRange, dateFilter.pickerYear])

	const handleNext = useCallback(() => {
		if (navMode === "month") {
			const next = addMonths(dateRange.from!, 1)

			setDateFilter({
				dateRange: { from: startOfMonth(next), to: endOfMonth(next) },
				pickerYear: next.getFullYear(),
			})
		} else if (navMode === "year") {
			setDateFilter({
				dateRange: { from: undefined },
				pickerYear: dateFilter.pickerYear + 1,
			})
		}
	}, [navMode, dateRange, dateFilter.pickerYear])

	const [addExpenseOpen, setAddExpenseOpen] = useState(false)
	const [uploadCsvOpen, setUploadCsvOpen] = useState(false)
	const [tagsOpen, setTagsOpen] = useState(false)
	const [dataSheetOpen, setDataSheetOpen] = useState(false)
	const [createTagOpen, setCreateTagOpen] = useState(false)

	// Spend tab toggle (Spending vs Trend)
	const [activeSpendTab, setActiveSpendTab] = useState<"spending" | "trend">("spending")
	useEffect(() => {
		setActiveSpendTab("spending")
	}, [isYearMode])

	const spendTabDescription =
		activeSpendTab === "trend"
			? isYearMode
				? "Raw spend with 2-month rolling average"
				: "Raw spend with 7-day rolling average"
			: isYearMode
				? "Total spend per month, stacked by tag"
				: "Total spend per day, stacked by tag"

	// Jump to Biggest Month (only in strict year mode)
	const isStrictYearMode = !dateRange.from

	const handleJumpToBiggestMonth = useCallback(() => {
		let maxTotal = -1
		let maxIdx = 0

		barData.forEach((point, i) => {
			const total = tags.reduce((s, t) => s + ((point[t] as number) ?? 0), 0)
			if (total > maxTotal) {
				maxTotal = total
				maxIdx = i
			}
		})

		const anchor = new Date(pickerYear, maxIdx, 1)
		setDateFilter({
			dateRange: { from: startOfMonth(anchor), to: endOfMonth(anchor) },
			pickerYear,
		})
	}, [barData, tags, pickerYear])

	useHotkeys([
		{
			hotkey: "A",
			callback: handlePrev,
			options: { enabled: navMode !== null },
		},
		{
			hotkey: "D",
			callback: handleNext,
			options: { enabled: navMode !== null },
		},
		{
			hotkey: "R",
			callback: () => setDateFilter(defaultDateFilterState()),
			options: { enabled: !filterIsDefault },
		},
		{
			hotkey: "B",
			callback: handleJumpToBiggestMonth,
			options: { enabled: isStrictYearMode },
		},
	])

	return (
		<main className="container mx-auto max-w-7xl space-y-4 px-4 pt-6 pb-12">
			<div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-between">
				<div className="**:data-icon:hit-area-x-[5px] **:data-icon:hit-area-y-2 mr-auto flex items-center gap-2 max-sm:w-full">
					<DateFilterPopover
						allExpenses={allExpenses}
						value={dateFilter}
						onChange={setDateFilter}
					/>
					{navMode && (
						<>
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											type="button"
											variant="secondary"
											size="icon"
											aria-label="Previous"
											onClick={handlePrev}
											data-icon
										>
											<ChevronLeftIcon />
										</Button>
									}
								/>
								<TooltipContent>
									Previous <Kbd>A</Kbd>
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											type="button"
											variant="secondary"
											size="icon"
											aria-label="Next"
											onClick={handleNext}
											data-icon
										>
											<ChevronRightIcon />
										</Button>
									}
								/>
								<TooltipContent>
									Next <Kbd>D</Kbd>
								</TooltipContent>
							</Tooltip>
						</>
					)}
					{!filterIsDefault && (
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										type="button"
										variant="secondary"
										size="icon"
										aria-label="Reset date filter to default"
										onClick={() => setDateFilter(defaultDateFilterState())}
										data-icon
									>
										<RotateCcwIcon />
									</Button>
								}
							/>
							<TooltipContent>
								Reset filter <Kbd>R</Kbd>
							</TooltipContent>
						</Tooltip>
					)}
					{isStrictYearMode && (
						<Tooltip>
							<TooltipTrigger
								render={
									<Button type="button" variant="secondary" onClick={handleJumpToBiggestMonth}>
										<ArrowBigUpDashIcon />
										Biggest Month
									</Button>
								}
							/>
							<TooltipContent>
								Jump to biggest month <Kbd>B</Kbd>
							</TooltipContent>
						</Tooltip>
					)}
				</div>

				<div className="flex items-center gap-2 max-sm:w-full">
					<ButtonGroup className="max-sm:flex-1">
						<Button variant="secondary" className="max-sm:flex-1" onClick={() => setTagsOpen(true)}>
							<TagsIcon />
							Tags
						</Button>
						<Button
							variant="secondary"
							size="icon"
							onClick={() => setCreateTagOpen(true)}
							title="Create tag"
						>
							<PlusIcon />
						</Button>
					</ButtonGroup>

					<ButtonGroup className="max-sm:flex-1">
						<Button
							variant="secondary"
							className="max-sm:flex-1"
							onClick={() => setDataSheetOpen(true)}
						>
							<TablePropertiesIcon />
							Expense
						</Button>
						<Button
							size="icon"
							variant="secondary"
							onClick={() => setAddExpenseOpen(true)}
							title="Add expense manually"
						>
							<PlusIcon />
						</Button>
					</ButtonGroup>

					<Button onClick={() => setUploadCsvOpen(true)}>
						<UploadIcon />
						Upload
					</Button>
				</div>

				<ExpensesTagsSheet open={tagsOpen} onOpenChange={setTagsOpen} />
				<ExpensesDataSheet open={dataSheetOpen} onOpenChange={setDataSheetOpen} />
				<CreateTagDialog
					open={createTagOpen}
					onOpenChange={setCreateTagOpen}
					existingTagNames={tags}
				/>
				<AddExpenseDialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen} tags={tags} />
				<UploadCsvSheet open={uploadCsvOpen} onOpenChange={setUploadCsvOpen} />
			</div>

			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCards
					summary={summary}
					biggestDateFormatted={biggestDateFormatted}
					isLoading={isLoading}
				/>
				<ExtraStatCards stats={extraStats} isLoading={isLoading} />
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card className="md:col-span-2 lg:col-span-3">
					<CardHeader>
						<CardTitle>{activeSpendTab === "trend" ? "Spending Trend" : barChartTitle}</CardTitle>
						<CardDescription className="text-balance">{spendTabDescription}</CardDescription>
						<CardAction>
							<Tabs
								value={activeSpendTab}
								onValueChange={(v) => setActiveSpendTab(v as "spending" | "trend")}
							>
								<TabsList>
									<TabsTrigger value="spending">Spending</TabsTrigger>
									<TabsTrigger value="trend">Trend</TabsTrigger>
								</TabsList>
							</Tabs>
						</CardAction>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-[300px] w-full rounded-md" />
						) : activeSpendTab === "spending" ? (
							<ExpenseBarChart data={barData} config={chartConfig} tags={tags} />
						) : (
							<TrendChart data={trendData} />
						)}
					</CardContent>
				</Card>

				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>
							{isYearMode ? "Avg Monthly Spend by Tag" : "Avg Daily Spend by Tag"}
						</CardTitle>
						<CardDescription>
							{isYearMode
								? "Average spend per month for each tag"
								: "Average spend per active day for each tag"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-[300px] w-full rounded-md" />
						) : (
							<TagAvgChart data={tagAvgData} config={chartConfig} />
						)}
					</CardContent>
				</Card>

				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>By Tag</CardTitle>
						<CardDescription>Share of total spend per category</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-[300px] w-full rounded-md" />
						) : (
							<TagsChart data={donutData} config={chartConfig} />
						)}
					</CardContent>
				</Card>

				<Card className="md:order-last lg:order-[unset] lg:col-span-1">
					<CardHeader>
						<CardTitle>Cumulative Spending</CardTitle>
						<CardDescription>Running total over the selected period</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-[300px] w-full rounded-md" />
						) : (
							<CumulativeLineChart data={lineData} />
						)}
					</CardContent>
				</Card>

				<Card
					className={`${isYearMode ? "md:col-span-2 lg:col-span-3" : "lg:col-span-1"} order-last overflow-visible md:order-[unset] lg:order-last`}
				>
					<CardHeader>
						<CardTitle>Spending Heatmap</CardTitle>
						<CardDescription>Daily spend intensity</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-[300px] w-full rounded-md" />
						) : (
							<HeatmapChart
								data={heatmapData.data}
								start={heatmapData.start}
								end={heatmapData.end}
								isYearMode={isYearMode}
							/>
						)}
					</CardContent>
				</Card>

				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>By Day of Week</CardTitle>
						<CardDescription>Average spend on each weekday</CardDescription>
					</CardHeader>
					<CardContent className="h-full">
						{isLoading ? (
							<Skeleton className="h-[300px] w-full rounded-md" />
						) : (
							<DowChart data={dowData} />
						)}
					</CardContent>
				</Card>

				{isYearMode ? (
					<>
						<Card className="lg:col-span-1">
							<CardHeader>
								<CardTitle>Month-over-Month</CardTitle>
								<CardDescription>Monthly totals comparing this year vs last year</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoading ? (
									<Skeleton className="h-[300px] w-full rounded-md" />
								) : (
									<MomChart data={momData} pickerYear={pickerYear} />
								)}
							</CardContent>
						</Card>

						<Card className="lg:col-span-1">
							<CardHeader>
								<CardTitle>Time of Month</CardTitle>
								<CardDescription>Average daily spend by early / mid / late month</CardDescription>
							</CardHeader>
							<CardContent className="h-full flex-auto">
								{isLoading ? (
									<Skeleton className="h-[300px] w-full rounded-md" />
								) : (
									<TomChart data={tomData} />
								)}
							</CardContent>
						</Card>
					</>
				) : (
					<>
						<Card className="lg:col-span-1">
							<CardHeader>
								<CardTitle>Time of Month</CardTitle>
								<CardDescription>Average daily spend by early / mid / late month</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoading ? (
									<Skeleton className="h-[300px] w-full rounded-md" />
								) : (
									<TomChart data={tomData} />
								)}
							</CardContent>
						</Card>
					</>
				)}
			</div>
		</main>
	)
}
