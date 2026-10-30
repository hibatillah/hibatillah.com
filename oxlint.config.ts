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
	jsPlugins: ["@shadcn/lint"],
	rules: {
		"eslint/no-unused-vars": "warn",
		"typescript/no-deprecated": "warn",
		"jsdoc/check-tag-names": "warn",
		"shadcn/no-unknown-classes": "off",
		"shadcn/require-static-classes": "warn",
		"shadcn/no-arbitrary-values": "off",
		"shadcn/no-raw-colors": "warn",
		"shadcn/no-inline-styles": "warn",
		"shadcn/no-restyle": "off",
	},
	overrides: [
		{
			// Logos need their own colors and SVG style props
			files: ["src/components/ui/svgs/**"],
			rules: {
				"shadcn/no-raw-colors": "off",
				"shadcn/no-inline-styles": "off",
				"shadcn/no-arbitrary-values": "off",
				"shadcn/require-static-classes": "off",
			},
		},
		{
			// Frame transforms and Satori `tw` need arbitrary values
			files: ["src/components/image-frame.tsx", "src/lib/og.tsx"],
			rules: {
				"shadcn/no-arbitrary-values": "off",
			},
		},
	],
	ignorePatterns: ["node_modules/**", ".next/**", "public/**", "next-env.d.ts"],
})
