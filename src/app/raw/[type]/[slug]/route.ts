import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { isProjectVisible } from "@/flags"
import { ContentCategory } from "@/lib/types"

// URL segment → content directory. Reached via the `*.md` rewrites in next.config.ts.
const TYPE_TO_CATEGORY: Record<string, ContentCategory> = {
	project: "projects",
	work: "work",
	edu: "edu",
}

// Serves raw MDX (frontmatter + prose, imports stripped) as text/markdown for agents.
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ type: string; slug: string }> },
) {
	const { type, slug } = await params
	const category = TYPE_TO_CATEGORY[type]

	if (!category) {
		return new Response("Not found", { status: 404 })
	}

	// A flag-hidden project is unreachable in every form, including its `.md`.
	if (type === "project" && !(await isProjectVisible(slug))) {
		return new Response("Not found", { status: 404 })
	}

	let raw: string
	try {
		raw = await readFile(join(process.cwd(), "src/contents", category, `${slug}.mdx`), "utf-8")
	} catch {
		return new Response("Not found", { status: 404 })
	}

	const markdown = raw
		.replace(/^import .*$/gm, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim()

	return new Response(markdown, {
		headers: {
			"content-type": "text/markdown; charset=utf-8",
			"cache-control": "public, max-age=3600, s-maxage=86400",
			vary: "Accept",
		},
	})
}
