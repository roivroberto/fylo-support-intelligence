type GeminiDraftProviderInput = {
	ticketId: string;
	subject: string | null;
	requesterEmail: string | null;
	messageText: string | null;
};

type GeminiDraftProviderOptions = {
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

function buildDraftPrompt(input: GeminiDraftProviderInput) {
	return [
		"You write concise customer support reply drafts.",
		"Return strict JSON with exactly these string keys: summary, recommended_action, draft_reply.",
		"Do not wrap the JSON in markdown fences.",
		`Ticket ID: ${input.ticketId}`,
		`Subject: ${input.subject ?? ""}`,
		`Requester email: ${input.requesterEmail ?? ""}`,
		`Latest message: ${input.messageText ?? ""}`,
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

export function createGeminiDraftProvider(options: GeminiDraftProviderOptions) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const model = options.model ?? "gemma-3-27b-it";
	const omitsJsonMode = model === "gemma-3-27b-it";

	return async function generateDraft(input: GeminiDraftProviderInput) {
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
							parts: [{ text: buildDraftPrompt(input) }],
						},
					],
					...(omitsJsonMode
						? {}
						: {
							generationConfig: {
								responseMimeType: "application/json",
							},
						}),
				}),
			},
		);

		if (!response.ok) {
			throw new Error(`Gemini draft generation failed with status ${response.status}`);
		}

		return parseGeminiCandidateText(
			(await response.json()) as GeminiResponsePayload,
		);
	};
}

export function createGeminiDraftProviderFromEnv(
	env: NodeJS.ProcessEnv = process.env,
) {
	return createGeminiDraftProvider({
		apiKey: env.AI_PROVIDER_API_KEY ?? "",
	});
}
