const PALETTE = [
	"oklch(0.72 0.17 145)",
	"oklch(0.62 0.18 250)",
	"oklch(0.68 0.19 310)",
	"oklch(0.72 0.18 50)",
	"oklch(0.65 0.20 20)",
	"oklch(0.60 0.14 65)",
	"oklch(0.75 0.16 175)",
	"oklch(0.60 0.10 220)",
	"oklch(0.65 0.05 270)",
	"oklch(0.70 0.19 330)",
	"oklch(0.68 0.17 100)",
	"oklch(0.63 0.18 195)",
	"oklch(0.67 0.16 15)",
	"oklch(0.73 0.15 130)",
	"oklch(0.61 0.17 285)",
	"oklch(0.69 0.16 355)",
	"oklch(0.64 0.19 230)",
	"oklch(0.71 0.14 80)",
	"oklch(0.66 0.18 165)",
	"oklch(0.62 0.15 345)",
]

export function pickColor(): string {
	return PALETTE[Math.floor(Math.random() * PALETTE.length)]!
}
