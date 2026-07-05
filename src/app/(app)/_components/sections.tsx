import { ImageFrame, ImageFrameGrid } from "@/components/image-frame"
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item"
import { AI_PROGRAMMER_SLUG, aiProgrammerBetaFlag, isProjectVisible } from "@/flags"
import Image from "next/image"
import Link from "next/link"
import { educations, projects, works } from "./content"

export async function WorkSection({ ...props }: React.ComponentProps<"section">) {
	const showBeta = await aiProgrammerBetaFlag()
	const items = showBeta ? works : works.filter((work) => work.url !== AI_PROGRAMMER_SLUG)

	return (
		<section {...props}>
			<h2>Work</h2>
			<ItemGroup className="mx-[-13px] w-auto gap-4!">
				{items.map((item, key) => (
					<Item
						key={key}
						variant="default"
						role="listitem"
						className="group"
						render={<Link href={`/work/${item.url}`} />}
					>
						<ItemMedia>
							<ImageFrameGrid layout="stack">
								{item.images.map((image, i) => (
									<ImageFrame key={i} size="sm" offset={image.offsets} className="w-24">
										<Image
											src={image.src}
											alt={item.company}
											placeholder="blur"
											width={400}
											height={400}
										/>
									</ImageFrame>
								))}
							</ImageFrameGrid>
						</ItemMedia>
						<ItemContent className="ml-6">
							<ItemTitle className="line-clamp-1">{item.role}</ItemTitle>
							<ItemDescription>{item.company}</ItemDescription>
						</ItemContent>
						<ItemContent className="flex-none text-center">
							<ItemDescription className="font-mono text-xs tabular-nums">
								{item.year}
							</ItemDescription>
						</ItemContent>
					</Item>
				))}
			</ItemGroup>
		</section>
	)
}

export function EduSection({ ...props }: React.ComponentProps<"section">) {
	return (
		<section {...props}>
			<h2>Edu</h2>
			<ItemGroup className="mx-[-13px] w-auto gap-4!">
				{educations.map((item, key) => (
					<Item
						key={key}
						variant="default"
						role="listitem"
						className="group"
						render={<Link href={`/edu/${item.url}`} />}
					>
						<ItemMedia>
							<ImageFrameGrid layout="stack">
								{item.images.map((image, i) => (
									<ImageFrame key={i} size="sm" offset={image.offsets} className="w-24">
										<Image
											src={image.src}
											alt={item.campus}
											placeholder="blur"
											width={400}
											height={400}
										/>
									</ImageFrame>
								))}
							</ImageFrameGrid>
						</ItemMedia>
						<ItemContent className="ml-6">
							<ItemTitle className="line-clamp-1">{item.degree}</ItemTitle>
							<ItemDescription>{item.campus}</ItemDescription>
						</ItemContent>
						<ItemContent className="flex-none text-center">
							<ItemDescription className="font-mono text-xs tabular-nums">
								{item.year}
							</ItemDescription>
						</ItemContent>
					</Item>
				))}
			</ItemGroup>
		</section>
	)
}

export async function ProjectSection({ ...props }: React.ComponentProps<"section">) {
	const visibility = await Promise.all(projects.map((project) => isProjectVisible(project.url)))
	const items = projects.filter((_, index) => visibility[index])

	return (
		<section {...props}>
			<h2>Project</h2>
			<ItemGroup className="mx-[-13px] w-auto gap-4!">
				{items.map((item, key) => (
					<Item
						key={key}
						variant="default"
						role="listitem"
						className="group"
						render={<Link href={`/project/${item.url}`} />}
					>
						<ItemMedia>
							<ImageFrameGrid layout="stack">
								{item.images.map((image, i) => (
									<ImageFrame key={i} size="sm" offset={image.offsets} className="w-24">
										<Image
											src={image.src}
											alt={item.title}
											placeholder="blur"
											width={400}
											height={400}
											className="object-top"
										/>
									</ImageFrame>
								))}
							</ImageFrameGrid>
						</ItemMedia>
						<ItemContent className="ml-6">
							<ItemTitle className="line-clamp-1">{item.title}</ItemTitle>
							<ItemDescription>{item.description}</ItemDescription>
						</ItemContent>
						<ItemContent className="flex-none text-center">
							<ItemDescription className="font-mono text-xs tabular-nums">
								{item.year}
							</ItemDescription>
						</ItemContent>
					</Item>
				))}
			</ItemGroup>
		</section>
	)
}
