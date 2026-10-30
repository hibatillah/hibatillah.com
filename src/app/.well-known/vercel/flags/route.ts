import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next"

import { aiProgrammerBetaFlag, eduSectionFlag, projectCardFlags, workSectionFlag } from "@/flags"

// Flags discovery endpoint for the Vercel Toolbar. Guarded by `FLAGS_SECRET`.
export const GET = createFlagsDiscoveryEndpoint(async () =>
	getProviderData({
		workSectionFlag,
		eduSectionFlag,
		aiProgrammerBetaFlag,
		...projectCardFlags,
	}),
)
