type GeminiResumeParserInput = {
	resumeFileName: string | null;
	resumeMimeType: string | null;
	resumeBase64: string;
};

type GeminiResumeParserOptions = {
	apiKey: string;
	fetchImpl?: typeof fetch;
	model?: string;
};

type GeminiResponsePayload = {
	candidates?: Array<{
		content?: {
			parts?: Array<{
				text?: unknown;
			}>;
		};
	}>;
};

function buildResumePrompt() {
	return [
		"You extract routing-ready agent skills from resumes for support ticket assignment.",
		"Return strict JSON with exactly these keys: primary_skills, secondary_skills, languages, summary.",
		"primary_skills and secondary_skills must contain only these request types when supported: billing_issue, refund_request, technical_problem, account_access, feature_request, complaint, general_inquiry.",
		"languages should use short codes like en or fil whenever possible.",
		"summary must be a concise plain-English sentence or two.",
		"Do not wrap the JSON in markdown fences.",
	].join("\n");
}

function parseGeminiCandidateText(payload: GeminiResponsePayload) {
	const text = payload.candidates
		?.flatMap((candidate) => candidate.content?.parts ?? [])
		.find((part) => typeof part.text === "string" && part.text.trim().length > 0)
		?.text;

	if (typeof text !== "string" || text.trim().length === 0) {
		throw new Error("Gemini response missing candidate text");
	}

	const normalized = text
		.trim()
		.replace(/^```json\s*/i, "")
		.replace(/^```\s*/i, "")
		.replace(/\s*```$/, "");

	return JSON.parse(normalized);
}

export function createGeminiResumeParser(options: GeminiResumeParserOptions) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const model = options.model ?? "gemma-3-27b-it";

	return async function parseResume(input: GeminiResumeParserInput) {
		if (!options.apiKey) {
			throw new Error("AI_PROVIDER_API_KEY is required");
		}

		const response = await fetchImpl(
			`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${options.apiKey}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					contents: [
						{
							role: "user",
							parts: [
								{
									inlineData: {
										mimeType: input.resumeMimeType ?? "application/pdf",
										data: input.resumeBase64,
									},
								},
								{
									text: [
										buildResumePrompt(),
										`Resume file name: ${input.resumeFileName ?? "resume.pdf"}`,
									].join("\n"),
								},
							],
						},
					],
				}),
			},
		);

		if (!response.ok) {
			throw new Error(`Gemini resume parsing failed with status ${response.status}`);
		}

		return parseGeminiCandidateText(
			(await response.json()) as GeminiResponsePayload,
		);
	};
}

export function createGeminiResumeParserFromEnv(
	env: NodeJS.ProcessEnv = process.env,
) {
	return createGeminiResumeParser({
		apiKey: env.AI_PROVIDER_API_KEY ?? "",
	});
}
