import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

interface ThemeProviderState {
	theme: Theme
	setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState>({
	theme: "system",
	setTheme: () => null,
})

const STORAGE_KEY = "ui-theme"

interface ThemeProviderProps {
	children: React.ReactNode
	defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = "system" }: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(
		() =>
			(typeof localStorage !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Theme) : null) ??
			defaultTheme,
	)

	useEffect(() => {
		const root = window.document.documentElement
		root.classList.remove("light", "dark")

		if (theme === "system") {
			const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
			root.classList.add(systemDark ? "dark" : "light")
		} else {
			root.classList.add(theme)
		}
	}, [theme])

	function handleSetTheme(theme: Theme) {
		localStorage.setItem(STORAGE_KEY, theme)
		setTheme(theme)
	}

	return (
		<ThemeProviderContext value={{ theme, setTheme: handleSetTheme }}>
			{children}
		</ThemeProviderContext>
	)
}

export function useTheme() {
	const context = useContext(ThemeProviderContext)
	if (!context) throw new Error("useTheme must be used within a ThemeProvider")
	return context
}
