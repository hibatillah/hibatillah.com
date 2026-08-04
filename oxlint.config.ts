import { defineConfig } from "oxlint"

export default defineConfig({
	categories: {
		correctness: "warn",
	},
	rules: {
		"eslint/no-unused-vars": "warn",
		"typescript/no-deprecated": "warn",
		"jsdoc/check-tag-names": "warn",
	},
	plugins: ["nextjs", "import", "jsdoc"],
	ignorePatterns: ["**/node_modules/**", "**/.next/**", "**/public/**", "**/registry/**"],
})
