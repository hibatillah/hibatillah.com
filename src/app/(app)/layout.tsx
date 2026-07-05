import { TextLink } from "@/components/text-link"

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="container mx-auto flex min-h-svh w-full max-w-2xl flex-col py-12 max-md:px-6">
			<main className="flex flex-1 flex-col gap-6 md:gap-12">{children}</main>
			<footer className="mt-6 flex flex-col-reverse text-muted-foreground sm:flex-row sm:items-baseline sm:justify-between md:mt-12">
				<div className="flex items-center gap-1 text-sm">
					<TextLink
						href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
						underline="hover"
						external
					>
						CC BY-NC-SA 4.0
					</TextLink>
					© {new Date().getFullYear()}
				</div>
				<span className="font-calloveya text-4xl leading-tight font-medium select-none">
					Hibatillah
				</span>
			</footer>
		</div>
	)
}
