import React from "react";

import type { TicketDraftWorkspace } from "../../../../../packages/backend/convex/drafts_reference";

import { DraftReplyPanel } from "./draft-reply-panel";
import { type TicketNote, TicketNotes } from "./ticket-notes";
import { TicketWorkspaceActions } from "./ticket-workspace-actions";

type TicketWorkspace = {
	id: string;
	title?: string;
	requesterEmail?: string;
	reviewState: string;
	status?: string;
	routingReason?: string;
	requestType?: string;
	priority?: string;
	classificationConfidence?: number;
	classificationSource?: "provider" | "fallback";
	assignedWorkerId?: string | null;
	assignedWorkerLabel?: string;
	assignmentContext?: string;
	notes?: TicketNote[];
	recommendedAssigneeOptions?: Array<{
		id: string;
		label: string;
		skillMatchTier: string;
		capacityRemaining: number;
		languageMatch: boolean;
	}>;
	draft?: TicketDraftWorkspace;
};

type TicketDetailProps = {
	ticket: TicketWorkspace;
	draft?: TicketDraftWorkspace;
};

export function TicketDetail({ ticket, draft }: TicketDetailProps) {
	const ticketDraft = draft ?? ticket.draft;

	return (
		<section className="grid gap-4">
			<div className="border bg-card p-5 text-card-foreground">
				<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
					Ticket workspace
				</p>
				<div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h2 className="text-xl font-semibold tracking-tight">
							{ticket.title ?? ticket.id}
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">{ticket.id}</p>
						{ticket.requesterEmail ? (
							<p className="mt-2 text-sm text-muted-foreground">
								{ticket.requesterEmail}
							</p>
						) : null}
					</div>
					<span className="inline-flex w-fit border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-foreground">
						{ticket.reviewState}
					</span>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
				<div className="border bg-card p-5 text-card-foreground">
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						Assignment context
					</p>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
								Status
							</p>
							<p className="mt-2 text-sm font-medium text-foreground">
								{ticket.status ?? "Ready for review"}
							</p>
						</div>
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
								Owner
							</p>
							<p className="mt-2 text-sm font-medium text-foreground">
								{ticket.assignedWorkerLabel ?? "Unassigned"}
							</p>
						</div>
					</div>
					<div className="mt-4 grid gap-3 text-sm text-muted-foreground">
						<div className="grid gap-4 sm:grid-cols-3">
							<div>
								<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
									Request type
								</p>
								<p className="mt-2 text-sm text-foreground">
									{ticket.requestType ?? "Pending classification"}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
									Priority
								</p>
								<p className="mt-2 text-sm text-foreground">
									{ticket.priority ?? "Pending classification"}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
									AI confidence
								</p>
								<p className="mt-2 text-sm text-foreground">
									{typeof ticket.classificationConfidence === "number"
										? `${Math.round(ticket.classificationConfidence * 100)}% (${ticket.classificationSource ?? "fallback"})`
										: "Pending classification"}
								</p>
							</div>
						</div>
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
								Routing reason
							</p>
							<p className="mt-2 text-sm text-foreground">
								{ticket.routingReason ??
									"Routing detail will appear here once the live query is wired."}
							</p>
						</div>
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
								Workspace note
							</p>
							<p className="mt-2">
								{ticket.assignmentContext ??
									"Use this panel to capture the final routing context, reviewer nudges, and assignment handoff details."}
							</p>
						</div>
					</div>
				</div>

				<div className="grid gap-4">
					<TicketWorkspaceActions
						ticketId={ticket.id}
						reviewState={ticket.reviewState}
						assignedWorkerId={ticket.assignedWorkerId ?? null}
						recommendedAssigneeOptions={ticket.recommendedAssigneeOptions ?? []}
					/>
					<TicketNotes notes={ticket.notes ?? []} />
					{ticketDraft ? (
						<DraftReplyPanel
							ticketId={ticket.id}
							to={ticket.requesterEmail ?? null}
							subject={ticket.title ?? null}
							draft={ticketDraft}
						/>
					) : null}
				</div>
			</div>
		</section>
	);
}

export type { TicketWorkspace, TicketNote };
