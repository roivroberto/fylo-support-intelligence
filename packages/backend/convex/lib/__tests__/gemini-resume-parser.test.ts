import { describe, expect, it, vi } from "vitest";

import { createGeminiResumeParser } from "../gemini_resume_parser";

describe("createGeminiResumeParser", () => {
	it("sends the PDF inline and parses the first text part", async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({
				candidates: [
					{
						content: {
							parts: [
								{
									text: JSON.stringify({
										primary_skills: ["technical_problem"],
										secondary_skills: ["general_inquiry"],
										languages: ["en"],
										summary:
											"Experienced support agent focused on technical troubleshooting.",
									}),
								},
							],
						},
					},
				],
			}),
		});

		const parser = createGeminiResumeParser({
			apiKey: "AIza-test",
			fetchImpl,
		});

		await expect(
			parser({
				resumeFileName: "resume.pdf",
				resumeMimeType: "application/pdf",
				resumeBase64: "JVBERi0xLjQK",
			}),
		).resolves.toEqual({
			primary_skills: ["technical_problem"],
			secondary_skills: ["general_inquiry"],
			languages: ["en"],
			summary: "Experienced support agent focused on technical troubleshooting.",
		});

		const requestBody = JSON.parse(fetchImpl.mock.calls[0]?.[1]?.body as string) as {
			contents: Array<{ parts: Array<{ inlineData?: { mimeType: string; data: string } }> }>;
		};

		expect(requestBody.contents[0]?.parts[0]?.inlineData).toEqual({
			mimeType: "application/pdf",
			data: "JVBERi0xLjQK",
		});
	});

	it("throws on non-ok responses", async () => {
		const parser = createGeminiResumeParser({
			apiKey: "AIza-test",
			fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 503 }),
		});

		await expect(
			parser({
				resumeFileName: "resume.pdf",
				resumeMimeType: "application/pdf",
				resumeBase64: "JVBERi0xLjQK",
			}),
		).rejects.toThrow("Gemini resume parsing failed with status 503");
	});
});
