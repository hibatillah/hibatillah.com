import { format, parse } from "date-fns"
import { id } from "date-fns/locale"
import { UploadIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@packages/ui/components/button"
import { Kbd } from "@packages/ui/components/kbd"
import {
	ResponsiveSheet,
	ResponsiveSheetContent,
	ResponsiveSheetTitle,
} from "@packages/ui/components/responsive-sheet"
import { SheetFooter, SheetHeader } from "@packages/ui/components/sheet"
import { Tabs, TabsList, TabsTrigger } from "@packages/ui/components/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { action } from "@/lib/utils"
import { checkConflictingDatesFn, importExpensesFn } from "@/server/expenses"

type Phase = "idle" | "processing" | "preview" | "checking" | "conflict" | "submitting"
type ParsedRow = { date: string; amount: number; tag: string }
type RowError = { row: number; message: string }
type FileResult = { name: string; rows: ParsedRow[]; errors: RowError[] }

function normalizeDate(raw: string): string {
	const normalized = raw.replace(/\u202f/g, " ").trim()
	try {
		const dt = parse(normalized, "M/d/yy, h:mm a", new Date())
		if (!isNaN(dt.getTime())) return format(dt, "yyyy-MM-dd'T'HH:mm:ss")
	} catch {}
	const datePart = normalized.split(",")[0].trim()
	return format(parse(datePart, "M/d/yy", new Date()), "yyyy-MM-dd")
}

const trimStr = z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string())

