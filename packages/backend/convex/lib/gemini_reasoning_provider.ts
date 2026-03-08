export type GeminiReasoningInput = {
    ticket: {
        id: string;
        subject: string | null;
        requestType: string | null;
        priority: string | null;
    };
    agent: {
        id: string;
        primarySkills: string[];
        secondarySkills: string[];
    };
    deterministicReason: string;
};

export type GeminiReasoningProviderOptions = {
    apiKey: string;
    fetchImpl?: typeof fetch;
    model?: string;
};

function buildReasoningPrompt(input: GeminiReasoningInput) {
    return [
        "You are an AI assistant that explains why a specific support ticket was assigned to a specific agent.",
        "Create a single, dynamic, concise sentence explaining the reasoning.",
        "Incorporate the agent's specific skills into the explanation to make it sound personalized and intelligent.",
        "The explanation must be human-readable and should not mention internal scores, thresholds, or tie-breakers.",
        "DO NOT use first-person or second-person pronouns (like 'I', 'me', 'you', 'your'). Always refer to the agent by their name or in the third person.",
        `Ticket Request Type: ${input.ticket.requestType ?? "Unknown"}`,
        `Ticket Subject: ${input.ticket.subject ?? "Unknown"}`,
        `Ticket Priority: ${input.ticket.priority ?? "Unknown"}`,
        `Agent Primary Skills: ${input.agent.primarySkills.join(", ") || "None"}`,
        `Agent Secondary Skills: ${input.agent.secondarySkills.join(", ") || "None"}`,
        `System Technical Reason: ${input.deterministicReason}`,
        "Return exactly the explanation string, with no markdown fences, no prefixes like 'Reasoning:', and no quotes."
    ].join("\n");
}

function parseGeminiCandidateText(payload: any) {
    const text = payload.candidates
        ?.flatMap((candidate: any) => candidate.content?.parts ?? [])
        .find((part: any) => typeof part.text === "string" && part.text.trim().length > 0)
        ?.text;

    if (typeof text !== "string" || text.trim().length === 0) {
        throw new Error("Gemini response missing candidate text");
    }

    return text.trim().replace(/^["']|["']$/g, "");
}

export function createGeminiReasoningProvider(
    options: GeminiReasoningProviderOptions,
) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const model = options.model ?? "gemma-3-27b-it";

    return async function generateReasoning(input: GeminiReasoningInput) {
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
                            parts: [{ text: buildReasoningPrompt(input) }],
                        },
                    ],
                }),
            },
        );

        if (!response.ok) {
            throw new Error(
                `Gemini reasoning failed with status ${response.status}`,
            );
        }

        return parseGeminiCandidateText(await response.json());
    };
}

export function createGeminiReasoningProviderFromEnv(
    env: NodeJS.ProcessEnv = process.env,
) {
    return createGeminiReasoningProvider({
        apiKey: env.AI_PROVIDER_API_KEY ?? "",
    });
}
