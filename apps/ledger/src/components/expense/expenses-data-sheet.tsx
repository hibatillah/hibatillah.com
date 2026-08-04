import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
	createColumnHelper,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
	type OnChangeFn,
	type PaginationState,
	type SortingState,
} from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import {
	ArrowDownIcon,
	ArrowUpDownIcon,
	ArrowUpIcon,
	CalendarIcon,
	CoinsIcon,
	EllipsisVerticalIcon,
	PencilIcon,
	TagIcon,
	Trash2Icon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { DataTableFilter, useDataTableFilters } from "@/components/data-table-filter"
import type { FilterModel } from "@/components/data-table-filter/core/types"
import { DeleteExpenseDialog } from "@/components/expense/delete-expense-dialog"
import { EditExpenseDialog, type Expense } from "@/components/expense/edit-expense-dialog"
import { Button } from "@packages/ui/components/button"
import { DataTable, DataTablePagination } from "@packages/ui/components/data-table"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu"
import { SheetHeader } from "@packages/ui/components/sheet"
import {
	ResponsiveSheet,
	ResponsiveSheetContent,
	ResponsiveSheetTitle,
} from "@packages/ui/components/responsive-sheet"
import { closeSheetThen } from "@/lib/close-sheet-then"
import { capitalize, formatIDR } from "@/lib/utils"
import { getExpensesPaginatedFn, getTagColorsFn } from "@/server/expenses"

interface TableMeta {
	tags: string[]
	tagColors: Record<string, string>
	requestEditExpense: (expense: Expense) => void
	requestDeleteExpense: (expense: Expense) => void
}

const columnHelper = createColumnHelper<Expense>()
const DEFAULT_COLOR = "oklch(0.65 0.05 270)"

const tableColumns = [
	columnHelper.accessor("date", {
		header: ({ column }) => (
			<button
				onClick={column.getToggleSortingHandler()}
				className="flex items-center gap-1.5 transition-colors hover:text-foreground"
			>
				Date
				{column.getIsSorted() === false && (
					<ArrowUpDownIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
				)}
				{column.getIsSorted() === "desc" && (
					<ArrowDownIcon className="h-3.5 w-3.5 text-foreground" />
				)}
				{column.getIsSorted() === "asc" && <ArrowUpIcon className="h-3.5 w-3.5 text-foreground" />}
			</button>
		),
		cell: ({ getValue }) => {
			const raw = getValue()
			const date = parseISO(raw)
			const hasTime = raw.includes("T")
			return (
				<span className="text-sm">
					{format(date, "PPP", { locale: id })}
					{hasTime && <span className="ml-1 text-muted-foreground">{format(date, "HH:mm")}</span>}
				</span>
			)
		},
		sortingFn: "alphanumeric",
	}),
	columnHelper.accessor("amount", {
		header: ({ column }) => (
			<button
				onClick={column.getToggleSortingHandler()}
				className="flex items-center gap-1.5 transition-colors hover:text-foreground"
			>
				Amount
				{column.getIsSorted() === false && (
					<ArrowUpDownIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
				)}
				{column.getIsSorted() === "desc" && (
					<ArrowDownIcon className="h-3.5 w-3.5 text-foreground" />
				)}
				{column.getIsSorted() === "asc" && <ArrowUpIcon className="h-3.5 w-3.5 text-foreground" />}
			</button>
		),
		cell: ({ getValue }) => <span className="font-mono text-sm">{formatIDR(getValue())}</span>,
	}),
	columnHelper.accessor("tag", {
		header: "Tag",
		cell: ({ getValue, table }) => {
			const tag = getValue()
			const meta = table.options.meta as TableMeta
			const color = meta.tagColors[tag] ?? DEFAULT_COLOR
			return (
				<span className="inline-flex items-center gap-1.5">
					<span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
					<span className="text-sm">{capitalize(tag)}</span>
				</span>
			)
		},
		enableSorting: false,
	}),
	columnHelper.accessor("createdAt", {
		header: "Added At",
		cell: ({ getValue }) => (
			<span className="text-sm text-muted-foreground">
				{format(parseISO(getValue()), "PPP", { locale: id })}
			</span>
		),
		enableSorting: false,
	}),
	columnHelper.display({
		id: "actions",
		cell: ({ row, table }) => {
			const meta = table.options.meta as TableMeta
			return (
				<ExpenseActions
					expense={row.original}
					requestEditExpense={meta.requestEditExpense}
					requestDeleteExpense={meta.requestDeleteExpense}
				/>
			)
		},
	}),
]

function ExpenseActions({
	expense,
	requestEditExpense,
	requestDeleteExpense,
}: {
	expense: Expense
	requestEditExpense: (expense: Expense) => void
	requestDeleteExpense: (expense: Expense) => void
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="icon" aria-label="Row actions" className="hit-area-2">
						<EllipsisVerticalIcon className="h-4 w-4" />
					</Button>
				}
			/>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => requestEditExpense(expense)}>
					<PencilIcon /> Edit
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => requestDeleteExpense(expense)} variant="destructive">
					<Trash2Icon /> Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

