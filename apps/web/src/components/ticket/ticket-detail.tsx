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

function reviewStateBadge(state: string): string {
	const s = state.toLowerCase();
	if (s.includes("approved") || s.includes("routed")) return "app-badge app-badge--routed";
	if (s.includes("manual") || s.includes("triage"))   return "app-badge app-badge--urgent";
	if (s.includes("review") || s.includes("verif"))    return "app-badge app-badge--review";
	return "app-badge app-badge--pending";
}

function priorityColor(priority: string | undefined): string {
	if (!priority) return "rgba(240,240,240,0.5)";
	if (priority === "high")   return "#f87171";
	if (priority === "medium") return "#f0f0f0";
	return "rgba(240,240,240,0.4)";
}

export function TicketDetail({ ticket, draft }: TicketDetailProps) {
	const ticketDraft = draft ?? ticket.draft;
	const conf =
		typeof ticket.classificationConfidence === "number"
			? Math.round(ticket.classificationConfidence * 100)
			: null;

	const metaFields = [
		{ label: "Status",       value: ticket.status ?? "Ready for review" },
		{ label: "Owner",        value: ticket.assignedWorkerLabel ?? "Unassigned" },
		{ label: "Request type", value: ticket.requestType ?? "Pending" },
		{ label: "Priority",     value: ticket.priority ?? "Pending", color: priorityColor(ticket.priority) },
	];

	return (
		<section className="flex flex-col gap-4">
			{/* Ticket header */}
			<div className="app-card p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex flex-col gap-1">
						<p className="app-eyebrow">{ticket.id}</p>
						<h1 className="app-h2">{ticket.title ?? ticket.id}</h1>
						{ticket.requesterEmail && (
							<p className="app-body" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
								{ticket.requesterEmail}
							</p>
						)}
					</div>
					<span className={reviewStateBadge(ticket.reviewState)}>
						{ticket.reviewState}
					</span>
				</div>
			</div>

			{/* Two-column grid */}
			<div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
				{/* Left: assignment context */}
				<div className="app-card p-5 flex flex-col gap-5">
					<p className="app-eyebrow app-eyebrow--violet">Assignment context</p>

					{/* Meta grid */}
					<div className="grid grid-cols-2 gap-4">
						{metaFields.map(({ label, value, color }) => (
							<div key={label}>
								<p className="app-field-label mb-1">{label}</p>
								<p
									style={{
										fontFamily: "var(--font-dm-sans)",
										fontSize: "0.8125rem",
										fontWeight: 500,
										color: color ?? "#f0f0f0",
									}}
								>
									{value}
								</p>
							</div>
						))}
					</div>

					{/* Confidence */}
					{conf !== null && (
						<div>
							<p className="app-field-label mb-2">AI confidence</p>
							<div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
								<div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
									<div
										style={{
											width: `${conf}%`,
											height: "100%",
											borderRadius: "2px",
											background: conf >= 75 ? "#a78bfa" : "#fbbf24",
										}}
									/>
								</div>
								<span
									style={{
										fontFamily: "var(--font-jetbrains-mono)",
										fontSize: "0.75rem",
										fontWeight: 600,
										color: conf >= 75 ? "#a78bfa" : "#fbbf24",
									}}
								>
									{conf}%
								</span>
								<span className="app-body" style={{ fontSize: "0.7rem" }}>
									({ticket.classificationSource ?? "fallback"})
								</span>
							</div>
						</div>
					)}

					{/* Routing reason */}
					<div>
						<p className="app-field-label mb-2">Routing reason</p>
						<p className="app-body" style={{ fontSize: "0.8rem" }}>
							{ticket.routingReason ?? "Routing detail will appear once the live query is wired."}
						</p>
					</div>

					{/* Workspace note */}
					<div>
						<p className="app-field-label mb-2">Workspace note</p>
						<p className="app-body" style={{ fontSize: "0.8rem" }}>
							{ticket.assignmentContext ?? "Use this panel to capture routing context, reviewer nudges, and assignment handoff details."}
						</p>
					</div>
				</div>

				{/* Right: actions + notes + draft */}
				<div className="flex flex-col gap-4">
					<TicketWorkspaceActions
						ticketId={ticket.id}
						reviewState={ticket.reviewState}
						assignedWorkerId={ticket.assignedWorkerId ?? null}
						recommendedAssigneeOptions={ticket.recommendedAssigneeOptions ?? []}
					/>
					<TicketNotes notes={ticket.notes ?? []} />
					{ticketDraft && (
						<DraftReplyPanel
							ticketId={ticket.id}
							to={ticket.requesterEmail ?? null}
							subject={ticket.title ?? null}
							draft={ticketDraft}
						/>
					)}
				</div>
			</div>
		</section>
	);
}

export type { TicketWorkspace, TicketNote };
