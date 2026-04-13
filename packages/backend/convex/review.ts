import { mutationGeneric as mutation } from "convex/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";
import {
	buildLeadReviewTicketPatch,
	canApplyLeadReview,
} from "./lib/review_workflow";
import { rerouteTicketReference } from "./tickets_reference";

const leadReviewActionValidator = v.union(
	v.literal("approve"),
	v.literal("reassign"),
);

async function requireCurrentUser(ctx: any) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError("Unauthenticated");
	}

	return user;
}

async function requireLeadAccess(ctx: any) {
	const user = await requireCurrentUser(ctx);
	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_userId", (q: any) => q.eq("userId", String(user._id)))
		.collect();

	if (!canApplyLeadReview(memberships)) {
		throw new ConvexError("Forbidden");
	}
}

export const applyLeadReview = mutation({
	args: {
		ticketId: v.id("tickets"),
		action: leadReviewActionValidator,
		assignedWorkerId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await requireLeadAccess(ctx);

		const ticket = await ctx.db.get(args.ticketId);

		if (!ticket) {
			throw new ConvexError("Ticket not found");
		}

		const patch = buildLeadReviewTicketPatch({
			ticket,
			action: args.action,
			assignedWorkerId: args.assignedWorkerId,
			reviewedAt: Date.now(),
		});

		if (args.action === "reassign") {
			const rerouted = await ctx.runMutation(rerouteTicketReference, {
				ticketId: String(args.ticketId),
			});

			return rerouted;
		}

		await ctx.db.patch(args.ticketId, patch as never);

		return patch;
	},
});
