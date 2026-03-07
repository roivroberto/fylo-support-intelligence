import {
	mutationGeneric as mutation,
	queryGeneric as query,
} from "convex/server";
import { ConvexError, v } from "convex/values";

import { authComponent } from "./auth";
import { assertPilotWorkspaceCanBeCreated } from "./lib/pilot_workspace";

function isDefined<T>(value: T | null): value is T {
	return value !== null;
}

async function requireCurrentUser(ctx: any) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError("Unauthenticated");
	}

	return user;
}

export const list = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireCurrentUser(ctx);
		const memberships = await ctx.db
			.query("memberships")
			.withIndex("by_userId", (q: any) => q.eq("userId", String(user._id)))
			.collect();

		const workspaces = await Promise.all(
			memberships.map(async (membership) => {
				const workspace = await ctx.db.get(membership.workspaceId);

				if (!workspace) {
					return null;
				}

				return {
					membership,
					workspace,
				};
			}),
		);

		return workspaces.filter(isDefined);
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireCurrentUser(ctx);
		const existingWorkspace = await ctx.db.query("workspaces").first();

		assertPilotWorkspaceCanBeCreated(existingWorkspace ? 1 : 0);

		const now = Date.now();
		const userId = String(user._id);
		const workspaceId = await ctx.db.insert("workspaces", {
			name: args.name,
			slug: args.slug,
			createdAt: now,
			createdByUserId: userId,
		});

		await ctx.db.insert("memberships", {
			workspaceId,
			userId,
			role: "lead",
			createdAt: now,
		});

		return workspaceId;
	},
});
