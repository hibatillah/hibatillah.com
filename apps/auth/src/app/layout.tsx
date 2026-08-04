import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
	title: "Sign in | hibatillah",
	robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="flex min-h-svh items-center justify-center p-4">{children}</body>
		</html>
	)
}
