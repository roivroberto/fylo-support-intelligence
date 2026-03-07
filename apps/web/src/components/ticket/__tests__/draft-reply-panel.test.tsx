import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sendApprovedMock = vi.fn();

vi.mock("convex/react", () => ({
	useAction: () => sendApprovedMock,
}));

vi.mock("../../../../../../packages/backend/convex/replies_reference", () => ({
	sendApprovedReplyReference: {},
}));

import { DraftReplyPanel } from "../draft-reply-panel";

describe("DraftReplyPanel", () => {
	beforeEach(() => {
		sendApprovedMock.mockReset();
	});

	it("stops inviting another send after success", async () => {
		sendApprovedMock.mockResolvedValue({ providerMessageId: "msg_123" });

		render(
			<DraftReplyPanel
				ticketId="ticket_1"
				to="customer@example.com"
				subject="Refund request"
				draft={{
					summary: "Summary",
					recommendedAction: "Action",
					draftReply: "Hello there",
					usedFallback: false,
					generatedAtLabel: "Now",
				}}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Send approved reply" }),
		);

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "Reply sent" })).toBeDisabled();
		});

		expect(screen.getByRole("button", { name: "Reply sent" })).toBeDisabled();
	});
});
