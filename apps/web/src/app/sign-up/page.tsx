"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { LandingAuthForm } from "../../components/auth/landing-auth-form";
import { authClient, getAuthErrorMessage } from "../../lib/auth-client";
import { getSafeNextPath } from "../../lib/auth-redirect";

import "../landing.css";

import type { Route } from "next";

function SignUpContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const nextPath = getSafeNextPath(searchParams.get("next"));

	const [step, setStep] = useState<"sign-up" | "role-select">("sign-up");

	return (
		<div
			className="landing-page min-h-0 h-full flex items-center justify-center pt-24 px-6 pb-6 overflow-auto"
			suppressHydrationWarning
		>
			<div className="grain" />
			<main className="w-full max-w-5xl flex flex-col min-h-full justify-center">
				{step === "sign-up" && (
					<div className="flex flex-col max-w-2xl mx-auto justify-center min-h-0 pt-8 step-container active">
						<div className="mb-10">
							<span className="mono text-[10px] opacity-40">AUTH</span>
							<h2 className="text-4xl font-black italic mt-2">SIGN UP</h2>
						</div>

						<LandingAuthForm
							mode="sign-up"
							submitLabel="Create account"
							onSuccess={() => setStep("role-select")}
							onSubmit={async ({ name, email, password }) => {
								const response = await authClient.signUp.email({
									name: name?.trim() || email,
									email,
									password,
								});

								if (response?.error) {
									throw new Error(
										getAuthErrorMessage(
											response,
											"Unable to create that account",
										),
									);
								}
							}}
						/>

						<p className="mt-6 text-center text-accent/50 text-sm">
							Already have an account?{" "}
							<Link
								href={`/sign-in?next=${encodeURIComponent(nextPath)}` as Route}
								className="underline opacity-80 hover:opacity-100 transition-opacity"
							>
								Click here
							</Link>
						</p>
					</div>
				)}

				{step === "role-select" && (
					<div className="flex flex-col step-container active">
						<h1 className="text-5xl font-extrabold mb-12 tracking-tighter embossed-text text-center italic">
							Choose your role
						</h1>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div
								onClick={() => router.push((nextPath || "/visibility") as Route)}
								className="vellum-card p-12 cursor-pointer group"
							>
								<div className="mono text-[10px] opacity-30 mb-4">
									TYPE: ARCHITECT
								</div>
								<h2 className="text-3xl font-bold mb-2 group-hover:translate-x-2 transition-transform">
									I am a Team Lead
								</h2>
								<p className="text-accent/50 text-sm leading-relaxed mb-8">
									Set up your pod and routing rules. Design the workflow
									infrastructure for your unit.
								</p>
								<div className="h-[1px] w-full bg-white/10 group-hover:bg-white/40 transition-colors" />
							</div>

							<div
								onClick={() => router.push((nextPath || "/visibility") as Route)}
								className="vellum-card p-12 cursor-pointer group"
							>
								<div className="mono text-[10px] opacity-30 mb-4">
									TYPE: SPECIALIST
								</div>
								<h2 className="text-3xl font-bold mb-2 group-hover:translate-x-2 transition-transform">
									I am a Team Member
								</h2>
								<p className="text-accent/50 text-sm leading-relaxed mb-8">
									Join your team and view your queue. Sync your skills with the
									pod logic.
								</p>
								<div className="h-[1px] w-full bg-white/10 group-hover:bg-white/40 transition-colors" />
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

export default function SignUpPage() {
	return (
		<Suspense
			fallback={
				<div className="landing-page min-h-0 h-full flex items-center justify-center pt-24 px-6 pb-6">
					<p className="text-sm text-accent/50">Loading...</p>
				</div>
			}
		>
			<SignUpContent />
		</Suspense>
	);
}
