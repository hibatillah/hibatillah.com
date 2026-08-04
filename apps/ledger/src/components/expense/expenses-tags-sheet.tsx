import { useQuery } from "@tanstack/react-query"
import {
	createColumnHelper,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
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
	EllipsisVerticalIcon,
	PenLineIcon,
	Trash2Icon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { DeleteTagDialog } from "@/components/expense/delete-tag-dialog"
import { RenameMergeTagDialog } from "@/components/expense/rename-merge-tag-dialog"
import { TagColorSubmenu } from "@/components/expense/tag-color-submenu"
import { Button } from "@packages/ui/components/button"
import { DataTable, DataTablePagination } from "@packages/ui/components/data-table"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu"
import { SheetHeader } from "@packages/ui/components/sheet"
import {
	ResponsiveSheet,
	ResponsiveSheetContent,
	ResponsiveSheetTitle,
} from "@packages/ui/components/responsive-sheet"
import { closeSheetThen } from "@/lib/close-sheet-then"
import { DEFAULT_TAG_COLOR, TAG_COLOR_OPTIONS } from "@/lib/tag-palette"
import { getTagsWithStatsFn, type TagWithStats } from "@/server/expenses"

const columnHelper = createColumnHelper<TagWithStats>()

interface TagsTableMeta {
	row: TagWithStats
	requestRenameTag: (tag: TagWithStats) => void
	requestDeleteTag: (tag: TagWithStats) => void
}
function TagActions({ row, requestRenameTag, requestDeleteTag }: TagsTableMeta) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="icon" aria-label="Tag actions" className="hit-area-2">
						<EllipsisVerticalIcon className="h-4 w-4" />
					</Button>
				}
			/>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => requestRenameTag(row)}>
					<PenLineIcon /> Rename
				</DropdownMenuItem>
				<TagColorSubmenu tagName={row.name} currentColor={row.color} />
				<DropdownMenuSeparator />
				<DropdownMenuItem variant="destructive" onClick={() => requestDeleteTag(row)}>
					<Trash2Icon /> Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

const tableColumns = [
	columnHelper.accessor("name", {
		header: ({ column }) => (
			<button
				type="button"
				onClick={column.getToggleSortingHandler()}
				className="flex items-center gap-1.5 transition-colors hover:text-foreground"
			>
				Name
				{column.getIsSorted() === false && (
					<ArrowUpDownIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
				)}
				{column.getIsSorted() === "desc" && (
					<ArrowDownIcon className="h-3.5 w-3.5 text-foreground" />
				)}
				{column.getIsSorted() === "asc" && <ArrowUpIcon className="h-3.5 w-3.5 text-foreground" />}
			</button>
		),
		cell: ({ getValue }) => <span className="text-sm font-medium">{getValue()}</span>,
	}),
	columnHelper.accessor("color", {
		header: "Color",
		cell: ({ getValue }) => {
			const c = getValue() || DEFAULT_TAG_COLOR
			const colorName = TAG_COLOR_OPTIONS.find((o) => o.color === c)?.label ?? "Custom"

			return (
				<div className="flex min-w-0 items-center gap-2">
					<div
						className="size-6 shrink-0 rounded-md border border-border"
						style={{ backgroundColor: c }}
					/>
					<span className="truncate text-sm">{colorName}</span>
				</div>
			)
		},
	}),
	columnHelper.accessor("expenseCount", {
		header: ({ column }) => (
			<button
				type="button"
				onClick={column.getToggleSortingHandler()}
				className="flex items-center gap-1.5 transition-colors hover:text-foreground"
			>
				Count
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
			const count = getValue()
			return (
				<span className="text-sm tabular-nums">
					{count} entr{count === 1 ? "y" : "ies"}
				</span>
			)
		},
	}),
	columnHelper.accessor("createdAt", {
		header: ({ column }) => (
			<button
				type="button"
				onClick={column.getToggleSortingHandler()}
				className="flex items-center gap-1.5 transition-colors hover:text-foreground"
			>
				Added at
				{column.getIsSorted() === false && (
					<ArrowUpDownIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
				)}
				{column.getIsSorted() === "desc" && (
					<ArrowDownIcon className="h-3.5 w-3.5 text-foreground" />
				)}
				{column.getIsSorted() === "asc" && <ArrowUpIcon className="h-3.5 w-3.5 text-foreground" />}
			</button>
		),
		cell: ({ getValue }) => (
			<span className="text-sm text-muted-foreground">
				{format(parseISO(getValue()), "PPP", { locale: id })}
			</span>
		),
		sortingFn: "alphanumeric",
	}),
	columnHelper.display({
		id: "actions",
		cell: ({ row, table }) => {
			const meta = table.options.meta as TagsTableMeta
			return (
				<TagActions
					row={row.original}
					requestRenameTag={meta.requestRenameTag}
					requestDeleteTag={meta.requestDeleteTag}
				/>
			)
		},
	}),
]

