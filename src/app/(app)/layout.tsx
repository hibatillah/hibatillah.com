export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<main className="mx-auto flex min-h-svh max-w-[100rem] flex-col p-4 pr-1 lg:grid lg:grid-cols-[30rem_1fr]">
			<div className="flex flex-col gap-6 p-6">{children}</div>
			<div className="rounded-lg border bg-muted max-lg:hidden"></div>
		</main>
	)
}
