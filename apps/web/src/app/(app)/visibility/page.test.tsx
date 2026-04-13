import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useQuery = vi.fn();

vi.mock("convex/react", () => ({
	useQuery,
}));

vi.mock(
	"../../../../../../packages/backend/convex/visibility_reference",
	() => ({
		getTeamVisibilityReference: {},
	}),
);

describe("VisibilityPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders workload cards from the backend visibility query", async () => {
		useQuery.mockReturnValue({
			reviewQueueCount: 2,
			unassignedCount: 1,
			cards: [
				{
					id: "c1",
					label: "Finance lead",
					role: "lead",
					assignedCount: 4,
					reviewCount: 2,
					capacityState: "busy",
				},
			],
		});

		const { default: VisibilityPage } = await import("./page");

		render(<VisibilityPage />);

		expect(screen.getByText("Finance lead")).toBeInTheDocument();
		expect(screen.getByText("2 review items")).toBeInTheDocument();
		expect(screen.getByText("1 ticket still unassigned")).toBeInTheDocument();
	});
});
