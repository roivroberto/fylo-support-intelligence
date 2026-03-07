"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { EmailPasswordAuthForm } from "../../components/auth/email-password-auth-form";
import { getSafeNextPath } from "../../lib/auth-redirect";
import { authClient, getAuthErrorMessage } from "../../lib/auth-client";

function buildSignInHref(nextPath: string): Route {
	return `/sign-in?next=${encodeURIComponent(nextPath)}` as Route;
}

export default function SignUpPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const nextPath = getSafeNextPath(searchParams.get("next"));

	return (
		<main className="mx-auto flex h-full w-full max-w-md items-center px-4 py-10 sm:px-6">
			<section className="w-full border bg-card p-6 text-card-foreground">
				<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
					Auth
				</p>
				<h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign up</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Create an account to access the operational workspace.
				</p>
				<div className="mt-6">
					<EmailPasswordAuthForm
						mode="sign-up"
						submitLabel="Create account"
						onSubmit={async ({ name, email, password }) => {
							const response = await authClient.signUp.email({
								name: name?.trim() || email,
								email,
								password,
							});

							if (response?.error) {
								throw new Error(
									getAuthErrorMessage(response, "Unable to create that account"),
								);
							}

							router.push(nextPath as Route);
						}}
					/>
				</div>
				<p className="mt-4 text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link className="underline" href={buildSignInHref(nextPath)}>
						Sign in
					</Link>
				</p>
			</section>
		</main>
	);
}
