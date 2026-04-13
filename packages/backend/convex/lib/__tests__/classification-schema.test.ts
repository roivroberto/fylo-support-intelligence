import { describe, expect, it } from "vitest";
import { classifyTicketWithFallback } from "../../ai/classify_ticket";
import {
	buildTicketClassificationInput,
	INBOUND_TICKET_SOURCE,
} from "../../tickets";
import { classificationSchema } from "../classification_schema";

describe("classificationSchema", () => {
	it("rejects confidence above 1", () => {
		const parsed = classificationSchema.safeParse({
			classification_confidence: 1.2,
		});

		expect(parsed.success).toBe(false);
	});

	it("accepts a valid classification object", () => {
		const parsed = classificationSchema.safeParse({
			request_type: "billing_issue",
			priority: "high",
			classification_confidence: 0.82,
		});

		expect(parsed.success).toBe(true);
	});

	it("rejects unknown keys", () => {
		const parsed = classificationSchema.safeParse({
			request_type: "billing_issue",
			priority: "high",
			classification_confidence: 0.82,
			extra_field: "should fail",
		});

		expect(parsed.success).toBe(false);
	});
});

describe("classifyTicketWithFallback", () => {
	it("returns the AI classification when it matches the schema", async () => {
		const result = await classifyTicketWithFallback(
			async () => ({
				request_type: "technical_problem",
				priority: "urgent",
				classification_confidence: 0.91,
			}),
			{
				ticketId: "ticket_1",
				subject: "API is down",
				requesterEmail: "ops@example.com",
				messageText: "The API is down for all users.",
			},
		);

		expect(result.usedFallback).toBe(false);
		expect(result.generationSource).toBe("provider");
		expect(result.classification.request_type).toBe("technical_problem");
	});

	it("falls back when the AI output fails schema validation", async () => {
		const result = await classifyTicketWithFallback(
			async () => ({
				request_type: "technical_problem",
				priority: "urgent",
				classification_confidence: 1.2,
			}),
			{
				ticketId: "ticket_1",
				subject: "API is down",
				requesterEmail: "ops@example.com",
				messageText: "The API is down for all users.",
			},
		);

		expect(result.usedFallback).toBe(true);
		expect(result.generationSource).toBe("deterministic");
		expect(result.classification.classification_confidence).toBe(0);
	});

	it("falls back when the AI classifier throws", async () => {
		const result = await classifyTicketWithFallback(
			async () => {
				throw new Error("network unavailable");
			},
			{
				ticketId: "ticket_1",
				subject: "API is down",
				requesterEmail: "ops@example.com",
				messageText: "The API is down for all users.",
			},
		);

		expect(result.usedFallback).toBe(true);
		expect(result.generationSource).toBe("deterministic");
		expect(result.classification.request_type).toBe("general_inquiry");
	});

	it("ignores invalid fallback overrides and still returns deterministic fallback", async () => {
		const result = await classifyTicketWithFallback(
			async () => {
				throw new Error("boom");
			},
			{
				ticketId: "t1",
				subject: null,
				requesterEmail: null,
				messageText: null,
				fallbackClassification: {
					classification_confidence: 5,
				},
			},
		);

		expect(result.usedFallback).toBe(true);
		expect(result.generationSource).toBe("deterministic");
		expect(result.fallbackReason).toBe("classifier_error");
		expect(result.classification).toEqual({
			request_type: "general_inquiry",
			priority: "medium",
			classification_confidence: 0,
		});
	});
});

describe("buildTicketClassificationInput", () => {
	it("creates a strict fallback-backed classification payload from a ticket seed", () => {
		const input = buildTicketClassificationInput("ticket_1", {
			workspaceId: "workspace_1",
			source: INBOUND_TICKET_SOURCE,
			externalId: "email_123",
			messageId: "message_1",
			requesterEmail: "ops@example.com",
			subject: "Refund request",
			receivedAt: 1,
		});

		expect(input.ticketId).toBe("ticket_1");
		expect(input.subject).toBe("Refund request");
		expect(input.requesterEmail).toBe("ops@example.com");
		expect(input.fallbackClassification?.request_type).toBe("general_inquiry");
	});
});
