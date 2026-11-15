"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import "@/components/layered-figure.css"
import type { LayeredFigureData } from "@/lib/layered-figure"
import { cn } from "@/lib/utils"

type LayeredFigureViewProps = LayeredFigureData & {
	/** Keyboard-reachable list of layers below the figure. */
	legend?: boolean
	/** Caption with the active layer's title and description. */
	caption?: boolean
	initialActiveLayerId?: string | null
	onActiveChange?: (layerId: string | null) => void
	className?: string
}

/**
 * Exploded drawing with hoverable layers. Desktop pointers get the inline SVG,
 * other devices get the annotated image. Visuals are driven by `data-active` on the
 * root and `data-on` on the active layer's groups (see layered-figure.css).
 */
export function LayeredFigureView({
	title,
	svg,
	svgUrl,
	layers,
	fallback,
	legend = true,
	caption = true,
	initialActiveLayerId = null,
	onActiveChange,
	className,
}: LayeredFigureViewProps) {
	const rootRef = useRef<HTMLElement>(null)
	const [activeLayerId, setActiveLayerId] = useState<string | null>(initialActiveLayerId)
	const [fetchedSvg, setFetchedSvg] = useState<string | null>(null)
	const markup = svg ?? fetchedSvg

	// Large figures are not inlined. Only pointer devices fetch them, others keep the image.
	useEffect(() => {
		if (svg !== undefined || !window.matchMedia("(hover: hover) and (pointer: fine)").matches)
			return
		const controller = new AbortController()
		fetch(svgUrl, { signal: controller.signal })
			.then((response) => response.text())
			.then(setFetchedSvg)
			.catch(() => {})
		return () => controller.abort()
	}, [svg, svgUrl])

	function activate(layerId: string | null) {
		setActiveLayerId(layerId)
		onActiveChange?.(layerId)
	}

	// The SVG is injected markup React does not manage, so the active marker is set here.
	useEffect(() => {
		const groups = rootRef.current?.querySelectorAll<SVGGElement>("svg [data-layer]") ?? []
		for (const group of groups) {
			if (group.dataset.layer === activeLayerId) group.setAttribute("data-on", "")
			else group.removeAttribute("data-on")
		}
	}, [activeLayerId, markup])

	const activeLayer = layers.find((layer) => layer.id === activeLayerId)

	return (
		<figure
			ref={rootRef}
			className={cn("layered-figure", className)}
			data-active={activeLayerId ?? undefined}
			data-ready={markup ? "" : undefined}
		>
			<Image
				src={fallback.src}
				width={fallback.width}
				height={fallback.height}
				alt={title}
				sizes="(min-width: 768px) 720px, 100vw"
				className="layered-figure-fallback h-auto w-full dark:hue-rotate-180 dark:invert"
			/>
			<div className="layered-figure-interactive">
				<div
					className="layered-figure-svg"
					onPointerOver={(event) => {
						const group = (event.target as Element).closest<SVGGElement>(".lf-fills [data-layer]")
						if (group) activate(group.dataset.layer ?? null)
					}}
					onPointerLeave={() => activate(null)}
					dangerouslySetInnerHTML={{ __html: markup ?? "" }}
				/>
				{caption && (
					<figcaption className="layered-figure-caption" aria-live="polite">
						{activeLayer ? (
							<>
								<strong>{activeLayer.title}</strong>
								<span>{activeLayer.description}</span>
							</>
						) : (
							<span>Hover a layer to see what it does.</span>
						)}
					</figcaption>
				)}
				{legend && (
					<ul className="layered-figure-legend" aria-label={`${title} layers`}>
						{layers.map((layer) => (
							<li key={layer.id}>
								<button
									type="button"
									data-on={layer.id === activeLayerId ? "" : undefined}
									onPointerEnter={() => activate(layer.id)}
									onPointerLeave={() => activate(null)}
									onFocus={() => activate(layer.id)}
									onBlur={() => activate(null)}
								>
									{layer.title}
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</figure>
	)
}
