import { buildLeadReviewPatch, type TicketLeadReviewPatch } from "../tickets";
import type { WorkspaceRole } from "./authz";
import type { ReviewState } from "./routing_thresholds";

export type LeadReviewAction = "approve" | "reassign";

export type ApplyLeadReviewDecisionInput = {
	reviewState: ReviewState;
	action: LeadReviewAction;
};

export type ApplyLeadReviewDecisionResult = {
	status: "assigned" | "reviewed";
	reviewState: ReviewState;
};

export type WorkflowMembership = {
	role: WorkspaceRole;
};

export type StoredReviewTicket = {
	reviewState?: ReviewState | null;
	assignedWorkerId?: string | null;
};

export function canApplyRoutingDecision(
	memberships: WorkflowMembership[],
): boolean {
	return memberships.length > 0;
}

export function canApplyLeadReview(memberships: WorkflowMembership[]): boolean {
	return memberships.some((membership) => membership.role === "lead");
}

export function applyLeadReviewDecision(
	input: ApplyLeadReviewDecisionInput,
): ApplyLeadReviewDecisionResult {
	if (input.action === "approve") {
		return { status: "assigned", reviewState: "auto_assign_allowed" };
	}

	return { status: "reviewed", reviewState: input.reviewState };
}

export function buildLeadReviewTicketPatch(input: {
	ticket: StoredReviewTicket;
	action: LeadReviewAction;
	assignedWorkerId?: string | null;
	reviewedAt: number;
}): TicketLeadReviewPatch {
	if (!input.ticket.reviewState) {
		throw new Error("Ticket review state required");
	}

	if (input.ticket.reviewState === "auto_assign_allowed") {
		throw new Error("Lead review requires a review-needed ticket");
	}

	const decision = applyLeadReviewDecision({
		reviewState: input.ticket.reviewState,
		action: input.action,
	});

	return buildLeadReviewPatch({
		decision,
		assignedWorkerId:
			input.assignedWorkerId ?? input.ticket.assignedWorkerId ?? null,
		reviewedAt: input.reviewedAt,
	});
}
