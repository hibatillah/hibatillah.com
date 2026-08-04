import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@packages/ui/components/button"
import { Separator } from "@packages/ui/components/separator"

import type {
	Column,
	ColumnDataType,
	DataTableFilterActions,
	FilterModel,
	FilterStrategy,
	FiltersState,
} from "../core/types"
import { getColumn } from "../lib/helpers"
import type { Locale } from "../lib/i18n"
import { FilterOperator } from "./filter-operator"
import { FilterSubject } from "./filter-subject"
import { FilterValue } from "./filter-value"

interface ActiveFiltersProps<TData> {
	columns: Column<TData>[]
	filters: FiltersState
	actions: DataTableFilterActions
	strategy: FilterStrategy
	locale?: Locale
}

export function ActiveFilters<TData>({
	columns,
	filters,
	actions,
	strategy,
	locale = "en",
}: ActiveFiltersProps<TData>) {
	return (
		<>
			{filters.map((filter) => {
				const id = filter.columnId
				const column = getColumn(columns, id)

				if (!filter.values) return null

				return (
					<ActiveFilter
						key={`active-filter-${filter.columnId}`}
						filter={filter}
						column={column}
						actions={actions}
						strategy={strategy}
						locale={locale}
					/>
				)
			})}
		</>
	)
}

interface ActiveFilterProps<TData, TType extends ColumnDataType> {
	filter: FilterModel<TType>
	column: Column<TData, TType>
	actions: DataTableFilterActions
	strategy: FilterStrategy
	locale?: Locale
}

export function ActiveFilter<TData, TType extends ColumnDataType>({
	filter,
	column,
	actions,
	strategy,
	locale = "en",
}: ActiveFilterProps<TData, TType>) {
	return (
		<div className="flex h-8 items-center rounded-full border border-border bg-card text-xs">
			<FilterSubject column={column} />
			<Separator orientation="vertical" />
			<FilterOperator filter={filter} column={column} actions={actions} locale={locale} />
			<Separator orientation="vertical" />
			<FilterValue
				filter={filter}
				column={column}
				actions={actions}
				strategy={strategy}
				locale={locale}
			/>
			<Separator orientation="vertical" />
			<Button
				variant="ghost"
				className="h-full w-7 rounded-none rounded-r-2xl text-xs"
				onClick={() => actions.removeFilter(filter.columnId)}
			>
				<X className="size-4 -translate-x-0.5" />
			</Button>
		</div>
	)
}

export function ActiveFiltersMobileContainer({ children }: { children: React.ReactNode }) {
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const [showLeftBlur, setShowLeftBlur] = useState(false)
	const [showRightBlur, setShowRightBlur] = useState(true)

	const checkScroll = () => {
		if (scrollContainerRef.current) {
			const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
			setShowLeftBlur(scrollLeft > 0)
			setShowRightBlur(scrollLeft + clientWidth < scrollWidth - 1)
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useEffect(() => {
		if (scrollContainerRef.current) {
			const resizeObserver = new ResizeObserver(() => {
				checkScroll()
			})
			resizeObserver.observe(scrollContainerRef.current)
			return () => {
				resizeObserver.disconnect()
			}
		}
	}, [])

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useEffect(() => {
		checkScroll()
	}, [children])

	return (
		<div className="relative w-full overflow-x-hidden">
			{showLeftBlur && (
				<div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-16 animate-in bg-linear-to-r from-background to-transparent fade-in-0" />
			)}
			<div
				ref={scrollContainerRef}
				className="no-scrollbar flex gap-2 overflow-x-scroll"
				onScroll={checkScroll}
			>
				{children}
			</div>
			{showRightBlur && (
				<div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-16 animate-in bg-linear-to-l from-background to-transparent fade-in-0" />
			)}
		</div>
	)
}
