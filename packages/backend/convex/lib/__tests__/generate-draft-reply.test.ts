import { describe, expect, it, vi } from "vitest";

import {
	generateDeterministicDraftReply,
	generateDraftReplyWithFallback,
	generateProviderBackedDraftReply,
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

	it("labels provider-backed drafts truthfully", () => {
		expect(
			getDraftGeneratedLabel({
				generationSource: "provider",
				usedFallback: false,
			}),
		).toBe("AI generated draft");
	});
});

describe("generateProviderBackedDraftReply", () => {
	it("returns parsed provider draft content without fallback when the provider response is valid", async () => {
		const provider = vi.fn(async () => ({
			summary:
				"Customer needs a status update about the delayed replacement shipment.",
			recommended_action:
				"Confirm the warehouse handoff and send the customer the current ETA.",
				draft_reply:
					"Hi customer@example.com,\n\nThanks for your patience. I checked the replacement shipment and we're confirming the warehouse handoff now. I'll follow up with the current ETA as soon as that confirmation lands.\n\nBest,\nOperations",
		}));

		const result = await generateProviderBackedDraftReply(
			{
				provider,
			},
			{
				ticketId: "t_123",
				subject: "Replacement shipment",
				requesterEmail: "customer@example.com",
				messageText:
					"Can you confirm when the replacement order is actually shipping?",
			},
		);

		expect(provider).toHaveBeenCalledOnce();
		expect(result.generationSource).toBe("provider");
		expect(result.usedFallback).toBe(false);
		expect(result.fallbackReason).toBeNull();
		expect(result.draft).toEqual({
			summary:
				"Customer needs a status update about the delayed replacement shipment.",
			recommended_action:
				"Confirm the warehouse handoff and send the customer the current ETA.",
			draft_reply:
				"Hi customer@example.com,\n\nThanks for your patience. I checked the replacement shipment and we're confirming the warehouse handoff now. I'll follow up with the current ETA as soon as that confirmation lands.\n\nBest,\nOperations",
		});
	});

	it("uses deterministic fallback metadata when the provider returns invalid output", async () => {
		const provider = vi.fn(async () => ({ summary: "too short" }));

		const result = await generateProviderBackedDraftReply(
			{
				provider,
			},
			{
				ticketId: "t_123",
				subject: "Replacement shipment",
				requesterEmail: "customer@example.com",
				messageText:
					"Can you confirm when the replacement order is actually shipping?",
			},
		);

		expect(provider).toHaveBeenCalledOnce();
		expect(result.generationSource).toBe("deterministic");
		expect(result.usedFallback).toBe(true);
		expect(result.fallbackReason).toBe("invalid_schema");
		expect(result.draft.draft_reply.length).toBeGreaterThanOrEqual(20);
	});

	it("warns when provider errors trigger deterministic fallback", async () => {
		const provider = vi.fn(async () => {
			throw new Error("provider boom");
		});
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = await generateProviderBackedDraftReply(
			{
				provider,
			},
			{
				ticketId: "t_123",
				subject: "Replacement shipment",
				requesterEmail: "customer@example.com",
				messageText:
					"Can you confirm when the replacement order is actually shipping?",
			},
		);

		expect(result.usedFallback).toBe(true);
		expect(result.fallbackReason).toBe("generator_error");
		expect(warn).toHaveBeenCalledWith(
			"draft_generation_fallback",
			expect.objectContaining({
				generationSource: "provider",
				fallbackReason: "generator_error",
			}),
		);

		warn.mockRestore();
	});
});
