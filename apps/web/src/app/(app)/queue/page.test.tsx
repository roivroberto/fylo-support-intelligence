import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useQuery = vi.fn();

vi.mock("convex/react", () => ({
	useQuery,
}));

vi.mock(
	"../../../../../../packages/backend/convex/tickets_reference",
	() => ({
		getQueueSnapshotReference: {},
	}),
);

describe("QueuePage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders live queue content from the backend query", async () => {
		useQuery.mockReturnValue({
			totalCount: 2,
			urgentCount: 1,
			fallbackCount: 1,
			rows: [
				{
					id: "ticket_1",
					title: "Billing exception needs manual routing",
					requester: "ops@example.com",
					reason: "Review required (manager_verification).",
					priority: "high",
					status: "reviewed",
					reviewState: "manager_verification",
					classificationConfidence: 0.78,
					classificationSource: "provider",
					assignedWorkerLabel: "Unassigned",
					requestType: "billing_issue",
					decisionHref: "/tickets/ticket_1",
				},
			],
		});

		const { default: QueuePage } = await import("./page");

		render(<QueuePage />);

		expect(screen.getByText("2 tickets")).toBeInTheDocument();
		expect(
			screen.getByText("Billing exception needs manual routing"),
		).toBeInTheDocument();
		expect(screen.getByText("billing_issue")).toBeInTheDocument();
		expect(screen.getByText("78%")).toBeInTheDocument();
	});
});
