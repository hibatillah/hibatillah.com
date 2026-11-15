import type { MDXComponents } from "mdx/types"
import Image from "next/image"
import Link from "next/link"

import { Callout } from "@/components/callout"
import { GraphBoard } from "@/components/graph-board"
import { GraphCheck } from "@/components/graph-check"
import { GraphFlow } from "@/components/graph-flow"
import { GraphRank } from "@/components/graph-rank"
import { GraphSpec } from "@/components/graph-spec"
import { GraphTable } from "@/components/graph-table"
import { GraphTimeline } from "@/components/graph-timeline"
import { GraphTree } from "@/components/graph-tree"
import { Quote } from "@/components/quote"
import { Terminal } from "@/components/terminal"
import { GraphFrameProvider } from "@/components/ui/graph-frame"
import { withMdxcn } from "@/lib/mdx"

// Placeholder stand-ins so existing MDX still renders while the UI is rebuilt.
// Delete once every page stops using ImageFrame, ImageFrameGrid, and TextLink.
const components: MDXComponents = {
	// Every figure is borderless (DESIGN.md "Figures"); a figure's own `frame` prop still wins.
	// The wrapper div keeps the column spacing and scopes the list styles in globals.css to page text.
	wrapper: ({ children }: { children?: React.ReactNode }) => (
		<div className="mdx-content flex flex-col gap-6">
			<GraphFrameProvider frame="none">{children}</GraphFrameProvider>
		</div>
	),
	Image,
	ImageFrame: ({ children }: React.ComponentProps<"div">) => <div>{children}</div>,
	ImageFrameGrid: ({ children }: React.ComponentProps<"div">) => <div>{children}</div>,
	TextLink: ({ href, children }: React.ComponentProps<typeof Link>) => (
		<Link href={href}>{children}</Link>
	),

	// mdxcn figures; specs live in PORTFOLIO-PLAN.md section 8.
	Callout,
	GraphBoard,
	GraphCheck,
	GraphFlow,
	GraphRank,
	GraphSpec,
	GraphTable,
	GraphTimeline,
	GraphTree,
	Quote,
	Terminal,
}

// withMdxcn keeps figure parsing working when tags like li, table, and h3 are overridden later.
export function useMDXComponents(): MDXComponents {
	return withMdxcn(components)
}
