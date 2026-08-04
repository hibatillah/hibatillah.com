import {
	flexRender,
	type OnChangeFn,
	type PaginationState,
	type Table,
} from "@tanstack/react-table"
import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "../../lib/utils"

import { Button } from "./button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { TableBody, TableCell, TableHead, TableHeader, Table as TableRoot, TableRow } from "./table"

interface DataTableProps<TData> {
	table: Table<TData>
	className?: string
}

export function DataTable<TData>({ table, className }: DataTableProps<TData>) {
	const colCount = table.getVisibleLeafColumns().length

	return (
		<div className={cn("w-full overflow-x-auto rounded-md border bg-card", className)}>
			<TableRoot>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id} className="bg-muted">
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id} className={cn(header.id === "actions" && "w-12")}>
									{header.isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={colCount} className="h-40 text-center text-muted-foreground">
								No entries match the current filters.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</TableRoot>
		</div>
	)
}

const DEFAULT_PAGE_SIZES = [10, 20, 50]

interface DataTablePaginationProps {
	pagination: PaginationState
	pageCount: number
	onPaginationChange: OnChangeFn<PaginationState>
	pageSizes?: number[]
	totalRows?: number
	disabledPageSize?: boolean
}

export function DataTablePagination({
	pagination,
	pageCount,
	onPaginationChange,
	pageSizes = DEFAULT_PAGE_SIZES,
	totalRows,
	disabledPageSize = false,
}: DataTablePaginationProps) {
	return (
		<div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
			{!disabledPageSize && (
				<>
					<Select
						value={String(pagination.pageSize)}
						onValueChange={(val) => onPaginationChange({ pageIndex: 0, pageSize: Number(val) })}
					>
						<SelectTrigger className="h-8 w-16">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{pageSizes.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<span className="max-sm:hidden">rows per page</span>
					<span>•</span>
				</>
			)}
			{totalRows !== undefined && <span>{totalRows} entries</span>}
			<span
				className={cn("mx-1", {
					hidden: !disabledPageSize,
				})}
			>
				•
			</span>
			<span
				className={cn("mr-2 max-sm:hidden", {
					"ml-auto": !disabledPageSize,
				})}
			>
				Page {pagination.pageIndex + 1} of {pageCount || 1}
			</span>

			<Button
				variant="outline"
				size="icon"
				className={cn("size-8", {
					"ml-auto": disabledPageSize,
				})}
				onClick={() => onPaginationChange({ ...pagination, pageIndex: 0 })}
				disabled={pagination.pageIndex === 0}
			>
				<ChevronFirstIcon className="size-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				className="size-8"
				onClick={() =>
					onPaginationChange({
						...pagination,
						pageIndex: pagination.pageIndex - 1,
					})
				}
				disabled={pagination.pageIndex === 0}
			>
				<ChevronLeftIcon className="size-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				className="size-8"
				onClick={() =>
					onPaginationChange({
						...pagination,
						pageIndex: pagination.pageIndex + 1,
					})
				}
				disabled={pagination.pageIndex >= pageCount - 1}
			>
				<ChevronRightIcon className="size-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				className="size-8"
				onClick={() => onPaginationChange({ ...pagination, pageIndex: pageCount - 1 })}
				disabled={pagination.pageIndex >= pageCount - 1}
			>
				<ChevronLastIcon className="size-4" />
			</Button>
		</div>
	)
}
