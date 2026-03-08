"use client";

import { useQuery } from "convex/react";

import { getCurrentWorkspaceReference } from "../../../../../../packages/backend/convex/workspaces_reference";
import { getTeamVisibilityReference } from "../../../../../../packages/backend/convex/visibility_reference";
import {
	type WorkloadCard,
	WorkloadCards,
} from "../../../components/visibility/workload-cards";
import { authClient } from "../../../lib/auth-client";
import { WorkspaceAccessPanel } from "../../../components/workspace/workspace-access-panel";

function buildWorkloadNote(card: {
	status: WorkloadCard["status"];
	reviewQueue: number;
}) {
	if (card.status === "busy") {
		return "Exception routing is stacking up here—current bottleneck.";
	}
	if (card.status === "watch") {
		return "One more manual-review handoff will crowd this queue.";
	}
	if (card.reviewQueue > 0) {
		return "Capacity open, but items still need human confirmation.";
	}
	return "Room for overflow if policy allows secondary-skill handoff.";
}

export default function VisibilityPage() {
	const { data: session, isPending: isSessionPending } = authClient.useSession();
	const workspaceState = useQuery(
		getCurrentWorkspaceReference,
		session ? {} : "skip",
	);
	const visibility = useQuery(
		getTeamVisibilityReference,
		workspaceState?.isMember ? {} : "skip",
	);
	const workloadCards: WorkloadCard[] = (visibility?.cards ?? []).map(
		(card) => ({
			id: card.id,
			name: card.label,
			role: card.role,
			activeTickets: card.assignedCount,
			reviewQueue: card.reviewCount,
			status: card.capacityState,
			note: buildWorkloadNote({
				status: card.capacityState,
				reviewQueue: card.reviewCount,
			}),
		}),
	);

	if (!isSessionPending && workspaceState && !workspaceState.isMember) {
		return (
			<section className="flex flex-col gap-5">
				<div className="app-card p-5">
					<p className="app-eyebrow app-eyebrow--violet mb-2">Team visibility</p>
					<h1 className="app-h2 mb-2">Join a workspace first</h1>
					<p className="app-body">
						Create or join a workspace to see team workload and review pressure.
					</p>
				</div>
				<WorkspaceAccessPanel />
			</section>
		);
	}

	return (
		<section className="flex flex-col gap-5">
			<div className="grid gap-4 lg:grid-cols-[1fr_auto]">
				<div className="app-card p-5">
					<p className="app-eyebrow app-eyebrow--violet mb-2">Team visibility</p>
					<h1 className="app-h2 mb-2">Workload at a glance</h1>
					<p className="app-body">
						Capacity and review pressure in one view. Spot hotspots before
						routing drifts.
					</p>
				</div>

				{/* Summary stats */}
				<div className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:w-44">
					<div className="app-stat-card">
						<div className="app-stat-val">{visibility?.cards.length ?? 0}</div>
						<div className="app-stat-label">Active lanes</div>
					</div>
					<div className="app-stat-card">
						<div
							className="app-stat-val"
							style={{ color: (visibility?.reviewQueueCount ?? 0) > 0 ? "#fbbf24" : undefined }}
						>
							{visibility?.reviewQueueCount ?? 0}
						</div>
						<div className="app-stat-label">In review</div>
					</div>
					<div className="app-stat-card">
						<div
							className="app-stat-val"
							style={{ color: (visibility?.unassignedCount ?? 0) > 0 ? "#f87171" : undefined }}
						>
							{visibility?.unassignedCount ?? 0}
						</div>
						<div className="app-stat-label">Unassigned</div>
					</div>
				</div>
			</div>

			{visibility ? (
				<WorkloadCards cards={workloadCards} />
			) : (
				<div className="app-card">
					<p className="app-loading">Loading team visibility…</p>
				</div>
			)}
		</section>
	);
}
