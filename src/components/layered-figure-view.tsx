"use client"

import { motion, useInView, useReducedMotion } from "motion/react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import "@/components/layered-figure.css"
import { fadeUp, graphTransition, graphViewport } from "@/lib/graph-motion"
import type { LayeredFigureData } from "@/lib/layered-figure"
import { cn } from "@/lib/utils"

const AUTOPLAY_INTERVAL_MS = 2600

/** Clearing waits this long, so moving between layers or onto the legend never flashes the idle caption. */
const CLEAR_DELAY_MS = 180

type LayeredFigureViewProps = LayeredFigureData & {
	/** Keyboard-reachable list of layers below the figure. Always on in legend mode. */
	legend?: boolean
	/** Caption with the active layer's title and description. Shape mode only. */
	caption?: boolean
	initialActiveLayerId?: string | null
	onActiveChange?: (layerId: string | null) => void
	className?: string
}

/**
 * Exploded drawing with highlightable layers. Desktop pointers get the inline SVG,
 * other devices get the annotated image. Visuals are driven by `data-active` on the
 * root and `data-on` on the active layer's groups (see layered-figure.css).
 */
export function LayeredFigureView({
	title,
	mode = "shape",
	inactive = "lines",
	autoplay = false,
	note,
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
	const reduceMotion = useReducedMotion()
	const isOnScreen = useInView(rootRef)
	const [activeLayerId, setActiveLayerId] = useState<string | null>(initialActiveLayerId)
	const [isHolding, setIsHolding] = useState(false)
	const [fetchedSvg, setFetchedSvg] = useState<string | null>(null)
	const markup = svg ?? fetchedSvg
	const isLegendMode = mode === "legend"
	const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

	function cancelClear() {
		if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
		clearTimerRef.current = null
	}

	function activate(layerId: string | null) {
		cancelClear()
		setActiveLayerId(layerId)
		onActiveChange?.(layerId)
	}

	function scheduleClear() {
		cancelClear()
		clearTimerRef.current = setTimeout(() => activate(null), CLEAR_DELAY_MS)
	}

	useEffect(() => cancelClear, [])

	// The SVG is injected markup React does not manage, so the active marker is set here.
	useEffect(() => {
		const groups = rootRef.current?.querySelectorAll<SVGGElement>("svg [data-layer]") ?? []
		for (const group of groups) {
			if (group.dataset.layer === activeLayerId) group.setAttribute("data-on", "")
			else group.removeAttribute("data-on")
		}
	}, [activeLayerId, markup])

	// Legend mode can walk through the layers on its own. Hover or focus on a row pauses it.
	useEffect(() => {
		if (!isLegendMode || !autoplay || !markup || !isOnScreen || isHolding || reduceMotion) return
		const timer = setInterval(() => {
			const currentIndex = layers.findIndex((layer) => layer.id === activeLayerId)
			setActiveLayerId(layers[(currentIndex + 1) % layers.length].id)
		}, AUTOPLAY_INTERVAL_MS)
		return () => clearInterval(timer)
	}, [isLegendMode, autoplay, markup, isOnScreen, isHolding, reduceMotion, layers, activeLayerId])

	const showLegend = isLegendMode || legend

	return (
		<motion.figure
			ref={rootRef}
			className={cn("layered-figure", className)}
			data-mode={mode}
			data-inactive={inactive}
			data-active={activeLayerId ?? undefined}
			data-ready={markup ? "" : undefined}
			variants={fadeUp(reduceMotion)}
			initial="hidden"
			whileInView="show"
			viewport={graphViewport}
			transition={graphTransition(reduceMotion)}
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
					onPointerOver={
						isLegendMode
							? undefined
							: (event) => {
									const group = (event.target as Element).closest<SVGGElement>(
										".lf-fills [data-layer]",
									)
									if (group) activate(group.dataset.layer ?? null)
								}
					}
					onPointerLeave={isLegendMode ? undefined : scheduleClear}
					dangerouslySetInnerHTML={{ __html: markup ?? "" }}
				/>
				{caption && !isLegendMode && (
					// Every caption sits in one grid cell, so the box is as tall as the longest text and never shifts.
					<figcaption className="layered-figure-caption" aria-live="polite">
						<span
							className="layered-figure-caption-item"
							data-on={activeLayerId === null ? "" : undefined}
							aria-hidden={activeLayerId !== null}
						>
							Hover a layer to see what it does.
						</span>
						{layers.map((layer) => (
							<span
								key={layer.id}
								className="layered-figure-caption-item"
								data-on={layer.id === activeLayerId ? "" : undefined}
								aria-hidden={layer.id !== activeLayerId}
							>
								<strong>{layer.title}</strong>
								<span>{layer.description}</span>
							</span>
						))}
					</figcaption>
				)}
			</div>
			{showLegend && (
				<ul className="layered-figure-legend" aria-label={`${title} layers`}>
					{layers.map((layer) => (
						<li key={layer.id}>
							<button
								type="button"
								data-on={layer.id === activeLayerId ? "" : undefined}
								onPointerEnter={() => {
									setIsHolding(true)
									activate(layer.id)
								}}
								onPointerLeave={() => {
									setIsHolding(false)
									if (!isLegendMode) scheduleClear()
								}}
								onFocus={() => {
									setIsHolding(true)
									activate(layer.id)
								}}
								onBlur={() => {
									setIsHolding(false)
									if (!isLegendMode) scheduleClear()
								}}
							>
								<strong>{layer.title}</strong>
								{isLegendMode && <span>{layer.description}</span>}
							</button>
						</li>
					))}
				</ul>
			)}
			{isLegendMode && note && <p className="layered-figure-note">{note}</p>}
		</motion.figure>
	)
}
