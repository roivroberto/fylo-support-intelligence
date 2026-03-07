import { z } from "zod";

export const draftReplySchema = z
	.object({
		summary: z.string().trim().min(20),
		recommended_action: z.string().trim().min(10),
		draft_reply: z.string().trim().min(20),
	})
	.strict();

export type DraftReply = z.infer<typeof draftReplySchema>;

export const FALLBACK_DRAFT_REPLY: DraftReply = {
	summary:
		"Customer reached out and needs a clear follow-up from the operations team.",
	recommended_action: "Review the request and send a human-checked reply.",
	draft_reply:
		"Hi there,\n\nThanks for reaching out. We reviewed your request and are preparing the next step from our operations team. We'll follow up shortly with a confirmed update.\n\nBest,\nOperations",
};

export function parseDraftReply(input: unknown) {
	const parsed = draftReplySchema.safeParse(input);
	return parsed.success ? parsed.data : null;
}

export function createFallbackDraftReply(overrides: Partial<DraftReply> = {}) {
	const parsed = draftReplySchema.safeParse({
		...FALLBACK_DRAFT_REPLY,
		...overrides,
	});

	return parsed.success ? parsed.data : FALLBACK_DRAFT_REPLY;
}
