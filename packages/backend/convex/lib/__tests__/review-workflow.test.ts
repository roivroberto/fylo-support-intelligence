import { describe, expect, it } from "vitest";

import { buildLeadReviewPatch, buildTicketRoutingPatch } from "../../tickets";
import {
	applyLeadReviewDecision,
	buildLeadReviewTicketPatch,
	canApplyLeadReview,
	canApplyRoutingDecision,
} from "../review_workflow";

describe("applyLeadReviewDecision", () => {
	it("marks reviewed ticket as assigned when approved", () => {
		const result = applyLeadReviewDecision({
			reviewState: "manager_verification",
			action: "approve",
		});

		expect(result.status).toBe("assigned");
		expect(result.reviewState).toBe("auto_assign_allowed");
	});

	it("keeps the ticket in review when reassignment is requested", () => {
		const result = applyLeadReviewDecision({
			reviewState: "manager_verification",
			action: "reassign",
		});

		expect(result.status).toBe("reviewed");
		expect(result.reviewState).toBe("manager_verification");
	});

	it("preserves manual triage when reassignment is requested", () => {
		const result = applyLeadReviewDecision({
			reviewState: "manual_triage",
			action: "reassign",
		});

		expect(result.status).toBe("reviewed");
		expect(result.reviewState).toBe("manual_triage");
	});
});

describe("buildTicketRoutingPatch", () => {
	it("marks manager-verification routing decisions as reviewed", () => {
		const patch = buildTicketRoutingPatch(
			{
				assignedWorkerId: null,
				reviewState: "manager_verification",
				routingReason: "Review required.",
				scoredCandidates: [],
			},
			100,
		);

		expect(patch.status).toBe("reviewed");
		expect(patch.reviewState).toBe("manager_verification");
		expect(patch.routedAt).toBe(100);
	});

	it("marks auto-assign routing decisions as assigned", () => {
		const patch = buildTicketRoutingPatch(
			{
				assignedWorkerId: "worker_1",
				reviewState: "auto_assign_allowed",
				routingReason: "Recommended worker_1.",
				scoredCandidates: [],
			},
			101,
		);

		expect(patch.status).toBe("assigned");
		expect(patch.assignedWorkerId).toBe("worker_1");
	});
});

describe("buildLeadReviewPatch", () => {
	it("stores the selected assignee when lead review approves routing", () => {
		const patch = buildLeadReviewPatch({
			decision: applyLeadReviewDecision({
				reviewState: "manager_verification",
				action: "approve",
			}),
			assignedWorkerId: "worker_1",
			reviewedAt: 200,
		});

		expect(patch.status).toBe("assigned");
		expect(patch.assignedWorkerId).toBe("worker_1");
		expect(patch.reviewedAt).toBe(200);
	});
});

describe("buildLeadReviewTicketPatch", () => {
	it("uses the stored ticket review state instead of caller-provided state", () => {
		const patch = buildLeadReviewTicketPatch({
			ticket: {
				reviewState: "manual_triage",
				assignedWorkerId: null,
			},
			action: "reassign",
			reviewedAt: 300,
		});

		expect(patch.status).toBe("reviewed");
		expect(patch.reviewState).toBe("manual_triage");
	});

	it("requires an assignee when approving a lead review", () => {
		expect(() =>
			buildLeadReviewTicketPatch({
				ticket: {
					reviewState: "manager_verification",
					assignedWorkerId: null,
				},
				action: "approve",
				reviewedAt: 301,
			}),
		).toThrow("Assigned worker required for approval");
	});

	it("rejects lead review for tickets already marked auto assign allowed", () => {
		expect(() =>
			buildLeadReviewTicketPatch({
				ticket: {
					reviewState: "auto_assign_allowed",
					assignedWorkerId: "worker_9",
				},
				action: "approve",
				reviewedAt: 301,
			}),
		).toThrow("Lead review requires a review-needed ticket");
	});

	it("reuses the stored assignee when approval does not provide a new one", () => {
		const patch = buildLeadReviewTicketPatch({
			ticket: {
				reviewState: "manager_verification",
				assignedWorkerId: "worker_7",
			},
			action: "approve",
			reviewedAt: 302,
		});

		expect(patch.status).toBe("assigned");
		expect(patch.assignedWorkerId).toBe("worker_7");
	});
});

describe("workflow access", () => {
	it("allows routing for any membership", () => {
		expect(canApplyRoutingDecision([{ role: "agent" }])).toBe(true);
	});

	it("denies routing with no memberships", () => {
		expect(canApplyRoutingDecision([])).toBe(false);
	});

	it("allows lead review only for lead memberships", () => {
		expect(canApplyLeadReview([{ role: "lead" }])).toBe(true);
		expect(canApplyLeadReview([{ role: "agent" }])).toBe(false);
	});
});
