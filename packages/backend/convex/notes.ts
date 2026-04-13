import {
	mutationGeneric as mutation,
	queryGeneric as query,
} from "convex/server";
import { ConvexError, v } from "convex/values";

import { authComponent } from "./auth";
import { canAccessOperationalCorePilot } from "./tickets";

async function requireCurrentUser(ctx: any) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError("Unauthenticated");
	}

	return user as {
		_id: unknown;
		name?: string | null;
		email?: string | null;
	};
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

	return user;
}

function resolveAuthorLabel(user: {
	_id: unknown;
	name?: string | null;
	email?: string | null;
}) {
	return user.name ?? user.email ?? String(user._id);
}

export const listForTicket = query({
	args: {
		ticketId: v.id("tickets"),
	},
	handler: async (ctx, args) => {
		await requireOperationalCoreAccess(ctx);

		return ctx.db
			.query("notes")
			.withIndex("by_ticketId", (q: any) => q.eq("ticketId", args.ticketId))
			.collect();
	},
});

export const create = mutation({
	args: {
		ticketId: v.id("tickets"),
		body: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireOperationalCoreAccess(ctx);
		const body = args.body.trim();

		if (!body) {
			throw new ConvexError("Note body is required");
		}

		const ticket = await ctx.db.get(args.ticketId);

		if (!ticket) {
			throw new ConvexError("Ticket not found");
		}

		return ctx.db.insert("notes", {
			ticketId: args.ticketId,
			body,
			authorUserId: String(user._id),
			authorLabel: resolveAuthorLabel(user),
			createdAt: Date.now(),
		});
	},
});
