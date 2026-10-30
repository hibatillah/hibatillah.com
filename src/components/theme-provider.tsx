"use client"

import { ThemeProvider as NextThemesProvider } from "@ecosy/next-themes"
import * as React from "react"

export function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
