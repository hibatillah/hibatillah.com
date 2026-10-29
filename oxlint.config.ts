import { defineConfig } from "oxlint"

export default defineConfig({
	categories: {
		correctness: "warn",
	},
	options: {
		typeAware: true,
		typeCheck: true,
	},
	plugins: ["nextjs", "import", "jsdoc", "react"],
	// @shadcn/lint is an alpha oxlint JS plugin; keep every rule at "warn" until findings are triaged
	jsPlugins: ["@shadcn/lint"],
	rules: {
		"eslint/no-unused-vars": "warn",
		"typescript/no-deprecated": "warn",
		"jsdoc/check-tag-names": "warn",
		"shadcn/no-unknown-classes": "warn",
		"shadcn/require-static-classes": "warn",
		"shadcn/no-arbitrary-values": "warn",
		"shadcn/no-raw-colors": "warn",
		"shadcn/no-inline-styles": "warn",
		"shadcn/no-restyle": "warn",
	},
	ignorePatterns: ["node_modules/**", ".next/**", "public/**", "next-env.d.ts"],
})
