import { describe, expect, it, vi } from "vitest";

import {
	finalizeOutboundMessageReference,
	OUTBOUND_MESSAGE_SENT,
	OUTBOUND_MESSAGE_SOURCE,
	reserveOutboundMessageReference,
} from "../../messages";
import {
	getApprovedReplyTicketReference,
	sendApprovedHandler,
} from "../../replies";

describe("sendApprovedHandler", () => {
	it("reserves, sends, and finalizes approved replies", async () => {
		const runQuery = vi.fn().mockResolvedValue({
			_id: "ticket_1",
			requesterEmail: "customer@example.com",
			subject: "Refund request",
			reviewState: "auto_assign_allowed",
			status: "assigned",
		});
		const runMutation = vi
			.fn()
			.mockResolvedValueOnce({
				messageId: "message_1",
				created: true,
				deliveryStatus: "pending",
				providerMessageId: null,
			})
			.mockResolvedValueOnce({
				messageId: "message_1",
				providerMessageId: "msg_123",
			});
		const buildApprovedReplyRequest = vi.fn().mockResolvedValue({
			to: "customer@example.com",
			subject: "Refund request",
			text: "Hello there",
			html: "<p>Hello there</p>",
			idempotencyKey: "resend:outbound:ticket_1:abc",
		});
		const sendApprovedReply = vi
			.fn()
			.mockResolvedValue({ providerMessageId: "msg_123" });
		const now = vi.fn().mockReturnValueOnce(1000).mockReturnValueOnce(2000);

		const result = await sendApprovedHandler(
			{ runQuery, runMutation } as never,
			{
				ticketId: "ticket_1",
				draftReply: "Hello there",
			},
			{
				createResendClientFromEnv: () => ({
					from: "ops@example.com",
					send: vi.fn(),
				}),
				buildApprovedReplyRequest,
				sendApprovedReply,
				now,
			},
		);

		expect(runQuery).toHaveBeenCalledWith(getApprovedReplyTicketReference, {
			ticketId: "ticket_1",
		});
		expect(runMutation).toHaveBeenNthCalledWith(
			1,
			reserveOutboundMessageReference,
			{
				source: OUTBOUND_MESSAGE_SOURCE,
				idempotencyKey: "resend:outbound:ticket_1:abc",
				ticketId: "ticket_1",
				from: "ops@example.com",
				to: ["customer@example.com"],
				subject: "Refund request",
				text: "Hello there",
				html: "<p>Hello there</p>",
				rawBody: JSON.stringify({ state: "pending" }),
				createdAt: 1000,
			},
		);
		expect(sendApprovedReply).toHaveBeenCalledWith(
			expect.objectContaining({ from: "ops@example.com" }),
			{
				to: "customer@example.com",
				subject: "Refund request",
				html: "<p>Hello there</p>",
				idempotencyKey: "resend:outbound:ticket_1:abc",
			},
		);
		expect(runMutation).toHaveBeenNthCalledWith(
			2,
			finalizeOutboundMessageReference,
			{
				messageId: "message_1",
				providerMessageId: "msg_123",
				sentAt: 2000,
				rawBody: JSON.stringify({
					state: "sent",
					providerMessageId: "msg_123",
					sentAt: 2000,
				}),
			},
		);
		expect(result).toEqual({
			messageId: "message_1",
			providerMessageId: "msg_123",
		});
	});

	it("short-circuits when the outbound message was already sent", async () => {
		const runMutation = vi.fn().mockResolvedValue({
			messageId: "message_1",
			created: false,
			deliveryStatus: OUTBOUND_MESSAGE_SENT,
			providerMessageId: "msg_123",
		});
		const sendApprovedReply = vi.fn();

		const result = await sendApprovedHandler(
			{
				runQuery: vi.fn().mockResolvedValue({
					_id: "ticket_1",
					requesterEmail: "customer@example.com",
					subject: "Refund request",
					reviewState: "auto_assign_allowed",
					status: "assigned",
				}),
				runMutation,
			} as never,
			{
				ticketId: "ticket_1",
				draftReply: "Hello there",
			},
			{
				createResendClientFromEnv: () => ({
					from: "ops@example.com",
					send: vi.fn(),
				}),
				buildApprovedReplyRequest: vi.fn().mockResolvedValue({
					to: "customer@example.com",
					subject: "Refund request",
					text: "Hello there",
					html: "<p>Hello there</p>",
					idempotencyKey: "resend:outbound:ticket_1:abc",
				}),
				sendApprovedReply,
				now: vi.fn().mockReturnValue(1000),
			},
		);

		expect(sendApprovedReply).not.toHaveBeenCalled();
		expect(runMutation).toHaveBeenCalledTimes(1);
		expect(result).toEqual({
			messageId: "message_1",
			providerMessageId: "msg_123",
		});
	});

	it("surfaces finalize failures after a successful provider send", async () => {
		const runMutation = vi
			.fn()
			.mockResolvedValueOnce({
				messageId: "message_1",
				created: true,
				deliveryStatus: "pending",
				providerMessageId: null,
			})
			.mockRejectedValueOnce(new Error("finalize failed"));
		const sendApprovedReply = vi
			.fn()
			.mockResolvedValue({ providerMessageId: "msg_123" });

		await expect(
			sendApprovedHandler(
				{
					runQuery: vi.fn().mockResolvedValue({
						_id: "ticket_1",
						requesterEmail: "customer@example.com",
						subject: "Refund request",
						reviewState: "auto_assign_allowed",
						status: "assigned",
					}),
					runMutation,
				} as never,
				{
					ticketId: "ticket_1",
					draftReply: "Hello there",
				},
				{
					createResendClientFromEnv: () => ({
						from: "ops@example.com",
						send: vi.fn(),
					}),
					buildApprovedReplyRequest: vi.fn().mockResolvedValue({
						to: "customer@example.com",
						subject: "Refund request",
						text: "Hello there",
						html: "<p>Hello there</p>",
						idempotencyKey: "resend:outbound:ticket_1:abc",
					}),
					sendApprovedReply,
					now: vi.fn().mockReturnValueOnce(1000).mockReturnValueOnce(2000),
				},
			),
		).rejects.toThrow(
			"Failed to finalize approved reply send for messageId=message_1 providerMessageId=msg_123: finalize failed",
		);

		expect(sendApprovedReply).toHaveBeenCalledWith(
			expect.objectContaining({ from: "ops@example.com" }),
			{
				to: "customer@example.com",
				subject: "Refund request",
				html: "<p>Hello there</p>",
				idempotencyKey: "resend:outbound:ticket_1:abc",
			},
		);
		expect(runMutation).toHaveBeenNthCalledWith(
			2,
			finalizeOutboundMessageReference,
			{
				messageId: "message_1",
				providerMessageId: "msg_123",
				sentAt: 2000,
				rawBody: JSON.stringify({
					state: "sent",
					providerMessageId: "msg_123",
					sentAt: 2000,
				}),
			},
		);
	});
});
