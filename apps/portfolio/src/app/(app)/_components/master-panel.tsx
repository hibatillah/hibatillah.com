import { Header } from "@/components/header"
import { TextLink } from "@/components/text-link"
import { eduSectionFlag, workSectionFlag } from "@/flags"
import { EduSection, ProjectSection, WorkSection } from "./sections"

/** Persistent left panel: intro, brief, and the work/edu/project lists. */
export async function MasterPanel() {
	const [showWork, showEdu] = await Promise.all([workSectionFlag(), eduSectionFlag()])

	return (
		<>
			<Header heading="M. Hibatillah Hasanin" description="Fullstack Web Developer" />

			<section>
				<h2>Brief</h2>
				<article>
					<p>
						Indonesia-based dev focused on TypeScript, React, and Next.js. Also Laravel and Python.
					</p>
					<p>Currently AI Programmer at Onesia.</p>
				</article>
			</section>

			{showWork && <WorkSection />}
			{showEdu && <EduSection />}
			<ProjectSection />

			<section>
				<h2>More</h2>
				<article>
					<p>
						Connect on{" "}
						<TextLink href="https://linkedin.com/in/hibatillahhabib" underline="hover" external>
							LinkedIn
						</TextLink>
						, see my work on{" "}
						<TextLink href="https://github.com/hibatillah" underline="hover" external>
							GitHub
						</TextLink>
						, or get updates on{" "}
						<TextLink href="https://x.com/hibatillahhabib" underline="hover" external>
							X
						</TextLink>
						.
					</p>
				</article>
			</section>
		</>
	)
}
