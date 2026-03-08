import {
	mutationGeneric as mutation,
	queryGeneric as query,
} from "convex/server";
import { ConvexError, v } from "convex/values";

import { authComponent } from "./auth";
import { assertPilotWorkspaceCanBeCreated } from "./lib/pilot_workspace";
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
		const slug = normalizePodCode(args.slug);

		if (!slug) {
			throw new ConvexError("Pod code is required");
		}

		assertPilotWorkspaceCanBeCreated(existingWorkspace ? 1 : 0);

		const now = Date.now();
		const userId = String(user._id);
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

export const getWebhookWorkspace = query({
	args: {},
	handler: async (ctx) => {
		const workspace = await ctx.db.query("workspaces").first();

		if (!workspace) {
			return null;
		}

		return {
			workspaceId: String(workspace._id),
		};
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

		const existingWorkspace = await ctx.db.query("workspaces").first();

		if (existingWorkspace) {
			return {
				isMember: false,
				canCreateWorkspace: false,
				workspace: null,
			};
		}

		assertPilotWorkspaceCanBeCreated(0);

		const now = Date.now();
		const workspaceId = await ctx.db.insert("workspaces", {
			name: "My workspace",
			slug: buildPodCode(userId),
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
