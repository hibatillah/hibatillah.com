import { TextLink } from "@/components/text-link"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { MasterPanel } from "./_components/master-panel"

/**
 * Master–detail shell. Desktop: wide grid (max 96rem), persistent master panel (1/3 at lg, 1/4 at xl) +
 * route content (2/3 → 3/4) inside an inset gray card.
 * Mobile: the home page (marked `data-home`) shows only the master panel; every
 * other route shows only its content. Pure CSS via `:has()`, no pathname checks.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="group/portfolio mx-auto grid min-h-svh w-full max-w-3xl max-md:px-4 lg:max-w-[96rem] lg:grid-cols-3 xl:grid-cols-4">
			<aside
				style={{ viewTransitionName: "master-panel" }}
				className="flex-col py-12 max-lg:hidden max-lg:group-has-[[data-home]]/portfolio:flex lg:sticky lg:top-0 lg:col-span-1 lg:scrollbar-hide lg:flex lg:h-svh lg:overflow-y-auto lg:px-10"
			>
				<div className="flex flex-1 flex-col gap-4 text-xs [&_h1]:text-sm [&_h2]:text-[9px] [&_p]:text-xs [&_section]:space-y-1.5">
					<MasterPanel />
				</div>
				<footer className="mt-6 flex flex-col-reverse gap-1 text-muted-foreground md:mt-10">
					<div className="flex items-center gap-1 text-xs">
						<TextLink
							href="https://creativecommons.org/licenses/by/4.0/"
							underline="hover"
							external
						>
							CC BY 4.0
						</TextLink>
						© {new Date().getFullYear()}
					</div>
					<span className="font-calloveya text-3xl leading-tight font-medium select-none">
						Hibatillah
					</span>
				</footer>
			</aside>

			<main className="flex flex-col gap-6 py-12 max-lg:group-has-[[data-home]]/portfolio:hidden lg:col-span-2 lg:py-3 lg:pr-3 xl:col-span-3">
				<Link
					href="/"
					className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden"
				>
					<ArrowLeftIcon className="size-4 stroke-[1.5]" />
					Back
				</Link>
				<div className="lg:min-h-[calc(100svh-1.5rem)] lg:rounded-3xl lg:border lg:bg-muted/40 lg:bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] lg:bg-size-[16px_16px] lg:px-12 lg:py-16">
					<div className="mx-auto w-full max-w-2xl">{children}</div>
				</div>
			</main>
		</div>
	)
}
