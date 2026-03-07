import { describe, expect, it, vi } from "vitest";

import { createGeminiTicketClassificationProvider } from "../gemini_classification_provider";

describe("createGeminiTicketClassificationProvider", () => {
	it("posts a classification request using the default model", async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				candidates: [
					{
						content: {
							parts: [
								{
									text: JSON.stringify({
										request_type: "billing_issue",
										priority: "high",
										classification_confidence: 0.82,
									}),
								},
							],
						},
					},
				],
			}),
		});

		const provider = createGeminiTicketClassificationProvider({
			apiKey: "AIza-test",
			fetchImpl,
		});

		const result = await provider({
			ticketId: "ticket_1",
			subject: "Refund request",
			requesterEmail: "ops@example.com",
			messageText: "Please refund the duplicate charge.",
		});

		expect(result).toEqual({
			request_type: "billing_issue",
			priority: "high",
			classification_confidence: 0.82,
		});
		expect(fetchImpl).toHaveBeenCalledWith(
			"https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=AIza-test",
			expect.objectContaining({
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			}),
		);
	});

	it("throws when the api key is missing", async () => {
		const provider = createGeminiTicketClassificationProvider({
			apiKey: "",
			fetchImpl: vi.fn(),
		});

		await expect(
			provider({
				ticketId: "ticket_1",
				subject: null,
				requesterEmail: null,
				messageText: null,
			}),
		).rejects.toThrow("AI_PROVIDER_API_KEY is required");
	});
});
