import { z } from "zod";

export const classificationPrioritySchema = z.enum([
	"low",
	"medium",
	"high",
	"urgent",
	"critical",
]);

export const classificationSchema = z
	.object({
		request_type: z.string().trim().min(1),
		priority: classificationPrioritySchema,
		classification_confidence: z.number().min(0).max(1),
	})
	.strict();

export type TicketClassification = z.infer<typeof classificationSchema>;

export const FALLBACK_TICKET_CLASSIFICATION: TicketClassification = {
	request_type: "general_inquiry",
	priority: "medium",
	classification_confidence: 0,
};

export function parseTicketClassification(input: unknown) {
	const parsed = classificationSchema.safeParse(input);
	return parsed.success ? parsed.data : null;
}

export function createFallbackTicketClassification(
	overrides: Partial<TicketClassification> = {},
) {
	const parsed = classificationSchema.safeParse({
		...FALLBACK_TICKET_CLASSIFICATION,
		...overrides,
	});

	return parsed.success ? parsed.data : FALLBACK_TICKET_CLASSIFICATION;
}
