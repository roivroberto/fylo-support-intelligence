import { internalMutationGeneric as internalMutation } from "convex/server";
import { v } from "convex/values";
import { routeTicket } from "./lib/routing/route_ticket";
import { buildTicketRoutingPatch } from "./tickets";

export const applyRoutingDecision = internalMutation({
	args: {
		ticketId: v.id("tickets"),
		ticket: v.object({
			request_type: v.string(),
			language: v.string(),
			classification_confidence: v.number(),
		}),
		workers: v.array(
			v.object({
				id: v.string(),
				primary: v.array(v.string()),
				secondary: v.array(v.string()),
				load: v.number(),
				capacity: v.number(),
				languages: v.array(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const decision = routeTicket({
			ticket: args.ticket,
			workers: args.workers,
		});
		const patch = buildTicketRoutingPatch(decision, Date.now());

		await ctx.db.patch(args.ticketId, patch as never);

		return {
			...decision,
			patch,
		};
	},
});