type TagsSheetDialog =
	| { type: "rename"; tag: TagWithStats }
	| { type: "delete"; tag: TagWithStats }
	| null

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function ExpensesTagsSheet({ open, onOpenChange }: Props) {
	const [tagDialog, setTagDialog] = useState<TagsSheetDialog>(null)
	const [sorting, setSorting] = useState<SortingState>([])
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	})

	const { data: tagRows = [], isLoading } = useQuery({
		queryKey: ["tags"],
		queryFn: () => getTagsWithStatsFn(),
		enabled: open,
	})

	const requestRenameTag = useCallback(
		(tag: TagWithStats) => {
			closeSheetThen(onOpenChange, () => setTagDialog({ type: "rename", tag }))
		},
		[onOpenChange],
	)

	const requestDeleteTag = useCallback(
		(tag: TagWithStats) => {
			closeSheetThen(onOpenChange, () => setTagDialog({ type: "delete", tag }))
		},
		[onOpenChange],
	)

	const tableMeta = useMemo(
		(): TagsTableMeta => ({
			row: tagRows[0],
			requestRenameTag,
			requestDeleteTag,
		}),
		[requestRenameTag, requestDeleteTag, tagRows],
	)

	const table = useReactTable({
		data: tagRows,
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: { sorting, pagination },
		onSortingChange: setSorting as OnChangeFn<SortingState>,
		onPaginationChange: setPagination as OnChangeFn<PaginationState>,
		meta: tableMeta,
	})

	const pageCount = Math.ceil(tagRows.length / pagination.pageSize) || 1

	useEffect(() => {
		setPagination((p) => ({ ...p, pageIndex: 0 }))
	}, [sorting])

	return (
		<>
			<ResponsiveSheet open={open} onOpenChange={onOpenChange}>
				<ResponsiveSheetContent sheetClassName="sm:data-[side=left]:max-w-3xl!">
					<SheetHeader>
						<ResponsiveSheetTitle>Tags</ResponsiveSheetTitle>
					</SheetHeader>

					<div className="space-y-2 px-4 pb-4">
						{isLoading ? (
							<p className="text-sm text-muted-foreground">Loading tags…</p>
						) : (
							<>
								<DataTable table={table} />
								<DataTablePagination
									pagination={pagination}
									pageCount={pageCount}
									onPaginationChange={setPagination as OnChangeFn<PaginationState>}
									totalRows={tagRows.length}
									disabledPageSize
								/>
							</>
						)}
					</div>
				</ResponsiveSheetContent>
			</ResponsiveSheet>

			{tagDialog?.type === "rename" && (
				<RenameMergeTagDialog
					key={tagDialog.tag.name}
					tag={tagDialog.tag}
					open
					onOpenChange={(next) => {
						if (!next) setTagDialog(null)
					}}
				/>
			)}
			{tagDialog?.type === "delete" && (
				<DeleteTagDialog
					tag={tagDialog.tag}
					open
					onOpenChange={(next) => {
						if (!next) setTagDialog(null)
					}}
				/>
			)}
		</>
	)
}
