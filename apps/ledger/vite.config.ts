import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	plugins: [
		devtools(),
		viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackStart(),
		nitro({ config: { preset: "vercel" } }),
		viteReact(),
	],
	build: {
		// The builtin dynamic-import-vars plugin scans every module for
		// `import(...)` calls and chokes on unrelated `import(...)` text inside
		// a vendored dependency's JSDoc comment. We never use variable dynamic
		// imports, so scope the plugin to our own source instead.
		dynamicImportVarsOptions: {
			exclude: [/node_modules/, /[\\/]\.nitro[\\/]/],
		},
	},
	ssr: {
		// papaparse embeds its web-worker source as a huge string constant.
		// Nitro's SSR rebundling pass chokes trying to re-parse that string
		// (a bug in the current nitro/rolldown combo, unrelated to our code).
		// papaparse is only ever used client-side (see upload-csv-sheet.tsx),
		// so keep it out of the server bundle entirely.
		external: ["papaparse"],
	},
})
