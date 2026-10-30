import { MetadataRoute } from "next"

import profile from "@/contents/profile.json"

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: profile.title,
		short_name: "Hibatillah",
		description: profile.description,
		start_url: "/",
		display: "browser",
		background_color: "#FCFCFC",
		theme_color: "#FCFCFC",
		icons: [
			{
				src: "/icon.png",
				sizes: "any",
				type: "image/png",
			},
		],
	}
}
