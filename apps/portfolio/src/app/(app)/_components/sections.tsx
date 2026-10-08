import { NavItemLink } from "@/components/nav-item-link"
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@packages/ui/components/item"
import { AI_PROGRAMMER_SLUG, aiProgrammerBetaFlag, isProjectVisible } from "@/flags"
import { educations, projects, works } from "./content"

interface ListItem {
	href: string
	title: string
	year: string
}

function SectionList({
	heading,
	items,
	...props
}: React.ComponentProps<"section"> & {
	heading: string
	items: ListItem[]
}) {
	return (
		<section {...props}>
			<h2>{heading}</h2>
			<ItemGroup className="mx-[-8px] w-auto gap-0!">
				{items.map((item) => (
					<Item
						key={item.href}
						variant="default"
						role="listitem"
						className="group px-2 py-1 aria-[current=page]:bg-muted"
						render={<NavItemLink href={item.href} />}
					>
						<ItemContent className="min-w-0">
							<ItemTitle className="line-clamp-1 text-xs font-normal">{item.title}</ItemTitle>
						</ItemContent>
						<ItemDescription className="flex-none font-mono text-[9px] tabular-nums">
							{item.year}
						</ItemDescription>
					</Item>
				))}
			</ItemGroup>
		</section>
	)
}

export async function WorkSection({ ...props }: React.ComponentProps<"section">) {
	const showBeta = await aiProgrammerBetaFlag()
	const visibleWorks = showBeta ? works : works.filter((work) => work.url !== AI_PROGRAMMER_SLUG)

	return (
		<SectionList
			heading="Work"
			items={visibleWorks.map((work) => ({
				href: `/work/${work.url}`,
				title: work.role,
				year: work.year,
			}))}
			{...props}
		/>
	)
}

export function EduSection({ ...props }: React.ComponentProps<"section">) {
	return (
		<SectionList
			heading="Edu"
			items={educations.map((education) => ({
				href: `/edu/${education.url}`,
				title: education.degree,
				year: education.year,
			}))}
			{...props}
		/>
	)
}

export async function ProjectSection({ ...props }: React.ComponentProps<"section">) {
	const visibility = await Promise.all(projects.map((project) => isProjectVisible(project.url)))
	const visibleProjects = projects.filter((_, index) => visibility[index])

	return (
		<SectionList
			heading="Project"
			items={visibleProjects.map((project) => ({
				href: `/project/${project.url}`,
				title: project.title,
				year: project.year,
			}))}
			{...props}
		/>
	)
}
