"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { EmailPasswordAuthForm } from "../../components/auth/email-password-auth-form";
import { getSafeNextPath } from "../../lib/auth-redirect";
import { authClient, getAuthErrorMessage } from "../../lib/auth-client";

function buildSignUpHref(nextPath: string) {
	return `/sign-up?next=${encodeURIComponent(nextPath)}`;
}

export default function SignInPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const nextPath = getSafeNextPath(searchParams.get("next"));

	return (
		<main className="mx-auto flex h-full w-full max-w-md items-center px-4 py-10 sm:px-6">
			<section className="w-full border bg-card p-6 text-card-foreground">
				<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
					Auth
				</p>
				<h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Continue to the operational workspace.
				</p>
				<div className="mt-6">
					<EmailPasswordAuthForm
						mode="sign-in"
						submitLabel="Sign in"
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

							router.push(nextPath);
						}}
					/>
				</div>
				<p className="mt-4 text-sm text-muted-foreground">
					Need an account?{" "}
					<Link className="underline" href={buildSignUpHref(nextPath)}>
						Sign up
					</Link>
				</p>
			</section>
		</main>
	);
}
