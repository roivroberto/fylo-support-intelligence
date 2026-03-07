import { describe, expect, it } from "vitest";

import {
	buildTicketDetailWorkspace,
	canAccessOperationalCorePilot,
} from "../../tickets";

describe("buildTicketDetailWorkspace", () => {
	it("returns workspace detail with notes and assignment context", () => {
		const detail = buildTicketDetailWorkspace({
			ticket: {
				_id: "ticket_123",
				subject: "Billing exception needs manual routing",
				requesterEmail: "ops@northstar.example",
				requestType: "billing_issue",
				priority: "high",
				classificationConfidence: 0.78,
				classificationSource: "provider",
				reviewState: "manager_verification",
				status: "reviewed",
				routingReason:
					"Policy threshold exceeded for billing exception handling.",
				assignedWorkerId: null,
			},
			notes: [
				{
					_id: "note_1",
					body: "Confirm whether the exception should stay with finance.",
					authorLabel: "Routing assistant",
					createdAt: Date.UTC(2026, 2, 7, 14, 58, 0),
				},
			],
			recommendedAssigneeOptions: [
				{
					id: "worker_1",
					label: "worker_1",
					skillMatchTier: "primary",
					capacityRemaining: 4,
					languageMatch: true,
				},
			],
			now: Date.UTC(2026, 2, 7, 15, 0, 0),
		});

			expect(detail).toMatchObject({
				id: "ticket_123",
				title: "Billing exception needs manual routing",
				requesterEmail: "ops@northstar.example",
				requestType: "billing_issue",
				priority: "high",
				classificationConfidence: 0.78,
				classificationSource: "provider",
				reviewState: "manager_verification",
				status: "reviewed",
				routingReason:
				"Policy threshold exceeded for billing exception handling.",
			assignedWorkerLabel: "Unassigned",
			assignmentContext:
				"Pending manager verification before final ownership is confirmed.",
		});

		expect(detail.notes).toEqual([
			{
				id: "note_1",
				body: "Confirm whether the exception should stay with finance.",
				authorLabel: "Routing assistant",
				createdAtLabel: "2m ago",
			},
		]);
		expect(detail.recommendedAssigneeOptions).toEqual([
			{
				id: "worker_1",
				label: "worker_1",
				skillMatchTier: "primary",
				capacityRemaining: 4,
				languageMatch: true,
			},
		]);
	});

	it("requires at least one membership for operational core access", () => {
		expect(canAccessOperationalCorePilot([])).toBe(false);
		expect(canAccessOperationalCorePilot([{ _id: "membership_1" }])).toBe(true);
	});
});
