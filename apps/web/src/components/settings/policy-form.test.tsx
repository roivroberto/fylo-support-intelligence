import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useMutation, useQuery } = vi.hoisted(() => ({
	useMutation: vi.fn(),
	useQuery: vi.fn(),
}));

vi.mock("convex/react", () => ({
	useMutation,
	useQuery,
}));

vi.mock("../../../../../packages/backend/convex/policies_reference", () => ({
	getCurrentPolicyReference: {},
	saveCurrentPolicyReference: {},
}));

vi.mock("../ui/button", () => ({
	Button: ({ children, ...props }: React.ComponentProps<"button">) => (
		<button {...props}>{children}</button>
	),
}));

vi.mock("../ui/input", () => ({
	Input: (props: React.ComponentProps<"input">) => <input {...props} />,
}));

vi.mock("../ui/label", () => ({
	Label: ({ children, ...props }: React.ComponentProps<"label">) => (
		<label {...props}>{children}</label>
	),
}));

import { PolicyForm } from "./policy-form";

describe("PolicyForm", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("loads policy settings from the backend query", () => {
		useQuery.mockReturnValue({
			canManage: true,
			policy: {
				autoAssignThreshold: 0.9,
				maxAssignmentsPerWorker: 6,
				requireLeadReview: false,
				allowSecondarySkills: true,
			},
		});
		useMutation.mockReturnValue(vi.fn());

		render(<PolicyForm />);

		expect(screen.getByDisplayValue("0.9")).toBeInTheDocument();
		expect(screen.getByDisplayValue("6")).toBeInTheDocument();
		expect(
			screen.getByText(/90% confidence unlocks direct assignment/i),
		).toBeInTheDocument();
	});

	it("saves edits through the backend mutation", async () => {
		const savePolicy = vi.fn().mockResolvedValue(undefined);

		useQuery.mockReturnValue({
			canManage: true,
			policy: {
				autoAssignThreshold: 0.8,
				maxAssignmentsPerWorker: 8,
				requireLeadReview: true,
				allowSecondarySkills: true,
			},
		});
		useMutation.mockReturnValue(savePolicy);

		render(<PolicyForm />);

		fireEvent.change(screen.getByLabelText(/auto-assign threshold/i), {
			target: { value: "0.85" },
		});
		fireEvent.click(screen.getByRole("button", { name: /save policy/i }));

		await waitFor(() => {
			expect(savePolicy).toHaveBeenCalledWith({
				autoAssignThreshold: 0.85,
				maxAssignmentsPerWorker: 8,
				requireLeadReview: true,
				allowSecondarySkills: true,
			});
		});
	});
});
