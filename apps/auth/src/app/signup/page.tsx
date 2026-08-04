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

// Deliberately unlinked: no nav link, no "create an account" link from
// /login. See `AuthButtons` doc comment — under the current `packages/auth`
// config this offers the same sign-in methods as /login, not a distinct
// account-creation flow.
function SignupCard() {
	const searchParams = useSearchParams()
	const redirect = safeRedirect(searchParams.get("redirect"))

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle>Create an account</CardTitle>
				<CardDescription>Set up access to continue.</CardDescription>
			</CardHeader>
			<CardContent>
				<AuthButtons redirect={redirect} />
			</CardContent>
		</Card>
	)
}

export default function SignupPage() {
	return (
		<Suspense>
			<SignupCard />
		</Suspense>
	)
}
