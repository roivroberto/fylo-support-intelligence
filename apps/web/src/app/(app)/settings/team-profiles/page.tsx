"use client";

import { useQuery } from "convex/react";

import { getTeamProfileDirectoryReference } from "@Fylo/backend/convex/agent_profiles_reference";
import { getCurrentWorkspaceReference } from "@Fylo/backend/convex/workspaces_reference";

import { TeamProfilesDirectory } from "../../../../components/settings/team-profiles-directory";
import { authClient } from "../../../../lib/auth-client";

export default function TeamProfilesSettingsPage() {
	const { data: session } = authClient.useSession();
	const workspace = useQuery(getCurrentWorkspaceReference, session ? {} : "skip");
	const isLead = workspace?.workspace?.role === "lead";
	const directory = useQuery(
		getTeamProfileDirectoryReference,
		isLead ? {} : "skip",
	);

	if (!workspace) {
		return (
			<div
				role="status"
				aria-live="polite"
				className="border bg-card p-5 text-sm text-muted-foreground"
			>
				Loading team profile coverage…
			</div>
		);
	}

	if (!isLead) {
		return (
			<section className="grid gap-4">
				<div className="border bg-card p-5 text-card-foreground">
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						Team profiles
					</p>
					<h2 className="mt-2 text-xl font-semibold tracking-tight">
						Lead access required
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
						This directory is reserved for leads who need a team-wide view of routing
						profile coverage.
					</p>
				</div>
			</section>
		);
	}

	return (
		<section className="grid gap-4">
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
				<div className="border bg-card p-5 text-card-foreground">
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						Team profiles
					</p>
					<h2 className="mt-2 text-xl font-semibold tracking-tight">
						See who is ready for profile-based routing
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
						This lead-only directory gives a compact read on resume coverage so missing
						profiles are easy to spot before assignment quality drifts.
					</p>
				</div>
				<div className="border bg-card p-5 text-sm text-muted-foreground">
					<p className="text-[11px] uppercase tracking-[0.2em]">Coverage</p>
					<div className="mt-3 space-y-2">
						<p>
							<span className="font-medium text-foreground">
								{directory?.summary.readyCount ?? 0} ready
							</span>{" "}
							profiles can influence routing now
						</p>
						<p>
							<span className="font-medium text-foreground">
								{directory?.summary.missingCount ?? 0} missing
							</span>{" "}
							teammates still need a resume upload
						</p>
						<p>
							<span className="font-medium text-foreground">
								{directory?.summary.failedCount ?? 0} flagged
							</span>{" "}
							profiles need another pass
						</p>
					</div>
				</div>
			</div>
			{directory ? (
				<TeamProfilesDirectory
					summary={directory.summary}
					members={directory.members}
				/>
			) : (
				<div
					role="status"
					aria-live="polite"
					className="border bg-card p-5 text-sm text-muted-foreground"
				>
					Loading team profile coverage…
				</div>
			)}
		</section>
	);
}
