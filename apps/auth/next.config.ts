import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	reactCompiler: true,
	// @packages/ui and @packages/auth ship TS source, not prebuilt JS.
	transpilePackages: ["@packages/ui", "@packages/auth"],
}

export default nextConfig
