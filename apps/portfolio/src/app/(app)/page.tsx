import { DetailTransition } from "@/components/detail-transition"

/** Default detail panel. `data-home` tells the layout this is the home route (see layout.tsx). */
export default function Page() {
	return (
		<DetailTransition routeKey="home">
			<div data-home />
		</DetailTransition>
	)
}
