"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card"

import { AuthButtons } from "@/components/auth-buttons"
import { safeRedirect } from "@/lib/safe-redirect"

function LoginCard() {
	const searchParams = useSearchParams()
	const redirect = safeRedirect(searchParams.get("redirect"))

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle>Sign in</CardTitle>
				<CardDescription>Sign in to continue.</CardDescription>
			</CardHeader>
			<CardContent>
				<AuthButtons redirect={redirect} />
			</CardContent>
		</Card>
	)
}

export default function LoginPage() {
	return (
		<Suspense>
			<LoginCard />
		</Suspense>
	)
}
