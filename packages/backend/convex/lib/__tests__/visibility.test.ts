import { describe, expect, it, vi } from "vitest";

vi.mock("../../auth", () => ({
	authComponent: {},
}));

import { buildTeamVisibilitySnapshot } from "../../visibility";

describe("buildTeamVisibilitySnapshot", () => {
	it("scopes counts to the current workspace membership set", () => {
		const snapshot = buildTeamVisibilitySnapshot({
			workspaceId: "ws_1",
			memberships: [
				{ _id: "m1", userId: "lead-1", role: "lead" },
				{ _id: "m2", userId: "agent-1", role: "agent" },
			],
			tickets: [
				{ assignedWorkerId: "lead-1", reviewState: "manager_verification" },
				{ assignedWorkerId: "agent-1", reviewState: "auto_assign_allowed" },
				{ assignedWorkerId: null, reviewState: "manual_triage" },
				{
					assignedWorkerId: "outside-user",
					reviewState: "manager_verification",
				},
			],
		});

		expect(snapshot.reviewQueueCount).toBe(1);
		expect(snapshot.unassignedCount).toBe(1);
		expect(snapshot.cards).toEqual([
			{
				id: "m1",
				label: "lead-1",
				role: "lead",
				assignedCount: 1,
				reviewCount: 1,
				capacityState: "clear",
			},
			{
				id: "m2",
				label: "agent-1",
				role: "agent",
				assignedCount: 1,
				reviewCount: 0,
				capacityState: "clear",
			},
		]);
	});
});
