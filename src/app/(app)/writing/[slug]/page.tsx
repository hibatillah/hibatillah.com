import { Metadata } from "next"

import { BreadcrumbJsonLd } from "@/components/json-ld"
import profile from "@/contents/profile.json"
import { getContentByCategory, getContentData } from "@/lib/contents"
import { Writing } from "@/lib/types"

export async function generateStaticParams() {
	const items = await getContentByCategory<Writing>("writings")
	return items.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({
	params,
}: PageProps<"/writing/[slug]">): Promise<Metadata> {
	const { slug } = await params
	const { data } = await getContentData<Writing>("writings", slug)

	return {
		title: data.title,
		description: data.description,
		alternates: {
			canonical: `/writing/${slug}`,
			types: { "text/markdown": `/writing/${slug}.md` },
		},
		openGraph: {
			title: data.title,
			description: data.description,
			siteName: profile.title,
			url: `/writing/${slug}`,
			type: "article",
		},
		twitter: {
			card: "summary_large_image",
			title: data.title,
			description: data.description,
			creator: profile.twitterHandle,
		},
	}
}

export default async function Page({ params }: PageProps<"/writing/[slug]">) {
	const { slug } = await params
	const { Content, data } = await getContentData<Writing>("writings", slug)

	return (
		<>
			<BreadcrumbJsonLd
				items={[
					{ name: "Home", path: "/" },
					{ name: data.title, path: `/writing/${slug}` },
				]}
			/>
			<h1 className="text-base font-medium">{data.title}</h1>
			<p>{data.date}</p>
			<Content />
		</>
	)
}
