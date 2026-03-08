import { describe, expect, it, vi } from "vitest";

import { handleResendInboundWebhook } from "../resend";
import { authComponent } from "../../auth";

vi.mock("../../auth", () => ({
	authComponent: {
		getAuthUser: vi.fn().mockResolvedValue(null),
	},
}));

function createRunQuery(workspaceId = "ws_1") {
	return vi.fn(async () => ({ workspaceId }));
}

function createRequest(body: string) {
	return new Request("https://example.com/webhooks/resend", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"svix-id": "msg_123",
			"svix-timestamp": "1700000000",
			"svix-signature": "v1,test",
		},
		body,
	});
}

describe("handleResendInboundWebhook", () => {
	it("rejects invalid signatures", async () => {
		const verifyResendSignature = vi.fn().mockResolvedValue(false);
		const rawBody = '{"type":"email.received"}';

		const response = await handleResendInboundWebhook(
			{ runMutation: vi.fn() } as never,
			createRequest(rawBody),
			{
				secret: "whsec_test",
				verifyResendSignature,
			},
		);

		expect(verifyResendSignature).toHaveBeenCalledWith(
			{
				svixId: "msg_123",
				svixTimestamp: "1700000000",
				svixSignature: "v1,test",
			},
			rawBody,
			"whsec_test",
		);
		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({
			ok: false,
			error: "Invalid signature",
		});
	});

	it("records invalid json failures", async () => {
		const recordIngestFailure = vi.fn().mockResolvedValue({
			status: "recorded",
			reason: "invalid_json",
			payloadDigest: "digest_123",
		});

		const response = await handleResendInboundWebhook(
			{ runMutation: vi.fn() } as never,
			createRequest("{"),
			{
				secret: "whsec_test",
				verifyResendSignature: vi.fn().mockResolvedValue(true),
				createPayloadDigest: vi.fn().mockResolvedValue("digest_123"),
				recordIngestFailure,
			},
		);

		expect(response.status).toBe(400);
		expect(recordIngestFailure).toHaveBeenCalledWith("invalid_json", "digest_123");
		await expect(response.json()).resolves.toEqual({
			ok: false,
			error: "Invalid JSON",
			failure: {
				status: "recorded",
				reason: "invalid_json",
				payloadDigest: "digest_123",
			},
		});
	});

	it("records invalid payload failures", async () => {
		const recordIngestFailure = vi.fn().mockResolvedValue({
			status: "recorded",
			reason: "invalid_payload",
			payloadDigest: "digest_123",
		});

		const response = await handleResendInboundWebhook(
			{ runMutation: vi.fn() } as never,
			createRequest('{"type":"email.received","data":{}}'),
			{
				secret: "whsec_test",
				verifyResendSignature: vi.fn().mockResolvedValue(true),
				createPayloadDigest: vi.fn().mockResolvedValue("digest_123"),
				recordIngestFailure,
			},
		);

		expect(response.status).toBe(400);
		expect(recordIngestFailure).toHaveBeenCalledWith(
			"invalid_payload",
			"digest_123",
		);
		await expect(response.json()).resolves.toEqual({
			ok: false,
			error: "Missing external email id",
			failure: {
				status: "recorded",
				reason: "invalid_payload",
				payloadDigest: "digest_123",
			},
		});
	});

	it("ingests valid inbound emails", async () => {
		const rawBody = JSON.stringify({
			type: "email.received",
			data: {
				email_id: "email_123",
				from: "sender@example.com",
				to: ["support@example.com"],
				subject: "Hello",
				text: "Plain text",
				html: "<p>Plain text</p>",
			},
		});
		const runMutation = vi
			.fn()
			.mockResolvedValueOnce({ messageId: "message_1", created: true })
			.mockResolvedValueOnce({ ticketId: "ticket_1", created: false });
		const runAction = vi.fn().mockResolvedValue({
			classification: {
				request_type: "billing_issue",
				priority: "high",
				classification_confidence: 0.82,
			},
			classificationSource: "provider",
			fallbackReason: null,
			routingDecision: {
				assignedWorkerId: "worker_1",
				reviewState: "auto_assign_allowed",
				routingReason: "Recommended worker_1.",
				scoredCandidates: [],
			},
		});
		const verifyResendSignature = vi.fn().mockResolvedValue(true);

		const response = await handleResendInboundWebhook(
			{ runMutation, runAction, runQuery: createRunQuery("ws_1") } as never,
			createRequest(rawBody),
			{
				secret: "whsec_test",
				verifyResendSignature,
				createPayloadDigest: vi.fn().mockResolvedValue("digest_123"),
				createResendIdempotencyKey: vi.fn().mockResolvedValue("idem_123"),
				now: vi.fn().mockReturnValue(1234),
			},
		);

		expect(verifyResendSignature).toHaveBeenCalledWith(
			{
				svixId: "msg_123",
				svixTimestamp: "1700000000",
				svixSignature: "v1,test",
			},
			rawBody,
			"whsec_test",
		);
		expect(runMutation).toHaveBeenCalledTimes(2);
		expect(runMutation).toHaveBeenNthCalledWith(1, expect.anything(), {
			source: "resend",
			externalId: "email_123",
			idempotencyKey: "idem_123",
			from: "sender@example.com",
			to: ["support@example.com"],
			subject: "Hello",
			text: "Plain text",
			html: "<p>Plain text</p>",
			receivedAt: 1234,
			rawBody,
		});
		expect(runMutation).toHaveBeenNthCalledWith(2, expect.anything(), {
			workspaceId: "ws_1",
			source: "resend",
			externalId: "email_123",
			messageId: "message_1",
			requesterEmail: "sender@example.com",
			subject: "Hello",
			receivedAt: 1234,
		});
		expect(runAction).toHaveBeenNthCalledWith(1, expect.anything(), {
			ticketId: "ticket_1",
			workspaceId: "ws_1",
		});
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			ok: true,
			accepted: true,
			duplicate: false,
			idempotencyKey: "idem_123",
			messageId: "message_1",
			ticketId: "ticket_1",
		});
	});

	it("accepts duplicate webhook deliveries through idempotent mutations", async () => {
		const response = await handleResendInboundWebhook(
			{
				runMutation: vi
					.fn()
					.mockResolvedValueOnce({ messageId: "message_1", created: false })
					.mockResolvedValueOnce({ ticketId: "ticket_1", created: false }),
				runQuery: createRunQuery("ws_1"),
			} as never,
			createRequest(
				JSON.stringify({
					type: "email.received",
					data: { email_id: "email_123" },
				}),
			),
			{
				secret: "whsec_test",
				verifyResendSignature: vi.fn().mockResolvedValue(true),
				createPayloadDigest: vi.fn().mockResolvedValue("digest_123"),
				createResendIdempotencyKey: vi.fn().mockResolvedValue("idem_123"),
				now: vi.fn().mockReturnValue(1234),
			},
		);

		expect((response as Response).status).toBe(200);
		expect(
			((
				(response as unknown as { runMutation?: ReturnType<typeof vi.fn> })
			) as never),
		).toBeDefined();
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			ok: true,
			accepted: false,
			duplicate: true,
			idempotencyKey: "idem_123",
			messageId: "message_1",
			ticketId: "ticket_1",
		});
	});

	it("does not reclassify duplicate webhook deliveries", async () => {
		const runMutation = vi
			.fn()
			.mockResolvedValueOnce({ messageId: "message_1", created: false })
			.mockResolvedValueOnce({ ticketId: "ticket_1", created: false });

		await handleResendInboundWebhook(
			{ runMutation, runQuery: createRunQuery("ws_1") } as never,
			createRequest(
				JSON.stringify({
					type: "email.received",
					data: { email_id: "email_123" },
				}),
			),
			{
				secret: "whsec_test",
				verifyResendSignature: vi.fn().mockResolvedValue(true),
				createPayloadDigest: vi.fn().mockResolvedValue("digest_123"),
				createResendIdempotencyKey: vi.fn().mockResolvedValue("idem_123"),
				now: vi.fn().mockReturnValue(1234),
			},
		);

		expect(runMutation).toHaveBeenCalledTimes(2);
	});

	it("records mutation failures", async () => {
		const recordIngestFailure = vi.fn().mockResolvedValue({
			status: "recorded",
			reason: "ingest_mutation_failed",
			payloadDigest: "digest_123",
		});

		const response = await handleResendInboundWebhook(
			{
				runMutation: vi.fn().mockRejectedValue(new Error("boom")),
			} as never,
			createRequest(
				JSON.stringify({
					type: "email.received",
					data: { email_id: "email_123" },
				}),
			),
			{
				secret: "whsec_test",
				verifyResendSignature: vi.fn().mockResolvedValue(true),
				createPayloadDigest: vi.fn().mockResolvedValue("digest_123"),
				createResendIdempotencyKey: vi.fn().mockResolvedValue("idem_123"),
				recordIngestFailure,
				now: vi.fn().mockReturnValue(1234),
			},
		);

		expect(response.status).toBe(500);
		expect(recordIngestFailure).toHaveBeenCalledWith(
			"ingest_mutation_failed",
			"digest_123",
		);
		await expect(response.json()).resolves.toEqual({
			ok: false,
			error: "Failed to ingest inbound email",
			failure: {
				status: "recorded",
				reason: "ingest_mutation_failed",
				payloadDigest: "digest_123",
			},
		});
	});

	it("uses the first workspace from a query when the webhook is unauthenticated", async () => {
		const rawBody = JSON.stringify({
			type: "email.received",
			data: {
				email_id: "email_123",
				from: "sender@example.com",
				subject: "Hello",
			},
		});
		const runMutation = vi
			.fn()
			.mockResolvedValueOnce({ messageId: "message_1", created: true })
			.mockResolvedValueOnce({ ticketId: "ticket_1", created: true })
		const runAction = vi.fn().mockResolvedValue({ ok: true });

		const response = await handleResendInboundWebhook(
			{
				runMutation,
				runAction,
				runQuery: createRunQuery("ws_1"),
			} as never,
			createRequest(rawBody),
			{
				secret: "whsec_test",
				verifyResendSignature: vi.fn().mockResolvedValue(true),
				createPayloadDigest: vi.fn().mockResolvedValue("digest_123"),
				createResendIdempotencyKey: vi.fn().mockResolvedValue("idem_123"),
				now: vi.fn().mockReturnValue(1234),
			},
		);

		expect(response.status).toBe(200);
		expect(runMutation).toHaveBeenNthCalledWith(2, expect.anything(), {
			workspaceId: "ws_1",
			source: "resend",
			externalId: "email_123",
			messageId: "message_1",
			requesterEmail: "sender@example.com",
			subject: "Hello",
			receivedAt: 1234,
		});
		expect(runAction).toHaveBeenNthCalledWith(1, expect.anything(), {
			ticketId: "ticket_1",
			workspaceId: "ws_1",
		});
	});
});
