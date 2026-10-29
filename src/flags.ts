import { get } from "@vercel/global-config"
import { flag } from "flags/next"
import { cacheLife, cacheTag } from "next/cache"

/**
 * Cached read of a boolean in Global Config. Rendering reads flags through this (never `flag()`),
 * because `flag()` reads request headers and would make every page dynamic under Cache Components.
 */
async function readGlobalConfigBoolean(key: string, fallback: boolean): Promise<boolean> {
	"use cache"
	cacheLife("minutes")
	cacheTag("global-config")

	try {
		const value = await get<boolean>(key)
		return typeof value === "boolean" ? value : fallback
	} catch {
		return fallback
	}
}

export const workSectionFlag = flag<boolean>({
	key: "show-work-section",
	description: "Show the Work section on the homepage",
	defaultValue: true,
	decide: () => readGlobalConfigBoolean("show-work-section", true),
})

export const eduSectionFlag = flag<boolean>({
	key: "show-edu-section",
	description: "Show the Edu section on the homepage",
	defaultValue: true,
	decide: () => readGlobalConfigBoolean("show-edu-section", true),
})

export const aiProgrammerBetaFlag = flag<boolean>({
	key: "beta-ai-programmer-onesia",
	description: "Beta: show the AI Programmer @ Onesia entry in the Work list",
	defaultValue: true,
	decide: () => readGlobalConfigBoolean("beta-ai-programmer-onesia", true),
})

export const isWorkSectionVisible = () => readGlobalConfigBoolean("show-work-section", true)
export const isEduSectionVisible = () => readGlobalConfigBoolean("show-edu-section", true)
export const isAiProgrammerBetaVisible = () =>
	readGlobalConfigBoolean("beta-ai-programmer-onesia", true)

/** Slug of the beta-gated work entry, so the Work section can filter it out. */
export const AI_PROGRAMMER_SLUG = "ai-programmer-onesia"

/**
 * Every project by slug, including ones not surfaced on the homepage.
 * One flag per project gates BOTH its homepage card and its detail page.
 */
const PROJECT_TITLES: Record<string, string> = {
	"furaya-hotel-management": "Furaya Hotel Management",
	"klc-room": "KLC Room",
	"yemeni-music-classification": "Yemeni Music Classification",
	massbeat: "MassBeat",
	"ekolog-app": "Ekolog App",
	"indogrosir-scm": "Indogrosir Supply Chain System Case Study",
	"rice-type-color": "Rice Identification based on Color",
	"rotte-scm": "Rotte Bakery Supply Chain System Case Study",
}

/** One flag per project, keyed by slug (`show-project-<slug>`). */
export const projectCardFlags = Object.fromEntries(
	Object.entries(PROJECT_TITLES).map(([slug, title]) => [
		slug,
		flag<boolean>({
			key: `show-project-${slug}`,
			description: `Show "${title}" (homepage card + detail page)`,
			defaultValue: true,
			decide: () => readGlobalConfigBoolean(`show-project-${slug}`, true),
		}),
	]),
) as Record<string, ReturnType<typeof flag<boolean>>>

/**
 * Whether a project is visible, covering both its homepage card and its detail
 * page. Unknown slugs (no flag declared) default to visible. Toolbar overrides do not apply here.
 */
export async function isProjectVisible(slug: string): Promise<boolean> {
	return slug in PROJECT_TITLES ? readGlobalConfigBoolean(`show-project-${slug}`, true) : true
}
