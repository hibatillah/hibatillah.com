import { useForm } from "@tanstack/react-form"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { useEffect } from "react"
import { z } from "zod"

import { Button } from "@packages/ui/components/button"
import { Calendar } from "@packages/ui/components/calendar"
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@packages/ui/components/popover"
import {
	ResponsiveDialog,
	ResponsiveDialogClose,
	ResponsiveDialogContent,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@packages/ui/components/responsive-dialog"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select"
import { formatValidatorIssue } from "@/lib/form-errors"
import { action, capitalize } from "@/lib/utils"
import { updateExpenseFn } from "@/server/expenses"

function toExpenseFormDate(raw: string): string {
	const head = raw.slice(0, 10)
	return /^\d{4}-\d{2}-\d{2}$/.test(head) ? head : raw
}

/** If `raw` is ISO datetime, return the suffix from `T` (e.g. `T14:30:00`); else `""`. */
function timeSuffixFromExpenseDate(raw: string): string {
	const i = raw.indexOf("T")
	if (i === -1) return ""
	return raw.slice(i)
}

function mergeCalendarDateWithOriginalTime(yyyyMmDd: string, timeSuffix: string): string {
	return timeSuffix ? `${yyyyMmDd}${timeSuffix}` : yyyyMmDd
}

const schema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
	amount: z.number().int().positive("Must be positive"),
	tag: z.string().min(1, "Select a tag"),
})

export interface Expense {
	id: number
	date: string
	amount: number
	tag: string
	createdAt: string
}

interface Props {
	expense: Expense
	tags: string[]
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditExpenseDialog({ expense, tags, open, onOpenChange }: Props) {
	const form = useForm({
		defaultValues: {
			date: toExpenseFormDate(expense.date),
			amount: expense.amount,
			tag: expense.tag,
		},
		validators: { onSubmit: schema },
		onSubmit: async ({ value }) => {
			const timeSuffix = timeSuffixFromExpenseDate(expense.date)
			const dateToStore = mergeCalendarDateWithOriginalTime(value.date, timeSuffix)
			await action(
				"edit-expense",
				async () => {
					await updateExpenseFn({
						data: {
							id: expense.id,
							date: dateToStore,
							amount: value.amount,
							tag: value.tag,
						},
					})

					onOpenChange(false)
				},
				{ loading: "Saving expense…", success: "Expense updated" },
			)
		},
	})

	useEffect(() => {
		if (!open) form.reset()
	}, [open, form])

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Edit expense</ResponsiveDialogTitle>
				</ResponsiveDialogHeader>

				<form
					id="edit-expense-form"
					className="flex flex-col gap-4 py-4"
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<form.Field name="date">
						{(field) => (
							<Field>
								<FieldLabel>Date</FieldLabel>
								<Popover>
									<PopoverTrigger
										render={
											<Button
												variant="secondary"
												type="button"
												className="w-full justify-start border border-input"
											>
												<CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
												{field.state.value ? (
													format(parseISO(field.state.value.slice(0, 10)), "PPP", { locale: id })
												) : (
													<span className="text-muted-foreground">Pick a date</span>
												)}
											</Button>
										}
									/>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={
												field.state.value ? parseISO(field.state.value.slice(0, 10)) : undefined
											}
											onSelect={(date) => {
												if (date) field.handleChange(format(date, "yyyy-MM-dd"))
											}}
											captionLayout="dropdown"
										/>
									</PopoverContent>
								</Popover>
								{field.state.meta.errors.length > 0 && (
									<FieldError
										errors={field.state.meta.errors.map((e) => ({
											message: formatValidatorIssue(e),
										}))}
									/>
								)}
							</Field>
						)}
					</form.Field>

					<form.Field name="amount">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Amount</FieldLabel>
								<Input
									id={field.name}
									type="number"
									value={field.state.value}
									onChange={(e) => field.handleChange(Number(e.target.value))}
									onBlur={field.handleBlur}
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError
										errors={field.state.meta.errors.map((e) => ({
											message: formatValidatorIssue(e),
										}))}
									/>
								)}
							</Field>
						)}
					</form.Field>

					<form.Field name="tag">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Tag</FieldLabel>
								<Select
									value={field.state.value}
									onValueChange={(v) => {
										if (!v) return
										field.handleChange(v)
									}}
								>
									<SelectTrigger id={field.name} className="w-full">
										<SelectValue placeholder="Select tag" />
									</SelectTrigger>
									<SelectContent>
										{tags.map((tag) => (
											<SelectItem key={tag} value={tag}>
												{capitalize(tag)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{field.state.meta.errors.length > 0 && (
									<FieldError
										errors={field.state.meta.errors.map((e) => ({
											message: formatValidatorIssue(e),
										}))}
									/>
								)}
							</Field>
						)}
					</form.Field>
				</form>

				<ResponsiveDialogFooter>
					<ResponsiveDialogClose asChild>
						<Button variant="ghost">Cancel</Button>
					</ResponsiveDialogClose>
					<form.Subscribe selector={(s) => s.isSubmitting}>
						{(isSubmitting) => (
							<Button type="submit" form="edit-expense-form" disabled={isSubmitting}>
								Save
							</Button>
						)}
					</form.Subscribe>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}
