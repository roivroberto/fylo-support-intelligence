import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
	useAction: () => vi.fn(),
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
					reviewState: "manual_triage",
					status: "Awaiting owner",
					routingReason: "Escalated by policy rule",
					assignedWorkerLabel: "Unassigned",
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
		expect(
			rendered.getByText("Lead asked for a final verification pass."),
		).toBeInTheDocument();
		expect(rendered.getByText("Unassigned")).toBeInTheDocument();
	});
});
