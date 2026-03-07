"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { EmailPasswordAuthForm } from "../../components/auth/email-password-auth-form";
import { getSafeNextPath } from "../../lib/auth-redirect";
import { authClient, getAuthErrorMessage } from "../../lib/auth-client";
import { persistPendingWorkspaceAction } from "../../lib/workspace-access-state";
import "../auth.css";

function buildSignInHref(nextPath: string): Route {
	return `/sign-in?next=${encodeURIComponent(nextPath)}` as Route;
}

function navigateTo(path: Route) {
	window.location.assign(path);
}

// ── Lead / manager perspective panel ──
function LeadPanel() {
	const agents = [
		{ name: "Priya K.", load: 4, max: 6, overloaded: false },
		{ name: "Omar B.",  load: 6, max: 6, overloaded: true  },
		{ name: "Lena M.",  load: 2, max: 6, overloaded: false },
	];

	const activity = [
		{ id: "T-1042", agent: "Priya K.", skill: "Billing",   conf: 94, review: false },
		{ id: "T-1046", agent: "Omar B.",  skill: "Technical", conf: 83, review: false },
		{ id: "T-1044", agent: null,       skill: "Billing",   conf: 61, review: true  },
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
				<span className="left-persona-badge">For team leads</span>
				<h2 className="left-headline">
					Full visibility.<br />Zero guesswork.
				</h2>
				<p className="left-subline">
					See every ticket, every routing decision, every teammate's load.
				</p>
			</div>

			{/* Mini mockup */}
			<div className="left-mockup">
				{/* Pod workload */}
				<div className="lm-header">
					<span className="lm-label">Pod workload</span>
				</div>
				<div className="lm-agents">
					{agents.map((a) => (
						<div key={a.name} className="lm-agent-row">
							<span className="lm-agent-name">{a.name}</span>
							<div className="lm-load-bar">
								{Array.from({ length: a.max }).map((_, i) => (
									<div
										key={i}
										className={`lm-pip ${
											i < a.load
												? a.overloaded
													? "lm-pip-red"
													: "lm-pip-violet"
												: "lm-pip-empty"
										}`}
									/>
								))}
							</div>
							<span className={`lm-load-count ${a.overloaded ? "lm-overloaded" : ""}`}>
								{a.load}/{a.max}{a.overloaded ? " ⚠" : ""}
							</span>
						</div>
					))}
				</div>

				<div className="lm-divider" />

				{/* Routing activity */}
				<div className="lm-header">
					<span className="lm-label">Routing activity</span>
				</div>
				<div className="lm-activity">
					{activity.map((r) => (
						<div key={r.id} className="lm-activity-row">
							<span className={`lm-status-dot ${r.review ? "lm-dot-amber" : "lm-dot-green"}`} />
							<span className="lm-act-id">{r.id}</span>
							<span className="lm-act-dest">
								{r.review ? "→ Review" : `→ ${r.agent}`}
							</span>
							<span className={`lm-act-conf ${r.conf < 70 ? "lm-conf-low" : ""}`}>
								{r.conf}%
							</span>
						</div>
					))}
				</div>

				<div className="lm-footer-note lm-note-violet">
					10K+ tickets routed daily · 97% accuracy
				</div>
			</div>
		</div>
	);
}

export default function SignUpPage() {
	const searchParams = useSearchParams();
	const nextPath = getSafeNextPath(searchParams.get("next"));

	return (
		<div className="auth-page" suppressHydrationWarning>
			<div className="grain" suppressHydrationWarning />

			<div className="auth-split">
				{/* ── LEFT: lead panel ── */}
				<div className="auth-left">
					<div className="auth-left-glow" />
					<LeadPanel />
				</div>

				{/* ── RIGHT: form ── */}
				<div className="auth-right">
					<div className="auth-card">
						<div className="auth-card-head">
							<p className="auth-eyebrow">Get started free</p>
							<h1 className="auth-title">Create account</h1>
							<p className="auth-sub">No credit card required.</p>
						</div>

						<div className="auth-form-wrap">
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
											getAuthErrorMessage(
												response,
												"Unable to create that account",
											),
										);
									}

									persistPendingWorkspaceAction({
										ownerSessionKey: email,
										type: "create",
										redirectTo: "/",
									});

									navigateTo("/" as Route);
								}}
							/>
						</div>

						<p className="auth-footer-text">
							Already have an account?{" "}
							<Link href={buildSignInHref(nextPath)} className="auth-link">
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
