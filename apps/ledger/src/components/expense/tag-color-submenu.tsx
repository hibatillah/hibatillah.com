import { PaletteIcon } from "lucide-react"
import { useTransition } from "react"

import {
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@packages/ui/components/dropdown-menu"
import { TAG_COLOR_OPTIONS } from "@/lib/tag-palette"
import { action } from "@/lib/utils"
import { updateTagColorFn } from "@/server/expenses"

interface Props {
	tagName: string
	currentColor: string
}

export function TagColorSubmenu({ tagName, currentColor }: Props) {
	const [, startTransition] = useTransition()

	function onValueChange(next: string | null) {
		if (next == null || next === currentColor) return
		startTransition(async () => {
			await action(
				"update-tag-color",
				async () => {
					await updateTagColorFn({ data: { tag: tagName, color: next } })
				},
				{ loading: "Updating color…", success: "Color updated" },
			)
		})
	}

	const value = TAG_COLOR_OPTIONS.some((o) => o.color === currentColor) ? currentColor : ""

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger className="gap-1.5">
				<PaletteIcon />
				Color
			</DropdownMenuSubTrigger>
			<DropdownMenuPortal>
				<DropdownMenuSubContent className="no-scrollbar w-32 overflow-y-auto p-1">
					<DropdownMenuRadioGroup value={value} onValueChange={(v) => onValueChange(v)}>
						{TAG_COLOR_OPTIONS.map(({ label, color }) => (
							<DropdownMenuRadioItem key={color} value={color} className="gap-2 ps-2">
								<span
									className="size-4 shrink-0 rounded border border-border"
									style={{ backgroundColor: color }}
									aria-hidden
								/>
								<span>{label}</span>
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuSubContent>
			</DropdownMenuPortal>
		</DropdownMenuSub>
	)
}
