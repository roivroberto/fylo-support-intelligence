import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	sendApprovedReplyReference,
	regenerateTicketDraftReference,
} = vi.hoisted(() => ({
	sendApprovedReplyReference: {},
	regenerateTicketDraftReference: {},
}));

const sendApprovedMock = vi.fn();
const regenerateDraftMock = vi.fn();

vi.mock("convex/react", () => ({
	useAction: (reference: unknown) =>
		reference === regenerateTicketDraftReference
			? regenerateDraftMock
			: reference === sendApprovedReplyReference
				? sendApprovedMock
				: (() => {
					throw new Error("Unexpected action reference");
				  })(),
}));

vi.mock("../../../../../../packages/backend/convex/replies_reference", () => ({
	sendApprovedReplyReference,
}));

vi.mock("../../../../../../packages/backend/convex/drafts_reference", () => ({
	regenerateTicketDraftReference,
}));

import {
	DraftReplyPanel,
	getDraftReplyPanelViewState,
} from "../draft-reply-panel";

	describe("getDraftReplyPanelViewState", () => {
		it("returns fresh ticket-local view state immediately when the ticket changes", () => {
			const nextDraft = {
				ticketId: "ticket_2",
				summary: "Ticket two summary",
				recommendedAction: "Ticket two action",
				draftReply: "Ticket two reply body",
				generationSource: "provider" as const,
				usedFallback: false,
				fallbackReason: null,
				generatedAt: 2000,
				generatedAtLabel: "AI generated draft",
			};

			expect(
				getDraftReplyPanelViewState({
					ticketId: "ticket_1",
					draftState: {
						ticketId: "ticket_1",
						summary: "Ticket one summary",
						recommendedAction: "Ticket one action",
						draftReply: "Ticket one reply body",
						generationSource: "deterministic",
						usedFallback: false,
						fallbackReason: null,
						generatedAt: 1000,
						generatedAtLabel: "Deterministic generated draft",
					},
					status: "Stale regenerate failed",
					isSending: true,
					isRegenerating: true,
					hasSent: true,
					currentTicketId: "ticket_2",
					nextDraft,
				}),
			).toEqual({
				ticketId: "ticket_2",
				draftState: nextDraft,
				status: null,
				isSending: false,
				isRegenerating: false,
				hasSent: false,
			});
		});
	});

	describe("DraftReplyPanel", () => {
	beforeEach(() => {
		cleanup();
		sendApprovedMock.mockReset();
		regenerateDraftMock.mockReset();
	});

	it("stops inviting another send after success", async () => {
		sendApprovedMock.mockResolvedValue({ providerMessageId: "msg_123" });

		render(
			<DraftReplyPanel
				ticketId="ticket_1"
				to="customer@example.com"
				subject="Refund request"
				draft={{
					ticketId: "ticket_1",
					summary: "Summary",
					recommendedAction: "Action",
					draftReply: "Hello there",
					generationSource: "provider",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 1000,
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

	it("does not carry stale send state back to the original ticket after navigating away", async () => {
		let finishSend!: (value: { providerMessageId: string }) => void;
		sendApprovedMock.mockReturnValue(
			new Promise((resolve) => {
				finishSend = resolve;
			}),
		);

		const view = render(
			<DraftReplyPanel
				ticketId="ticket_1"
				to="customer@example.com"
				subject="Refund request"
				draft={{
					ticketId: "ticket_1",
					summary: "Ticket one summary",
					recommendedAction: "Ticket one action",
					draftReply: "Ticket one reply body",
					generationSource: "provider",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 1000,
					generatedAtLabel: "AI generated draft",
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Send approved reply" }));

		view.rerender(
			<DraftReplyPanel
				ticketId="ticket_2"
				to="another@example.com"
				subject="Replacement shipment"
				draft={{
					ticketId: "ticket_2",
					summary: "Ticket two summary",
					recommendedAction: "Ticket two action",
					draftReply: "Ticket two reply body",
					generationSource: "provider",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 2000,
					generatedAtLabel: "AI generated draft",
				}}
			/>,
		);

		finishSend({ providerMessageId: "msg_stale" });

		await waitFor(() => {
			expect(screen.getByText("Ticket two summary")).toBeInTheDocument();
		});

		view.rerender(
			<DraftReplyPanel
				ticketId="ticket_1"
				to="customer@example.com"
				subject="Refund request"
				draft={{
					ticketId: "ticket_1",
					summary: "Ticket one summary",
					recommendedAction: "Ticket one action",
					draftReply: "Ticket one reply body",
					generationSource: "provider",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 1000,
					generatedAtLabel: "AI generated draft",
				}}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("Ticket one summary")).toBeInTheDocument();
		});

		expect(screen.queryByText(/Reply sent via Resend \(msg_stale\)/)).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Reply sent" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Send approved reply" })).toBeEnabled();
	});

	it("regenerates the stored draft only when requested", async () => {
		regenerateDraftMock.mockResolvedValue({
			ticketId: "ticket_1",
			summary: "Updated summary",
			recommendedAction: "Updated action",
			draftReply: "Updated reply body",
			generationSource: "deterministic",
			usedFallback: true,
			fallbackReason: "generator_error",
			generatedAt: 2000,
			generatedAtLabel: "Deterministic fallback draft",
		});

		render(
			<DraftReplyPanel
				ticketId="ticket_1"
				to="customer@example.com"
				subject="Refund request"
				draft={{
					ticketId: "ticket_1",
					summary: "Original summary",
					recommendedAction: "Original action",
					draftReply: "Original reply body",
					generationSource: "deterministic",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 1000,
					generatedAtLabel: "Deterministic generated draft",
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /regenerate draft/i }));

		await waitFor(() => {
			expect(regenerateDraftMock).toHaveBeenCalledWith({ ticketId: "ticket_1" });
		});

		expect(screen.getByText("Updated summary")).toBeInTheDocument();
		expect(screen.getByText("Updated action")).toBeInTheDocument();
		expect(screen.getByText("Updated reply body")).toBeInTheDocument();
		expect(
			screen.getByText("Deterministic fallback draft", { selector: "span" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				/Using the deterministic fallback draft because the latest AI generation did not return a usable reply/i,
			),
		).toBeInTheDocument();
	});

	it("sends the currently displayed regenerated draft content", async () => {
		regenerateDraftMock.mockResolvedValue({
			ticketId: "ticket_1",
			summary: "Updated summary",
			recommendedAction: "Updated action",
			draftReply: "Updated regenerated reply",
			generationSource: "provider",
			usedFallback: false,
			fallbackReason: null,
			generatedAt: 2000,
			generatedAtLabel: "AI generated draft",
		});
		sendApprovedMock.mockResolvedValue({ providerMessageId: "msg_123" });

		render(
			<DraftReplyPanel
				ticketId="ticket_1"
				to="customer@example.com"
				subject="Refund request"
				draft={{
					ticketId: "ticket_1",
					summary: "Original summary",
					recommendedAction: "Original action",
					draftReply: "Original reply body",
					generationSource: "deterministic",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 1000,
					generatedAtLabel: "Deterministic generated draft",
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /regenerate draft/i }));

		await waitFor(() => {
			expect(screen.getByText("Updated regenerated reply")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: "Send approved reply" }));

		await waitFor(() => {
			expect(sendApprovedMock).toHaveBeenCalledWith({
				ticketId: "ticket_1",
				draftReply: "Updated regenerated reply",
			});
		});
	});

	it("syncs the displayed draft when the parent rerenders with new draft props", () => {
		const view = render(
			<DraftReplyPanel
				ticketId="ticket_1"
				to="customer@example.com"
				subject="Refund request"
				draft={{
					ticketId: "ticket_1",
					summary: "Original summary",
					recommendedAction: "Original action",
					draftReply: "Original reply body",
					generationSource: "deterministic",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 1000,
					generatedAtLabel: "Deterministic generated draft",
				}}
			/>,
		);

		view.rerender(
			<DraftReplyPanel
				ticketId="ticket_1"
				to="customer@example.com"
				subject="Refund request"
				draft={{
					ticketId: "ticket_1",
					summary: "Rerendered summary",
					recommendedAction: "Rerendered action",
					draftReply: "Rerendered reply body",
					generationSource: "provider",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 2000,
					generatedAtLabel: "AI generated draft",
				}}
			/>,
		);

		expect(screen.getByText("Rerendered summary")).toBeInTheDocument();
		expect(screen.getByText("Rerendered action")).toBeInTheDocument();
		expect(screen.getByText("Rerendered reply body")).toBeInTheDocument();
		expect(
			screen.getByText("AI generated draft", { selector: "span" }),
		).toBeInTheDocument();
	});

	it("shows a loading state and disables send while regeneration is pending", async () => {
		let finishRegeneration!: (value: unknown) => void;
		regenerateDraftMock.mockReturnValue(
			new Promise((resolve) => {
				finishRegeneration = resolve;
			}),
		);

		render(
			<DraftReplyPanel
				ticketId="ticket_1"
				to="customer@example.com"
				subject="Refund request"
				draft={{
					ticketId: "ticket_1",
					summary: "Original summary",
					recommendedAction: "Original action",
					draftReply: "Original reply body",
					generationSource: "deterministic",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 1000,
					generatedAtLabel: "Deterministic generated draft",
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /regenerate draft/i }));

		expect(
			screen.getByRole("button", { name: "Regenerating..." }),
		).toBeDisabled();
		expect(
			screen.getByText("Refreshing draft before send..."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Send approved reply" }),
		).toBeDisabled();

		finishRegeneration({
			ticketId: "ticket_1",
			summary: "Updated summary",
			recommendedAction: "Updated action",
			draftReply: "Updated regenerated reply",
			generationSource: "provider",
			usedFallback: false,
			fallbackReason: null,
			generatedAt: 2000,
			generatedAtLabel: "AI generated draft",
		});

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: "Regenerate draft" }),
			).toBeEnabled();
		});
	});

	it("ignores stale regeneration results after the ticket changes", async () => {
		let finishRegeneration!: (value: unknown) => void;
		regenerateDraftMock.mockReturnValue(
			new Promise((resolve) => {
				finishRegeneration = resolve;
			}),
		);

		const view = render(
			<DraftReplyPanel
				ticketId="ticket_1"
				to="customer@example.com"
				subject="Refund request"
				draft={{
					ticketId: "ticket_1",
					summary: "Ticket one summary",
					recommendedAction: "Ticket one action",
					draftReply: "Ticket one reply body",
					generationSource: "deterministic",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 1000,
					generatedAtLabel: "Deterministic generated draft",
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /regenerate draft/i }));

		view.rerender(
			<DraftReplyPanel
				ticketId="ticket_2"
				to="another@example.com"
				subject="Replacement shipment"
				draft={{
					ticketId: "ticket_2",
					summary: "Ticket two summary",
					recommendedAction: "Ticket two action",
					draftReply: "Ticket two reply body",
					generationSource: "provider",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 2000,
					generatedAtLabel: "AI generated draft",
				}}
			/>,
		);

		finishRegeneration({
			ticketId: "ticket_1",
			summary: "Stale summary",
			recommendedAction: "Stale action",
			draftReply: "Stale reply body",
			generationSource: "provider",
			usedFallback: false,
			fallbackReason: null,
			generatedAt: 3000,
			generatedAtLabel: "AI generated draft",
		});

		await waitFor(() => {
			expect(screen.getByText("Ticket two summary")).toBeInTheDocument();
		});

		expect(screen.queryByText("Stale summary")).not.toBeInTheDocument();
		expect(screen.getByText("Ticket two action")).toBeInTheDocument();
		expect(screen.getByText("Ticket two reply body")).toBeInTheDocument();
	});

	it("ignores stale regeneration errors after the ticket changes", async () => {
		let rejectRegeneration!: (reason?: unknown) => void;
		regenerateDraftMock.mockReturnValue(
			new Promise((_, reject) => {
				rejectRegeneration = reject;
			}),
		);

		const view = render(
			<DraftReplyPanel
				ticketId="ticket_1"
				to="customer@example.com"
				subject="Refund request"
				draft={{
					ticketId: "ticket_1",
					summary: "Ticket one summary",
					recommendedAction: "Ticket one action",
					draftReply: "Ticket one reply body",
					generationSource: "deterministic",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 1000,
					generatedAtLabel: "Deterministic generated draft",
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /regenerate draft/i }));

		view.rerender(
			<DraftReplyPanel
				ticketId="ticket_2"
				to="another@example.com"
				subject="Replacement shipment"
				draft={{
					ticketId: "ticket_2",
					summary: "Ticket two summary",
					recommendedAction: "Ticket two action",
					draftReply: "Ticket two reply body",
					generationSource: "provider",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: 2000,
					generatedAtLabel: "AI generated draft",
				}}
			/>,
		);

		rejectRegeneration(new Error("Stale regenerate failed"));

		await waitFor(() => {
			expect(screen.getByText("Ticket two summary")).toBeInTheDocument();
		});

		expect(screen.queryByText("Stale regenerate failed")).not.toBeInTheDocument();
		expect(screen.getByText("Ticket two action")).toBeInTheDocument();
		expect(screen.getByText("Ticket two reply body")).toBeInTheDocument();
	});
});
