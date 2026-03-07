import { actionGeneric as action } from "convex/server";
import { v } from "convex/values";
import {
	createFallbackTicketClassification,
	parseTicketClassification,
	type TicketClassification,
} from "../lib/classification_schema";

export type ClassifyTicketInput = {
	ticketId: string;
	subject: string | null;
	requesterEmail: string | null;
	fallbackClassification?: Partial<TicketClassification>;
};

export type ClassifyTicketResult = {
	classification: TicketClassification;
	usedFallback: boolean;
	fallbackReason: "classifier_error" | "invalid_schema" | null;
};

export async function classifyTicketWithFallback(
	classifier: (input: ClassifyTicketInput) => Promise<unknown>,
	input: ClassifyTicketInput,
): Promise<ClassifyTicketResult> {
	try {
		const parsed = parseTicketClassification(await classifier(input));
		if (parsed) {
			return {
				classification: parsed,
				usedFallback: false,
				fallbackReason: null,
			};
		}
	} catch {
		return {
			classification: createFallbackTicketClassification(
				input.fallbackClassification,
			),
			usedFallback: true,
			fallbackReason: "classifier_error",
		};
	}

	return {
		classification: createFallbackTicketClassification(
			input.fallbackClassification,
		),
		usedFallback: true,
		fallbackReason: "invalid_schema",
	};
}

async function runAiClassifier(_input: ClassifyTicketInput) {
	throw new Error("AI classifier not configured");
}

export const classifyTicket = action({
	args: {
		ticketId: v.string(),
		subject: v.union(v.string(), v.null()),
		requesterEmail: v.union(v.string(), v.null()),
		fallbackClassification: v.optional(
			v.object({
				request_type: v.optional(v.string()),
				priority: v.optional(
					v.union(
						v.literal("low"),
						v.literal("medium"),
						v.literal("high"),
						v.literal("urgent"),
						v.literal("critical"),
					),
				),
				classification_confidence: v.optional(v.number()),
			}),
		),
	},
	handler: async (_ctx, args) => {
		return classifyTicketWithFallback(runAiClassifier, args);
	},
});
