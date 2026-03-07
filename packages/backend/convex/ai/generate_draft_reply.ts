import { actionGeneric as action } from "convex/server";
import { v } from "convex/values";

import {
	createFallbackDraftReply,
	type DraftReply,
	parseDraftReply,
} from "../lib/draft_schema";
import { createGeminiDraftProviderFromEnv } from "../lib/gemini_draft_provider";

export type DraftGenerationSource = "provider" | "deterministic";

export type GenerateDraftReplyInput = {
	ticketId: string;
	subject: string | null;
	requesterEmail: string | null;
	messageText: string | null;
	fallbackDraft?: Partial<DraftReply>;
};

export type GenerateDraftReplyResult = {
	draft: DraftReply;
	generationSource: DraftGenerationSource;
	usedFallback: boolean;
	fallbackReason: "generator_error" | "invalid_schema" | null;
};

type DraftGenerationFailureReason = Exclude<
	GenerateDraftReplyResult["fallbackReason"],
	null
>;

function buildDeterministicFallback(input: GenerateDraftReplyInput) {
	const subject = input.subject?.trim() || "the request";
	const requester = input.requesterEmail?.trim() || "the customer";
	const excerpt = input.messageText?.trim().slice(0, 240);

	return createFallbackDraftReply({
		summary: excerpt
			? `Customer ${requester} reached out about ${subject}. Key context from the latest message: ${excerpt}`
			: `Customer ${requester} reached out about ${subject} and needs an operations follow-up with confirmed next steps.`,
		recommended_action:
			"Confirm ownership, validate the request details, and send a reviewed reply.",
		draft_reply: `Hi${input.requesterEmail ? " " + requester : " there"},\n\nThanks for reaching out about ${subject}. We reviewed your request and are confirming the right next step with our operations team now. We'll follow up shortly with a concrete update.\n\nBest,\nOperations`,
		...input.fallbackDraft,
	});
}

export async function generateDeterministicDraftReply(
	input: GenerateDraftReplyInput,
) {
	const subject = input.subject?.trim() || "the request";
	const requester = input.requesterEmail?.trim() || "the customer";
	const excerpt = input.messageText?.trim().replace(/\s+/g, " ").slice(0, 180);

	return (
		parseDraftReply({
		summary: excerpt
			? `Customer ${requester} needs support with ${subject}. Latest message context: ${excerpt}`
			: `Customer ${requester} needs support with ${subject} and expects a clear operational update.`,
		recommended_action:
			"Confirm the request details, verify ownership, and send the prepared response.",
		draft_reply: `Hi ${requester},\n\nThanks for contacting us about ${subject}. I reviewed your message and we're checking the relevant details now. We'll follow up with the confirmed next step as soon as that review is complete.\n\nBest,\nOperations`,
		}) ?? buildDeterministicFallback(input)
	);
}

function warnDraftGenerationFallback(input: {
	generationSource: DraftGenerationSource;
	fallbackReason: DraftGenerationFailureReason;
	error?: unknown;
}) {
	console.warn("draft_generation_fallback", {
		generationSource: input.generationSource,
		fallbackReason: input.fallbackReason,
		error:
			input.error instanceof Error ? input.error.message : input.error ?? null,
	});
}

export function getDraftGeneratedLabel(
	input:
		| boolean
		| { generationSource: DraftGenerationSource; usedFallback: boolean },
) {
	const metadata =
		typeof input === "boolean"
			? { generationSource: "deterministic" as const, usedFallback: input }
			: input;

	if (metadata.usedFallback) {
		return "Deterministic fallback draft";
	}

	return metadata.generationSource === "provider"
		? "AI generated draft"
		: "Deterministic generated draft";
}

function buildFallbackResult(
	input: GenerateDraftReplyInput,
	reason: DraftGenerationFailureReason,
): GenerateDraftReplyResult {
	return {
		draft: buildDeterministicFallback(input),
		generationSource: "deterministic",
		usedFallback: true,
		fallbackReason: reason,
	};
}

async function resolveGeneratedDraft(
	generator: (input: GenerateDraftReplyInput) => Promise<unknown>,
	input: GenerateDraftReplyInput,
	generationSource: DraftGenerationSource,
): Promise<GenerateDraftReplyResult> {
	try {
		const parsed = parseDraftReply(await generator(input));
		if (parsed) {
			return {
				draft: parsed,
				generationSource,
				usedFallback: false,
				fallbackReason: null,
			};
		}

		warnDraftGenerationFallback({
			generationSource,
			fallbackReason: "invalid_schema",
		});
		return buildFallbackResult(input, "invalid_schema");
	} catch (error) {
		warnDraftGenerationFallback({
			generationSource,
			fallbackReason: "generator_error",
			error,
		});
		return buildFallbackResult(input, "generator_error");
	}
}

export async function generateDraftReplyWithFallback(
	generator: (input: GenerateDraftReplyInput) => Promise<unknown>,
	input: GenerateDraftReplyInput,
): Promise<GenerateDraftReplyResult> {
	return resolveGeneratedDraft(generator, input, "deterministic");
}

export async function generateProviderBackedDraftReply(
	deps: {
		provider: (input: GenerateDraftReplyInput) => Promise<unknown>;
	},
	input: GenerateDraftReplyInput,
): Promise<GenerateDraftReplyResult> {
	return resolveGeneratedDraft(deps.provider, input, "provider");
}

async function runAiDraftGenerator(input: GenerateDraftReplyInput) {
	return generateProviderBackedDraftReply(
		{
			provider: createGeminiDraftProviderFromEnv(),
		},
		input,
	);
}

export const generateDraftReply = action({
	args: {
		ticketId: v.string(),
		subject: v.union(v.string(), v.null()),
		requesterEmail: v.union(v.string(), v.null()),
		messageText: v.union(v.string(), v.null()),
		fallbackDraft: v.optional(
			v.object({
				summary: v.optional(v.string()),
				recommended_action: v.optional(v.string()),
				draft_reply: v.optional(v.string()),
			}),
		),
	},
	handler: async (_ctx, args) => {
		return runAiDraftGenerator(args);
	},
});
