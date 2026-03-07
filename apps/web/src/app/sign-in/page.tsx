"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { EmailPasswordAuthForm } from "../../components/auth/email-password-auth-form";
import { getSafeNextPath } from "../../lib/auth-redirect";
import { authClient, getAuthErrorMessage } from "../../lib/auth-client";
import "../auth.css";

function buildSignUpHref(nextPath: string): Route {
	return `/sign-up?next=${encodeURIComponent(nextPath)}` as Route;
}

// ── Agent perspective panel ──
function AgentPanel() {
	const myTickets = [
		{
			id: "T-1043",
			subject: "API timeout on batch endpoint",
			skill: "Technical",
			confidence: 88,
			reason: "Matched skill: API & Backend",
		},
		{
			id: "T-1046",
			subject: "Webhook not firing on prod",
			skill: "Technical",
			confidence: 83,
			reason: "Matched skill: Webhooks",
		},
		{
			id: "T-1051",
			subject: "Rate limit docs unclear",
			skill: "Technical",
			confidence: 79,
			reason: "Matched skill: Docs & API",
		},
	];

	return (
		<div className="left-panel-content">
			{/* Brand */}
			<Link href="/" className="left-brand">
				<Image
					src="/white_fylo.svg"
					alt="Fylo"
					width={0}
					height={0}
					sizes="100vw"
					style={{ width: "auto", height: "22px" }}
					priority
				/>
			</Link>

			{/* Copy */}
			<div className="left-copy">
				<span className="left-persona-badge">For agents</span>
				<h2 className="left-headline">
					Your queue,<br />explained.
				</h2>
				<p className="left-subline">
					Every ticket shows exactly why it landed with you.
				</p>
			</div>

			{/* Mini mockup */}
			<div className="left-mockup">
				<div className="lm-header">
					<span className="lm-label">My tickets · Omar B.</span>
					<span className="lm-count">{myTickets.length} open</span>
				</div>

				<div className="lm-list">
					{myTickets.map((t) => (
						<div key={t.id} className="lm-ticket">
							<div className="lm-ticket-top">
								<span className="lm-id">{t.id}</span>
								<span className="lm-skill lm-skill-technical">{t.skill}</span>
								<span className="lm-conf">{t.confidence}%</span>
							</div>
							<p className="lm-subject">{t.subject}</p>
							<p className="lm-reason">↳ {t.reason}</p>
						</div>
					))}
				</div>

				<div className="lm-footer-note lm-note-amber">
					⚠ 1 ticket pending manager review
				</div>
			</div>
		</div>
	);
}

export default function SignInPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const nextPath = getSafeNextPath(searchParams.get("next"));

	return (
		<div className="auth-page" suppressHydrationWarning>
			<div className="grain" suppressHydrationWarning />

			<div className="auth-split">
				{/* ── LEFT: agent panel ── */}
				<div className="auth-left">
					<div className="auth-left-glow" />
					<AgentPanel />
				</div>

				{/* ── RIGHT: form ── */}
				<div className="auth-right">
					<div className="auth-card">
						<div className="auth-card-head">
							<p className="auth-eyebrow">Welcome back</p>
							<h1 className="auth-title">Sign in</h1>
							<p className="auth-sub">Continue to your workspace.</p>
						</div>

						<div className="auth-form-wrap">
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
											getAuthErrorMessage(
												response,
												"Unable to sign in with that account",
											),
										);
									}
									router.push(nextPath as Route);
								}}
							/>
						</div>

						<p className="auth-footer-text">
							Need an account?{" "}
							<Link href={buildSignUpHref(nextPath)} className="auth-link">
								Sign up
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
