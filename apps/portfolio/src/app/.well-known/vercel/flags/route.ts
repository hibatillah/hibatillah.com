import { aiProgrammerBetaFlag, eduSectionFlag, projectCardFlags, workSectionFlag } from "@/flags"
import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next"

// Flags discovery endpoint for the Vercel Toolbar. Guarded by `FLAGS_SECRET`.
export const GET = createFlagsDiscoveryEndpoint(async () =>
	getProviderData({
		workSectionFlag,
		eduSectionFlag,
		aiProgrammerBetaFlag,
		...projectCardFlags,
	}),
)
