"use client"

import { Separator as SeparatorComponent } from "@packages/ui/components/separator"
import { useCopyToClipboard } from "@/hooks/use-copy-clipboard"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { cn, slugify } from "@packages/ui/lib/utils"
import { CopyIcon, LinkIcon, SquareCheckIcon } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@packages/ui/components/button"
import { Card, CardFooter, CardHeader } from "@packages/ui/components/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@packages/ui/components/tabs"

export function Wrapper({ children }: { children: React.ReactNode }) {
	return (
		<motion.article
			variants={staggerContainer}
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true }}
			className="typeset"
		>
			{children}
		</motion.article>
	)
}

export function Heading2({ className, children, ...props }: React.ComponentProps<"h2">) {
	const id = typeof children === "string" ? slugify(children) : undefined

	return (
		<motion.a
			href={id ? `#${id}` : undefined}
			variants={staggerItem}
			className={cn(
				"group/heading relative block w-fit no-underline focus-visible:outline-none",
				className,
			)}
		>
			<h2
				id={id}
				className="w-fit scroll-mt-12 rounded-sm group-focus-visible/heading:ring-3 group-focus-visible/heading:ring-ring/50"
				{...props}
			>
				{children}
			</h2>

			<LinkIcon className="invisible absolute top-1/2 -left-5 size-[14px] -translate-y-1/2 text-primary opacity-0 transition-all duration-100 ease-linear group-hover/heading:visible group-hover/heading:opacity-100 group-focus-visible/heading:visible group-focus-visible/heading:opacity-100 md:-left-6" />
		</motion.a>
	)
}

export function Heading3({ className, children, ...props }: React.ComponentProps<"h3">) {
	const id = typeof children === "string" ? slugify(children) : undefined

	return (
		<motion.a
			href={id ? `#${id}` : undefined}
			variants={staggerItem}
			className={cn(
				"group/heading relative block w-fit no-underline focus-visible:outline-none",
				className,
			)}
		>
			<h3
				id={id}
				className="w-fit scroll-mt-12 rounded-sm group-focus-visible/heading:ring-3 group-focus-visible/heading:ring-ring/50"
				{...props}
			>
				{children}
			</h3>

			<LinkIcon className="invisible absolute top-1/2 -left-5 size-[14px] -translate-y-1/2 text-primary opacity-0 transition-all duration-100 ease-linear group-hover/heading:visible group-hover/heading:opacity-100 group-focus-visible/heading:visible group-focus-visible/heading:opacity-100 md:-left-6" />
		</motion.a>
	)
}

export function Paragraph({ className, ...props }: React.ComponentProps<typeof motion.p>) {
	return (
		<motion.p variants={staggerItem} className={cn("text-foreground/70", className)} {...props} />
	)
}

export function Blockquote({
	className,
	...props
}: React.ComponentProps<typeof motion.blockquote>) {
	return (
		<motion.blockquote
			variants={staggerItem}
			className={cn("border-muted-foreground text-muted-foreground italic", className)}
			{...props}
		/>
	)
}

export function ListUnordered({ className, ...props }: React.ComponentProps<typeof motion.ul>) {
	return <motion.ul variants={staggerItem} className={className} {...props} />
}

export function ListOrdered({ className, ...props }: React.ComponentProps<typeof motion.ol>) {
	return <motion.ol variants={staggerItem} className={className} {...props} />
}

export function ListItem({ className, ...props }: React.ComponentProps<typeof motion.li>) {
	return (
		<motion.li
			variants={staggerItem}
			className={cn("marker:text-foreground", className)}
			{...props}
		/>
	)
}

export function TableRoot({ className, ...props }: React.ComponentProps<"table">) {
	return (
		<motion.div variants={staggerItem} className="typeset-scroll w-full">
			<table className={cn("w-full caption-bottom", className)} {...props} />
		</motion.div>
	)
}

export function TableHead({ className, ...props }: React.ComponentProps<typeof motion.thead>) {
	return <motion.thead variants={staggerItem} className={className} {...props} />
}

export function TableRow({ className, ...props }: React.ComponentProps<typeof motion.tr>) {
	return (
		<motion.tr
			variants={staggerItem}
			className={cn(
				"transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
				className,
			)}
			{...props}
		/>
	)
}

export function TableHeader({ className, ...props }: React.ComponentProps<typeof motion.th>) {
	return (
		<motion.th variants={staggerItem} className={cn("text-foreground", className)} {...props} />
	)
}

export function TableCell({ className, ...props }: React.ComponentProps<typeof motion.td>) {
	return (
		<motion.td variants={staggerItem} className={cn("text-foreground/70", className)} {...props} />
	)
}

export function Pre({ className, ...props }: React.ComponentProps<typeof motion.pre>) {
	return (
		<motion.pre
			variants={staggerItem}
			className={cn(
				"overflow-x-auto rounded-xl bg-card p-4 font-mono text-sm leading-relaxed font-normal max-lg:mx-4",
				className,
			)}
			{...props}
		/>
	)
}

export function Separator({ className, ...props }: React.ComponentProps<typeof motion.div>) {
	return (
		<motion.div variants={staggerItem} className={cn("my-4 px-4 md:px-12", className)} {...props}>
			<SeparatorComponent className="bg-muted-foreground/30" />
		</motion.div>
	)
}

export type PackageManger = "npm" | "pnpm" | "yarn" | "bun"

export function Snippet({ path }: { path: string }) {
	const [selected, setSelected] = useState<PackageManger>("npm")
	const [copy, isCopied] = useCopyToClipboard()

	const packageManagers = {
		npm: "npx shadcn@latest add",
		pnpm: "pnpm dlx shadcn@latest add",
		yarn: "yarn dlx shadcn@latest add",
		bun: "bunx --bun shadcn@latest add",
	} as Record<PackageManger, string>

	return (
		<Card className="not-typeset relative gap-0 p-0">
			<Tabs
				value={selected}
				onValueChange={(value) => setSelected(value as PackageManger)}
				className="gap-0"
			>
				<CardHeader className="p-2">
					<TabsList>
						<TabsTrigger value="npm">npm</TabsTrigger>
						<TabsTrigger value="pnpm">pnpm</TabsTrigger>
						<TabsTrigger value="yarn">yarn</TabsTrigger>
						<TabsTrigger value="bun">bun</TabsTrigger>
					</TabsList>
				</CardHeader>
				<CardFooter className="w-full overflow-x-auto p-4 pe-14 text-nowrap">
					{Object.entries(packageManagers).map(([key, value]) => (
						<TabsContent key={key} value={key}>
							<code className="font-mono text-sm">
								{value} {path}
							</code>
						</TabsContent>
					))}
					<Button
						size="icon-sm"
						variant="outline"
						className="absolute right-3 bottom-4 z-20 max-sm:bg-card! md:bottom-3"
						onClick={() =>
							copy(`${packageManagers[selected]} ${path}`).then(() =>
								toast.success("Copied to clipboard"),
							)
						}
					>
						{isCopied ? <SquareCheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
					</Button>
				</CardFooter>
			</Tabs>
		</Card>
	)
}