type ExpenseSheetDialog =
	| { type: "edit"; expense: Expense }
	| { type: "delete"; expense: Expense }
	| null

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function ExpensesDataSheet({ open, onOpenChange }: Props) {
	const [expenseDialog, setExpenseDialog] = useState<ExpenseSheetDialog>(null)
	const [sorting, setSorting] = useState<SortingState>([])
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	})

	const { data: tagColors = {} } = useQuery({
		queryKey: ["tagColors"],
		queryFn: () => getTagColorsFn(),
	})

	const tags = useMemo(() => Object.keys(tagColors).sort(), [tagColors])

	const columnsConfig = useMemo(
		() => [
			{
				id: "date",
				accessor: (e: Expense) => parseISO(e.date),
				displayName: "Date",
				icon: CalendarIcon,
				type: "date" as const,
			},
			{
				id: "amount",
				accessor: (e: Expense) => e.amount,
				displayName: "Amount",
				icon: CoinsIcon,
				type: "number" as const,
			},
			{
				id: "tag",
				accessor: (e: Expense) => e.tag,
				displayName: "Tag",
				icon: TagIcon,
				type: "option" as const,
				options: tags.map((t) => ({ label: capitalize(t), value: t })),
			},
		],
		[tags],
	)

	const {
		columns: filterColumns,
		filters,
		actions,
		strategy,
	} = useDataTableFilters({
		strategy: "server",
		data: [] as Expense[],
		columnsConfig,
	})

	const tagFilter = filters.find((f) => f.columnId === "tag") as FilterModel<"option"> | undefined
	const dateFilter = filters.find((f) => f.columnId === "date") as FilterModel<"date"> | undefined
	const amountFilter = filters.find((f) => f.columnId === "amount") as
		| FilterModel<"number">
		| undefined

	const serverFilters = useMemo(
		() => ({
			tagValues: tagFilter?.values ?? [],
			tagExclude: tagFilter?.operator === "is not" || tagFilter?.operator === "is none of",
			dateValues: dateFilter?.values.map((d) => d.toISOString().slice(0, 10)) ?? [],
			dateOperator: dateFilter?.operator ?? "is between",
			amountValues: amountFilter?.values ?? [],
			amountOperator: amountFilter?.operator ?? "is between",
		}),
		[tagFilter, dateFilter, amountFilter],
	)

	const sortItem = sorting[0]
	const { data: pageData } = useQuery({
		queryKey: ["expenses", "paginated", pagination, sorting, serverFilters],
		queryFn: () =>
			getExpensesPaginatedFn({
				data: {
					page: pagination.pageIndex,
					pageSize: pagination.pageSize,
					sortField: (sortItem?.id ?? "date") as "date" | "amount" | "createdAt",
					sortDir: sortItem?.desc === false ? "asc" : "desc",
					...serverFilters,
				},
			}),
		placeholderData: keepPreviousData,
	})

	const rows = pageData?.rows ?? []
	const total = pageData?.total ?? 0
	const pageCount = Math.ceil(total / pagination.pageSize)

	const requestEditExpense = useCallback(
		(expense: Expense) => {
			closeSheetThen(onOpenChange, () => setExpenseDialog({ type: "edit", expense }))
		},
		[onOpenChange],
	)

	const requestDeleteExpense = useCallback(
		(expense: Expense) => {
			closeSheetThen(onOpenChange, () => setExpenseDialog({ type: "delete", expense }))
		},
		[onOpenChange],
	)

	const tableMeta = useMemo(
		(): TableMeta => ({
			tags,
			tagColors,
			requestEditExpense,
			requestDeleteExpense,
		}),
		[tags, tagColors, requestEditExpense, requestDeleteExpense],
	)

	const table = useReactTable({
		data: rows,
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualSorting: true,
		manualPagination: true,
		pageCount,
		state: { sorting, pagination },
		onSortingChange: setSorting as OnChangeFn<SortingState>,
		onPaginationChange: setPagination as OnChangeFn<PaginationState>,
		meta: tableMeta,
	})

	useEffect(() => {
		setPagination((p) => ({ ...p, pageIndex: 0 }))
	}, [filters, sorting])

	return (
		<>
			<ResponsiveSheet open={open} onOpenChange={onOpenChange}>
				<ResponsiveSheetContent sheetClassName="sm:data-[side=left]:max-w-3xl!">
					<SheetHeader>
						<ResponsiveSheetTitle>Expense Data</ResponsiveSheetTitle>
					</SheetHeader>

					<div className="space-y-2 overflow-y-auto px-4 pb-4">
						<DataTableFilter
							columns={filterColumns}
							filters={filters}
							actions={actions}
							strategy={strategy}
						/>

						<DataTable table={table} />

						<DataTablePagination
							pagination={pagination}
							pageCount={pageCount}
							onPaginationChange={setPagination as OnChangeFn<PaginationState>}
							totalRows={total}
							disabledPageSize
						/>
					</div>
				</ResponsiveSheetContent>
			</ResponsiveSheet>

			{expenseDialog?.type === "edit" && (
				<EditExpenseDialog
					key={expenseDialog.expense.id}
					expense={expenseDialog.expense}
					tags={tags}
					open
					onOpenChange={(next) => {
						if (!next) setExpenseDialog(null)
					}}
				/>
			)}
			{expenseDialog?.type === "delete" && (
				<DeleteExpenseDialog
					expense={expenseDialog.expense}
					open
					onOpenChange={(next) => {
						if (!next) setExpenseDialog(null)
					}}
				/>
			)}
		</>
	)
}