const csvRowSchema = z
	.object({
		amount: trimStr,
		comment: trimStr,
		commit_time: trimStr,
	})
	.superRefine((data, ctx) => {
		if (!data.amount) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, message: "missing amount" })
			return
		}
		const amount = parseInt(data.amount, 10)
		if (isNaN(amount) || amount <= 0) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, message: "invalid amount" })
			return
		}
		if (!data.comment) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, message: "missing tag" })
			return
		}
		if (!data.commit_time) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, message: "missing date" })
			return
		}
		try {
			normalizeDate(data.commit_time)
		} catch {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "invalid date format",
			})
		}
	})
	.transform(
		(data): ParsedRow => ({
			amount: parseInt(data.amount, 10),
			tag: data.comment,
			date: normalizeDate(data.commit_time),
		}),
	)

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function UploadCsvSheet({ open, onOpenChange: setOpen }: Props) {
	const isMobile = useIsMobile()

	const [phase, setPhase] = useState<Phase>("idle")
	const [fileResults, setFileResults] = useState<FileResult[]>([])
	const [isDragging, setIsDragging] = useState(false)
	const [conflictingDates, setConflictingDates] = useState<string[]>([])
	const [conflictAction, setConflictAction] = useState<"append" | "override" | null>(null)

	const allRows = fileResults.flatMap((f) => f.rows)
	const conflictDaySet = new Set(conflictingDates)
	const overrideCount = allRows.filter((r) => conflictDaySet.has(r.date.slice(0, 10))).length
	const appendCount = allRows.length - overrideCount

	useEffect(() => {
		if (!open) {
			setPhase("idle")
			setFileResults([])
			setIsDragging(false)
			setConflictingDates([])
			setConflictAction(null)
		}
	}, [open])

	async function handleFiles(files: FileList | null) {
		if (!files?.length) return
		setPhase("processing")
		const newResults: FileResult[] = []
		let pending = files.length

		// Loaded dynamically so its bundled web-worker source string never lands
		// in the SSR bundle — this feature is client-only anyway.
		const { default: Papa } = await import("papaparse")

		Array.from(files).forEach((file) => {
			Papa.parse<{ amount: string; comment: string; commit_time: string }>(file, {
				header: true,
				skipEmptyLines: true,
				complete: ({ data }) => {
					const rows: ParsedRow[] = []
					const errors: RowError[] = []

					for (let i = 0; i < data.length; i++) {
						const parsed = csvRowSchema.safeParse(data[i])

						if (!parsed.success) {
							errors.push({
								row: i + 1,
								message: parsed.error.issues[0]?.message ?? "invalid row",
							})
							continue
						}

						rows.push(parsed.data)
					}

					newResults.push({ name: file.name, rows, errors })

					if (--pending === 0) {
						setFileResults((prev) => [...prev, ...newResults])
						setPhase("preview")
					}
				},
				error: (err) => {
					console.error("[upload-csv] PapaParse error:", err)

					newResults.push({
						name: file.name,
						rows: [],
						errors: [{ row: 0, message: "failed to parse file" }],
					})

					if (--pending === 0) {
						setFileResults((prev) => [...prev, ...newResults])
						setPhase("preview")
					}
				},
			})
		})
	}

	async function handleImportClick() {
		setPhase("checking")
		const uniqueDates = [...new Set(allRows.map((r) => r.date.slice(0, 10)))]

		try {
			const conflicts = await checkConflictingDatesFn({
				data: { dates: uniqueDates },
			})

			if (conflicts.length > 0) {
				setConflictingDates(conflicts)
				setPhase("conflict")
			} else {
				await doImport()
			}
		} catch (err) {
			console.error("[upload-csv] conflict check failed:", err)
			toast.error("Failed to check for conflicts.")
			setPhase("preview")
		}
	}

	async function doImport(overrideDates?: string[]) {
		try {
			setPhase("submitting")

			await action(
				"import-entries",
				async () => {
					await importExpensesFn({ data: { rows: allRows, overrideDates } })
					setOpen(false)
				},
				{
					loading: "Importing entries…",
					success: `${allRows.length} entries imported.`,
				},
			)
		} catch {
			setPhase("preview")
		}
	}

	const isProcessing = phase === "processing"
	const showDropzone = phase !== "submitting" && phase !== "conflict"

	let submitLabel: string
	if (phase === "checking") {
		submitLabel = "Checking…"
	} else if (phase === "submitting") {
		submitLabel = "Importing…"
	} else if (phase === "conflict" && conflictAction === "append") {
		submitLabel = `Append ${allRows.length} entries`
	} else if (phase === "conflict" && conflictAction === "override") {
		submitLabel =
			appendCount > 0
				? `Override ${overrideCount} and append ${appendCount} new entries`
				: `Override ${overrideCount} entries`
	} else {
		submitLabel = `Import ${allRows.length} entries`
	}

	return (
		<ResponsiveSheet open={open} onOpenChange={setOpen}>
			<ResponsiveSheetContent
				className="flex flex-col gap-0 p-0"
				sheetClassName="sm:data-[side=left]:max-w-xl!"
			>
				<SheetHeader className="border-b px-4 py-4">
					<ResponsiveSheetTitle>Import CSV</ResponsiveSheetTitle>
					<p className="text-sm text-muted-foreground">
						Upload one or more CSV files from your expense tracker.
					</p>
				</SheetHeader>

				<div className="flex min-h-96 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
					{fileResults.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="text-base font-semibold text-foreground">Uploaded Entries</p>
							<div className="rounded-lg border border-border/50 bg-muted/40 p-3">
								<ul className="flex flex-col gap-1">
									{fileResults.map((f, i) => (
										<li key={i} className="flex flex-col gap-1 text-sm">
											<div className="flex items-center justify-between gap-4">
												<span className="max-w-100 truncate text-muted-foreground">{f.name}</span>
												<div className="flex shrink-0 items-center gap-2">
													<span className="tabular-nums">
														{f.rows.length} {f.rows.length === 1 ? "entry" : "entries"}
														{f.errors.length > 0 && (
															<span className="ml-1 text-muted-foreground">
																({f.errors.length} skipped)
															</span>
														)}
													</span>
													{phase !== "submitting" && (
														<button
															type="button"
															onClick={() => {
																const next = fileResults.filter((_, j) => j !== i)
																setFileResults(next)
																if (next.length === 0) setPhase("idle")
																else if (phase === "conflict") setPhase("preview")
															}}
															className="text-muted-foreground hover:text-destructive"
															aria-label={`Remove ${f.name}`}
														>
															<XIcon className="h-3.5 w-3.5" />
														</button>
													)}
												</div>
											</div>
											{f.errors.length > 0 && (
												<ul className="flex flex-col gap-0.5 pl-2">
													{f.errors.slice(0, 3).map((e) => (
														<li key={e.row} className="text-xs text-destructive">
															Row {e.row}: {e.message}
														</li>
													))}
													{f.errors.length > 3 && (
														<li className="text-xs text-muted-foreground">
															+{f.errors.length - 3} more skipped rows
														</li>
													)}
												</ul>
											)}
										</li>
									))}
								</ul>
								<div className="mt-2 flex items-center justify-between border-t pt-2 text-sm font-medium">
									<span>Total</span>
									<span className="tabular-nums">{allRows.length} entries</span>
								</div>
							</div>
						</div>
					)}

					{/* Dropzone — mt-auto pushes to bottom of scrollable area */}
					{showDropzone && (
						<label
							htmlFor="csv-file-input"
							className={`mt-auto flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${fileResults.length > 0 ? "mt-4" : "mt-auto"} ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"} ${isProcessing ? "pointer-events-none cursor-default" : "cursor-pointer"}`}
							onDragOver={(e) => {
								e.preventDefault()
								setIsDragging(true)
							}}
							onDragLeave={() => setIsDragging(false)}
							onDrop={(e) => {
								e.preventDefault()
								setIsDragging(false)
								handleFiles(e.dataTransfer.files)
							}}
						>
							{isProcessing ? (
								<>
									<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
									<p className="text-sm text-muted-foreground">Processing…</p>
								</>
							) : (
								<>
									<UploadIcon className="h-7 w-7 stroke-[1.5px] text-muted-foreground" />
									<p className="text-sm text-muted-foreground">
										{allRows.length > 0
											? "Drop more CSV files to add entries"
											: "Drop CSV files here or click to upload"}
									</p>
									<p className="text-center text-xs text-muted-foreground/60">
										Expected columns: <Kbd>amount</Kbd> <Kbd>comment</Kbd> <Kbd>commit_time</Kbd>
									</p>
								</>
							)}
							<input
								id="csv-file-input"
								type="file"
								accept=".csv"
								multiple
								className="hidden"
								onChange={(e) => {
									handleFiles(e.target.files)
									e.target.value = ""
								}}
							/>
						</label>
					)}

					{/* Conflict section — replaces dropzone in same position */}
					{phase === "conflict" && (
						<div className="mt-auto flex flex-col gap-2 pt-4">
							<p className="text-base font-semibold text-foreground">Duplicate Dates</p>
							<div className="rounded-lg border border-border/50 bg-muted/40 p-3">
								<p className="text-sm text-muted-foreground">
									{conflictingDates.length} {conflictingDates.length === 1 ? "date" : "dates"} in
									this import already {conflictingDates.length === 1 ? "has" : "have"} existing
									entries:
								</p>
								<ul className="mt-2 mb-4 flex flex-wrap gap-1">
									{conflictingDates.map((d) => (
										<li
											key={d}
											className="rounded bg-background px-2 py-0.5 text-xs text-muted-foreground"
										>
											{format(new Date(d + "T00:00:00"), "d MMM yyyy", {
												locale: id,
											})}
										</li>
									))}
								</ul>

								<Tabs
									value={conflictAction ?? ""}
									onValueChange={(v) => setConflictAction(v as "append" | "override")}
								>
									<TabsList className="self-end">
										<TabsTrigger value="append">Append</TabsTrigger>
										<TabsTrigger value="override">Override</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>
						</div>
					)}
				</div>

				<SheetFooter className="border-t px-4 py-3">
					<div className="flex flex-col-reverse gap-2 sm:flex-row">
						<Button
							variant={isMobile ? "secondary" : "ghost"}
							className="me-auto w-full sm:w-fit"
							disabled={phase === "submitting"}
							onClick={() => {
								if (phase === "conflict") {
									setConflictingDates([])
									setConflictAction(null)
									setPhase("preview")
								} else {
									setOpen(false)
								}
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (phase === "conflict") {
									if (conflictAction === "override") doImport(conflictingDates)
									else doImport()
								} else {
									handleImportClick()
								}
							}}
							disabled={
								phase === "submitting" ||
								phase === "processing" ||
								phase === "checking" ||
								allRows.length === 0 ||
								(phase === "conflict" && conflictAction === null)
							}
							variant={conflictAction === "override" ? "destructive" : "default"}
						>
							{submitLabel}
						</Button>
					</div>
				</SheetFooter>
			</ResponsiveSheetContent>
		</ResponsiveSheet>
	)
}
