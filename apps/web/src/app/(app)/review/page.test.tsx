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
		getReviewSnapshotReference: {},
	}),
);

describe("ReviewPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders live review items from the backend query", async () => {
		useQuery.mockReturnValue({
			count: 1,
			items: [
				{
					id: "ticket_1",
					title: "VIP onboarding escalation",
					decisionWindow: "Decision due soon",
					owner: "lead@example.com",
					note: "Confidence stayed below the auto-assign threshold.",
					reviewState: "manager_verification",
					decisionHref: "/tickets/ticket_1",
					requestType: "complaint",
					priority: "high",
				},
			],
		});

		const { default: ReviewPage } = await import("./page");

		render(<ReviewPage />);

		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("VIP onboarding escalation")).toBeInTheDocument();
		expect(screen.getByText("complaint - high")).toBeInTheDocument();
		expect(screen.getByText("manager_verification")).toBeInTheDocument();
	});
});
