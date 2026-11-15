import { readFile } from "node:fs/promises"
import path from "node:path"

export type LayeredFigureLayer = {
	id: string
	title: string
	description: string
	accent?: boolean
}

export type LayeredFigureData = {
	title: string
	/** `shape`: hover the drawing. `legend`: rows drive the drawing and the legend always shows. */
	mode?: "shape" | "legend"
	/** `lines`: other layers fade their linework. `group`: other layers fade as whole groups. */
	inactive?: "lines" | "group"
	/** Legend mode only: cycle through the layers while the figure is on screen. */
	autoplay?: boolean
	/** Small line under the legend. */
	note?: string
	/** Inline markup. Omitted for large figures, which load from `svgUrl` on desktop only. */
	svg?: string
	svgUrl: string
	layers: LayeredFigureLayer[]
	fallback: { src: string; width: number; height: number }
}

const FIGURES_DIRECTORY = path.join(process.cwd(), "public", "figures")

/** Figures above this size load on demand, so the page does not carry them twice (HTML and RSC payload). */
const INLINE_SVG_LIMIT_BYTES = 200_000

/** Reads width and height from a PNG header (bytes 16 to 24). */
function readPngSize(buffer: Buffer) {
	return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

/**
 * Loads one figure from `public/figures/<name>/`: `<name>.svg`, `<name>.layers.json`
 * and `<name>-annotated.png`. Throws when the SVG and the layers file disagree.
 */
export async function loadLayeredFigure(name: string): Promise<LayeredFigureData> {
	"use cache"

	const directory = path.join(FIGURES_DIRECTORY, name)
	const [svg, layersFile, fallbackImage] = await Promise.all([
		readFile(path.join(directory, `${name}.svg`), "utf8"),
		readFile(path.join(directory, `${name}.layers.json`), "utf8"),
		readFile(path.join(directory, `${name}-annotated.png`)),
	])
	const { layers, ...options } = JSON.parse(layersFile) as Omit<
		LayeredFigureData,
		"svg" | "svgUrl" | "fallback"
	>

	const svgLayerIds = new Set([...svg.matchAll(/data-layer="([^"]+)"/g)].map((match) => match[1]))
	const fileLayerIds = new Set(layers.map((layer) => layer.id))
	const mismatchedLayerIds = [
		...[...svgLayerIds].filter((layerId) => !fileLayerIds.has(layerId)),
		...[...fileLayerIds].filter((layerId) => !svgLayerIds.has(layerId)),
	]
	if (mismatchedLayerIds.length > 0) {
		throw new Error(
			`Figure "${name}": layer ids differ between svg and layers file: ${mismatchedLayerIds.join(", ")}`,
		)
	}

	return {
		...options,
		svg: svg.length > INLINE_SVG_LIMIT_BYTES ? undefined : svg,
		svgUrl: `/figures/${name}/${name}.svg`,
		layers,
		fallback: { src: `/figures/${name}/${name}-annotated.png`, ...readPngSize(fallbackImage) },
	}
}
