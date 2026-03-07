import { describe, expect, it, vi } from "vitest";

import { createGeminiDraftProvider } from "../gemini_draft_provider";

describe("createGeminiDraftProvider", () => {
	it("omits JSON mode for the default Gemma request and parses the first text part", async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({
				candidates: [
					{
						content: {
							parts: [
								{ inlineData: { mimeType: "text/plain" } },
								{
									text: JSON.stringify({
										summary:
											"Customer needs a confirmed update on the replacement shipment timeline.",
										recommended_action:
											"Confirm the warehouse handoff and share the latest ETA.",
										draft_reply:
											"Hi customer@example.com,\n\nThanks for your patience. We're confirming the warehouse handoff now and will follow up with the latest ETA shortly.\n\nBest,\nOperations",
									}),
								},
							],
						},
					},
				],
			}),
		});

		const provider = createGeminiDraftProvider({
			apiKey: "AIza-test",
			fetchImpl,
		});

		await expect(
			provider({
				ticketId: "ticket_1",
				subject: "Replacement shipment",
				requesterEmail: "customer@example.com",
				messageText: "Can you confirm when this ships?",
			}),
		).resolves.toEqual({
			summary:
				"Customer needs a confirmed update on the replacement shipment timeline.",
			recommended_action:
				"Confirm the warehouse handoff and share the latest ETA.",
			draft_reply:
				"Hi customer@example.com,\n\nThanks for your patience. We're confirming the warehouse handoff now and will follow up with the latest ETA shortly.\n\nBest,\nOperations",
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

		const requestBody = JSON.parse(fetchImpl.mock.calls[0]?.[1]?.body as string) as {
			generationConfig?: { responseMimeType?: string };
			contents: Array<{ parts: Array<{ text: string }> }>;
		};

		expect(requestBody.generationConfig).toBeUndefined();
		expect(requestBody.contents[0]?.parts[0]?.text).toContain(
			"Ticket ID: ticket_1",
		);
	});

	it("omits JSON mode for an explicit Gemma model override", async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({
				candidates: [
					{
						content: {
							parts: [
								{
									text: JSON.stringify({
										summary: "Customer needs a replacement shipment update.",
										recommended_action: "Share the latest shipment ETA.",
										draft_reply:
											"Hi customer@example.com,\n\nWe are checking the latest shipment ETA now and will follow up shortly.\n\nBest,\nOperations",
									}),
								},
							],
						},
					},
				],
			}),
		});

		const provider = createGeminiDraftProvider({
			apiKey: "AIza-test",
			fetchImpl,
			model: "gemma-3-27b-it",
		});

		await provider({
			ticketId: "ticket_2",
			subject: "Replacement shipment",
			requesterEmail: "customer@example.com",
			messageText: "Can you confirm when this ships?",
		});

		const requestBody = JSON.parse(fetchImpl.mock.calls[0]?.[1]?.body as string) as {
			generationConfig?: { responseMimeType?: string };
		};

		expect(requestBody.generationConfig).toBeUndefined();
	});

	it("throws when Gemini returns a non-ok response", async () => {
		const provider = createGeminiDraftProvider({
			apiKey: "AIza-test",
			fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 503 }),
		});

		await expect(
			provider({
				ticketId: "ticket_1",
				subject: null,
				requesterEmail: null,
				messageText: null,
			}),
		).rejects.toThrow("Gemini draft generation failed with status 503");
	});

	it("throws when Gemini does not return any text parts", async () => {
		const provider = createGeminiDraftProvider({
			apiKey: "AIza-test",
			fetchImpl: vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({
					candidates: [{ content: { parts: [{ inlineData: { mimeType: "x" } }] } }],
				}),
			}),
		});

		await expect(
			provider({
				ticketId: "ticket_1",
				subject: null,
				requesterEmail: null,
				messageText: null,
			}),
		).rejects.toThrow("Gemini response missing candidate text");
	});

	it("parses fenced JSON responses", async () => {
		const provider = createGeminiDraftProvider({
			apiKey: "AIza-test",
			fetchImpl: vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({
					candidates: [
						{
							content: {
								parts: [
									{
										text: "```json\n{\"summary\":\"Customer needs a clear shipment update for the delayed order.\",\"recommended_action\":\"Confirm the handoff and send the ETA.\",\"draft_reply\":\"Hi there,\\n\\nWe are confirming the shipment ETA now and will follow up shortly.\\n\\nBest,\\nOperations\"}\n```",
									},
								],
							},
						},
					],
				}),
			}),
		});

		await expect(
			provider({
				ticketId: "ticket_1",
				subject: null,
				requesterEmail: null,
				messageText: null,
			}),
		).resolves.toMatchObject({
			summary: "Customer needs a clear shipment update for the delayed order.",
			recommended_action: "Confirm the handoff and send the ETA.",
		});
	});
});
