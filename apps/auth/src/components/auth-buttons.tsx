"use client"

import { useState } from "react"
import { Fingerprint } from "lucide-react"

import { Button } from "@packages/ui/components/button"

import { authClient } from "@/lib/auth-client"

/**
 * Google + passkey sign-in actions shared by the login and signup pages.
 *
 * `packages/auth`'s Better Auth config only wires up `socialProviders.google`
 * (with `disableSignUp: true`) and the `passkey` plugin (registration requires
 * an existing session, per Better Auth's default `requireSession: true`) — it
 * does NOT configure email/password. There is currently no self-serve path
 * that creates a brand-new account: Google rejects unknown users, and passkey
 * registration needs a session that a new visitor doesn't have. Both buttons
 * here call the *sign-in* APIs (not passkey registration), so `/login` and
 * `/signup` behave identically until the initial account is provisioned some
 * other way (out of scope for this task — see task-4-report.md).
 */
export function AuthButtons({ redirect }: { redirect: string }) {
	const [pending, setPending] = useState<"google" | "passkey" | null>(null)
	const [error, setError] = useState<string | null>(null)

	async function signInWithGoogle() {
		setError(null)
		setPending("google")
		await authClient.signIn.social({
			provider: "google",
			callbackURL: redirect,
		})
	}

	async function signInWithPasskey() {
		setError(null)
		setPending("passkey")
		const { error } = await authClient.signIn.passkey({ autoFill: false })
		setPending(null)
		if (error) {
			setError(error.message ?? "Passkey sign-in failed.")
			return
		}
		window.location.assign(redirect)
	}

	return (
		<div className="flex flex-col gap-2">
			<Button
				className="w-full"
				disabled={pending !== null}
				onClick={signInWithGoogle}
				variant="outline"
			>
				{pending === "google" ? "Redirecting…" : "Continue with Google"}
			</Button>
			<Button
				className="w-full"
				disabled={pending !== null}
				onClick={signInWithPasskey}
				variant="outline"
			>
				<Fingerprint data-icon="inline-start" />
				{pending === "passkey" ? "Waiting for passkey…" : "Continue with a passkey"}
			</Button>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</div>
	)
}
