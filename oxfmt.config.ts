import { defineConfig } from "oxfmt"

export default defineConfig({
	semi: false,
	useTabs: true,
	bracketSameLine: false,
	sortTailwindcss: {
		stylesheet: "./src/app/globals.css",
		attributes: ["tw"],
		functions: ["cn", "cva"],
	},
	ignorePatterns: ["node_modules/**", ".next/**", "public/**", "bun.lock"],
})
