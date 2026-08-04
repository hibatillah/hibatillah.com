import { defineConfig } from "oxfmt"

export default defineConfig({
	bracketSameLine: false,
	semi: false,
	useTabs: true,
	experimentalTailwindcss: {
		stylesheet: "./apps/portfolio/src/app/globals.css",
		attributes: ["className", "tw"],
		functions: ["cn", "cva"],
	},
	ignorePatterns: ["**/node_modules/**", "**/.next/**", "**/public/**", "**/registry/**"],
})
