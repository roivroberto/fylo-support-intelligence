import { describe, expect, it } from "vitest";

import {
	generateDeterministicDraftReply,
	generateDraftReplyWithFallback,
	getDraftGeneratedLabel,
} from "../../ai/generate_draft_reply";

describe("generateDraftReplyWithFallback", () => {
	it("returns generated draft content without fallback when the generator is valid", async () => {
		const result = await generateDraftReplyWithFallback(
			generateDeterministicDraftReply,
			{
				ticketId: "t_123",
				subject: "Refund request",
				requesterEmail: "customer@example.com",
				messageText:
					"I was charged twice for the same order and need help reversing the duplicate payment.",
			},
		);

		expect(result.usedFallback).toBe(false);
		expect(result.fallbackReason).toBeNull();
		expect(result.draft.summary).toContain("Refund request");
		expect(result.draft.recommended_action.length).toBeGreaterThanOrEqual(10);
		expect(result.draft.draft_reply).toContain("customer@example.com");
	});

	it("uses generator_error fallback metadata when the generator throws", async () => {
		const result = await generateDraftReplyWithFallback(
			async () => {
				throw new Error("boom");
			},
			{
				ticketId: "t_123",
				subject: "Refund request",
				requesterEmail: "customer@example.com",
				messageText: "Please help with the duplicate charge.",
			},
		);

		expect(result.usedFallback).toBe(true);
		expect(result.fallbackReason).toBe("generator_error");
		expect(result.draft.summary.length).toBeGreaterThanOrEqual(20);
	});

	it("uses invalid_schema fallback metadata when the generator returns invalid output", async () => {
		const result = await generateDraftReplyWithFallback(
			async () => ({ summary: "too short" }),
			{
				ticketId: "t_123",
				subject: "Refund request",
				requesterEmail: "customer@example.com",
				messageText: "Please help with the duplicate charge.",
			},
		);

		expect(result.usedFallback).toBe(true);
		expect(result.fallbackReason).toBe("invalid_schema");
		expect(result.draft.draft_reply.length).toBeGreaterThanOrEqual(20);
	});
});

describe("getDraftGeneratedLabel", () => {
	it("labels deterministic generated drafts truthfully", () => {
		expect(getDraftGeneratedLabel(false)).toBe("Deterministic generated draft");
	});
});
