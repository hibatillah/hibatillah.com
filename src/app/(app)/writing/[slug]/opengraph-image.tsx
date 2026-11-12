import { getContentData } from "@/lib/contents"
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og"
import { Writing } from "@/lib/types"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: PageProps<"/writing/[slug]">) {
	const { slug } = await params
	const { data } = await getContentData<Writing>("writings", slug)

	return renderOgImage({
		eyebrow: "WRITING — HIBATILLAH HASANIN",
		title: data.title,
		description: data.description,
	})
}
