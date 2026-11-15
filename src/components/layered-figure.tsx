import { LayeredFigureView } from "@/components/layered-figure-view"
import { loadLayeredFigure } from "@/lib/layered-figure"

type LayeredFigureProps = {
	/** Folder name under `public/figures/`. */
	name: string
	/** Keyboard-reachable list of layers below the figure. */
	legend?: boolean
	className?: string
}

/** MDX tag: `<LayeredFigure name="audit" />`. Adding a figure needs only its asset folder. */
export async function LayeredFigure({ name, legend = true, className }: LayeredFigureProps) {
	const figure = await loadLayeredFigure(name)
	return <LayeredFigureView {...figure} legend={legend} className={className} />
}
