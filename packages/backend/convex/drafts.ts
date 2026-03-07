import { makeFunctionReference, queryGeneric as query } from "convex/server";
import { ConvexError, v } from "convex/values";
import {
	generateDeterministicDraftReply,
	generateDraftReplyWithFallback,
	getDraftGeneratedLabel,
} from "./ai/generate_draft_reply";
import { authComponent } from "./auth";
import { canAccessOperationalCorePilot } from "./tickets";

export type TicketDraftWorkspace = {
	summary: string;
	recommendedAction: string;
	draftReply: string;
	usedFallback: boolean;
	fallbackReason: "generator_error" | "invalid_schema" | null;
	generatedAtLabel: string;
};

export const getTicketDraftReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	TicketDraftWorkspace | null
>("drafts:getForTicket");

async function requireCurrentUser(ctx: any) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError("Unauthenticated");
	}

	return user;
}

async function requireOperationalCoreAccess(ctx: any) {
	const user = await requireCurrentUser(ctx);
	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_userId", (q: any) => q.eq("userId", String(user._id)))
		.collect();

	if (!canAccessOperationalCorePilot(memberships)) {
		throw new ConvexError("Forbidden");
	}
}

export const getForTicket = query({
	args: {
		ticketId: v.id("tickets"),
	},
	handler: async (ctx, args) => {
		await requireOperationalCoreAccess(ctx);

		const ticket = await ctx.db.get(args.ticketId);

		if (!ticket) {
			return null;
		}

		const message = await ctx.db.get(ticket.messageId);
		const result = await generateDraftReplyWithFallback(
			generateDeterministicDraftReply,
			{
				ticketId: String(ticket._id),
				subject: ticket.subject,
				requesterEmail: ticket.requesterEmail,
				messageText: message?.text ?? null,
			},
		);

		return {
			summary: result.draft.summary,
			recommendedAction: result.draft.recommended_action,
			draftReply: result.draft.draft_reply,
			usedFallback: result.usedFallback,
			fallbackReason: result.fallbackReason,
			generatedAtLabel: getDraftGeneratedLabel(result.usedFallback),
		};
	},
});
