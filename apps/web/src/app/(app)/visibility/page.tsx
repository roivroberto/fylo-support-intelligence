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
		return "Exception routing is stacking up here, so this lane is the current bottleneck.";
	}

	if (card.status === "watch") {
		return "Healthy overall, but one more manual-review handoff will start to crowd the queue.";
	}

	if (card.reviewQueue > 0) {
		return "Capacity is open, but a few items still need human confirmation.";
	}

	return "Plenty of room for overflow if policy rules allow a secondary-skill handoff.";
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
			<section className="grid gap-4">
				<div className="border bg-card p-5 text-card-foreground">
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						Team visibility
					</p>
					<h2 className="mt-2 text-xl font-semibold tracking-tight">
						Join a workspace to see team visibility
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
						Create a workspace or join one with a pod code to view workload
						capacity and review pressure.
					</p>
				</div>
				<WorkspaceAccessPanel />
			</section>
		);
	}

	return (
		<section className="grid gap-4">
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
				<div className="border bg-card p-5 text-card-foreground">
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						Team visibility
					</p>
					<h2 className="mt-2 text-xl font-semibold tracking-tight">
						Make workload hotspots obvious before routing drifts
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
						This pilot view keeps capacity and review pressure in one place
						using the current workspace visibility query.
					</p>
				</div>
				<div className="border bg-card p-5 text-sm text-muted-foreground">
					<p className="text-[11px] uppercase tracking-[0.2em]">Today</p>
					<div className="mt-3 space-y-2">
						<p>
							<span className="font-medium text-foreground">
								{visibility?.cards.length ?? 0} lanes
							</span>{" "}
							visible in the current workspace
						</p>
						<p>
							<span className="font-medium text-foreground">
								{visibility?.reviewQueueCount ?? 0} review items
							</span>{" "}
							need follow-through
						</p>
						<p>
							<span className="font-medium text-foreground">
								{visibility?.unassignedCount ?? 0} ticket
								{visibility?.unassignedCount === 1 ? "" : "s"} still unassigned
							</span>
						</p>
					</div>
				</div>
			</div>
			{visibility ? (
				<WorkloadCards cards={workloadCards} />
			) : (
				<div className="border bg-card p-5 text-sm text-muted-foreground">
					Loading current team visibility...
				</div>
			)}
		</section>
	);
}
