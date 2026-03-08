import {
	mutationGeneric as mutation,
	queryGeneric as query,
} from "convex/server";
import { ConvexError, v } from "convex/values";

import { authComponent } from "./auth";
import {
	buildPodCode,
	getSingleWorkspaceMembershipForUser,
	getWorkspaceAccessStateForMembership,
	getWorkspaceAccessStateForUser,
	normalizePodCode,
} from "./lib/workspace_access";

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

async function ensureUniqueSlug(ctx: any, baseSlug: string): Promise<string> {
	let slug = baseSlug;
	let attempt = 0;
	while (true) {
		const existing = await ctx.db
			.query("workspaces")
			.withIndex("by_slug", (q: any) => q.eq("slug", slug))
			.first();
		if (!existing) return slug;
		attempt += 1;
		slug = `${baseSlug}-${attempt}`;
	}
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
		const userId = String(user._id);
		const existingMembership = await getSingleWorkspaceMembershipForUser(ctx, userId);

		if (existingMembership) {
			throw new ConvexError("You already belong to a workspace");
		}

		const baseSlug = normalizePodCode(args.slug);
		if (!baseSlug) {
			throw new ConvexError("Pod code is required");
		}

		const slug = await ensureUniqueSlug(ctx, baseSlug);

		const now = Date.now();
		const workspaceId = await ctx.db.insert("workspaces", {
			name: args.name,
			slug,
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

export const getCurrentWorkspace = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireCurrentUser(ctx);

		return getWorkspaceAccessStateForUser(ctx, String(user._id));
	},
});

export const ensureOnboardingWorkspace = mutation({
	args: {},
	handler: async (ctx) => {
		const user = await requireCurrentUser(ctx);
		const userId = String(user._id);
		const existingMembership = await getSingleWorkspaceMembershipForUser(ctx, userId);

		if (existingMembership) {
			return getWorkspaceAccessStateForMembership(ctx, existingMembership);
		}

		const now = Date.now();
		const baseSlug = buildPodCode(userId);
		const slug = await ensureUniqueSlug(ctx, baseSlug);

		const workspaceId = await ctx.db.insert("workspaces", {
			name: "My workspace",
			slug,
			createdAt: now,
			createdByUserId: userId,
		});
		await ctx.db.insert("memberships", {
			workspaceId,
			userId,
			role: "lead",
			createdAt: now,
		});

		return getWorkspaceAccessStateForMembership(ctx, {
			workspaceId,
			userId,
			role: "lead",
		});
	},
});
