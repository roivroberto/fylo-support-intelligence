import { describe, expect, it, vi } from "vitest";

import { buildApprovedReplyRequest, sendApprovedReply } from "../send_reply";

describe("sendApprovedReply", () => {
	it("records outbound message id when resend succeeds", async () => {
		const resend = { send: vi.fn().mockResolvedValue({ id: "msg_123" }) };

		const result = await sendApprovedReply(resend as never, {
			to: "a@b.com",
			subject: "x",
			html: "<p>x</p>",
			idempotencyKey: "outbound:t1",
		});

		expect(result.providerMessageId).toBe("msg_123");
	});

	it("forwards the outbound idempotency key to resend", async () => {
		const resend = { send: vi.fn().mockResolvedValue({ id: "msg_123" }) };

		await sendApprovedReply(resend as never, {
			to: "a@b.com",
			subject: "x",
			html: "<p>x</p>",
			idempotencyKey: "outbound:t1",
		});

		expect(resend.send).toHaveBeenCalledWith({
			to: "a@b.com",
			subject: "x",
			html: "<p>x</p>",
			idempotencyKey: "outbound:t1",
		});
	});
});

describe("buildApprovedReplyRequest", () => {
	it("uses stored ticket destination and subject", async () => {
		const result = await buildApprovedReplyRequest({
			ticket: {
				_id: "ticket_1",
				requesterEmail: "customer@example.com",
				subject: "Refund request",
				reviewState: "auto_assign_allowed",
				status: "assigned",
			},
			draftReply: "Hello there",
		});

		expect(result.to).toBe("customer@example.com");
		expect(result.subject).toBe("Refund request");
		expect(result.idempotencyKey).toMatch(
			/^resend:outbound:ticket_1:[a-f0-9]{64}$/,
		);
	});

	it("builds a bounded newline-safe stable idempotency key for multiline drafts", async () => {
		const first = await buildApprovedReplyRequest({
			ticket: {
				_id: "ticket_1",
				requesterEmail: "customer@example.com",
				subject: "Refund request",
				reviewState: "auto_assign_allowed",
				status: "assigned",
			},
			draftReply: "Hello there\n\nLine two\nLine three",
		});
		const second = await buildApprovedReplyRequest({
			ticket: {
				_id: "ticket_1",
				requesterEmail: "customer@example.com",
				subject: "Refund request",
				reviewState: "auto_assign_allowed",
				status: "assigned",
			},
			draftReply: "Hello there\n\nLine two\nLine three",
		});

		expect(first.idempotencyKey).toBe(second.idempotencyKey);
		expect(first.idempotencyKey).not.toContain("\n");
		expect(first.idempotencyKey.length).toBeLessThanOrEqual(128);
	});

	it("rejects mismatched destination metadata", async () => {
		await expect(
			buildApprovedReplyRequest({
				ticket: {
					requesterEmail: "customer@example.com",
					subject: "Refund request",
					reviewState: "auto_assign_allowed",
					status: "assigned",
				},
				draftReply: "Hello there",
				requestedTo: "other@example.com",
			}),
		).rejects.toThrow("Reply destination mismatch");
	});

	it("rejects tickets that are not approved for sending", async () => {
		await expect(
			buildApprovedReplyRequest({
				ticket: {
					requesterEmail: "customer@example.com",
					subject: "Refund request",
					reviewState: "manager_verification",
					status: "reviewed",
				},
				draftReply: "Hello there",
			}),
		).rejects.toThrow("Ticket is not approved for sending");
	});
});
