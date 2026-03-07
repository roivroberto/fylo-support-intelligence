"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { LandingAuthForm } from "../../components/auth/landing-auth-form";
import { getSafeNextPath } from "../../lib/auth-redirect";
import { authClient, getAuthErrorMessage } from "../../lib/auth-client";

import "../landing.css";

import type { Route } from "next";

function buildSignUpHref(nextPath: string): Route {
	return `/sign-up?next=${encodeURIComponent(nextPath)}` as Route;
}

function SignInContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const nextPath = getSafeNextPath(searchParams.get("next"));

	return (
		<div
			className="landing-page min-h-0 h-full flex items-center justify-center pt-24 px-6 pb-6 overflow-auto"
			suppressHydrationWarning
		>
			<div className="grain" />
			<main className="w-full max-w-5xl flex flex-col min-h-full justify-center">
				<div className="flex flex-col max-w-2xl mx-auto justify-center min-h-0 pt-8">
					<div className="mb-10">
						<span className="mono text-[10px] opacity-40">AUTH</span>
						<h2 className="text-4xl font-black italic mt-2">SIGN IN</h2>
					</div>

					<LandingAuthForm
						mode="sign-in"
						submitLabel="Sign in"
						onSuccess={() => router.push(nextPath as Route)}
						onSubmit={async ({ email, password }) => {
							const response = await authClient.signIn.email({
								email,
								password,
							});

							if (response?.error) {
								throw new Error(
									getAuthErrorMessage(response, "Unable to sign in with that account"),
								);
							}
						}}
					/>

					<p className="mt-6 text-center text-accent/50 text-sm">
						Need an account?{" "}
						<Link
							href={buildSignUpHref(nextPath)}
							className="underline opacity-80 hover:opacity-100 transition-opacity"
						>
							Click here
						</Link>
					</p> 	
				</div>
			</main>
		</div>
	);
}

export default function SignInPage() {
	return (
		<Suspense
			fallback={
				<div className="landing-page min-h-0 h-full flex items-center justify-center pt-24 px-6 pb-6">
					<p className="text-sm text-accent/50">Loading...</p>
				</div>
			}
		>
			<SignInContent />
		</Suspense>
	);
}
