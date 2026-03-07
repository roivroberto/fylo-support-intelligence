import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const refresh = vi.fn();

vi.mock("convex/react", () => ({
	useAction: () => vi.fn(),
	useMutation: () => vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		refresh,
	}),
}));

vi.mock("../../../../../../packages/backend/convex/replies_reference", () => ({
	sendApprovedReplyReference: {},
}));

import { TicketDetail } from "../ticket-detail";

describe("TicketDetail", () => {
	it("shows current review state badge", () => {
		render(
			<TicketDetail
				ticket={{ id: "t1", reviewState: "manager_verification" }}
			/>,
		);

		expect(screen.getByText("manager_verification")).toBeInTheDocument();
	});

	it("renders assignment context and notes", () => {
		const view = render(
			<TicketDetail
				ticket={{
					id: "t1",
					requestType: "billing_issue",
					priority: "high",
					classificationConfidence: 0.79,
					classificationSource: "provider",
					reviewState: "manual_triage",
					status: "Awaiting owner",
					routingReason: "Escalated by policy rule",
					assignedWorkerLabel: "Unassigned",
					recommendedAssigneeOptions: [
						{
							id: "worker_1",
							label: "worker_1",
							skillMatchTier: "primary",
							capacityRemaining: 3,
							languageMatch: true,
						},
					],
					notes: [
						{
							id: "n1",
							body: "Lead asked for a final verification pass.",
							authorLabel: "Ops lead",
							createdAtLabel: "just now",
						},
					],
				}}
			/>,
		);
		const rendered = within(view.container);

		expect(rendered.getByText("Escalated by policy rule")).toBeInTheDocument();
		expect(rendered.getByText("billing_issue")).toBeInTheDocument();
		expect(rendered.getByText("79% (provider)")).toBeInTheDocument();
		expect(
			rendered.getByText("Lead asked for a final verification pass."),
		).toBeInTheDocument();
		expect(rendered.getByText("Unassigned")).toBeInTheDocument();
		expect(rendered.getByText("worker_1 is the current top recommendation (primary, 3 open slots).")).toBeInTheDocument();
	});
});
