import {
	mutationGeneric as mutation,
	queryGeneric as query,
} from "convex/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";
import {
	canManageWorkspaceMemberships,
	wouldLeaveWorkspaceWithoutLead,
} from "./lib/authz";
import { MULTI_WORKSPACE_ERROR } from "./lib/pilot_workspace";
import {
	getSingleWorkspaceMembershipForUser,
	getWorkspaceAccessStateForMembership,
	normalizePodCode,
} from "./lib/workspace_access";

async function requireCurrentUser(ctx: any) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError("Unauthenticated");
	}

	return user;
}

async function requireWorkspaceMembership(ctx: any, workspaceId: any) {
	const user = await requireCurrentUser(ctx);
	const membership = await ctx.db
		.query("memberships")
		.withIndex("by_workspaceId_userId", (q: any) =>
			q.eq("workspaceId", workspaceId).eq("userId", String(user._id)),
		)
		.unique();

	if (!membership) {
		throw new ConvexError("Forbidden");
	}

	return membership;
}

export const listForWorkspace = query({
	args: {
		workspaceId: v.id("workspaces"),
	},
	handler: async (ctx, args) => {
		await requireWorkspaceMembership(ctx, args.workspaceId);

		return ctx.db
			.query("memberships")
			.withIndex("by_workspaceId", (q: any) =>
				q.eq("workspaceId", args.workspaceId),
			)
			.collect();
	},
});

export const save = mutation({
	args: {
		workspaceId: v.id("workspaces"),
		userId: v.string(),
		role: v.union(v.literal("lead"), v.literal("agent")),
	},
	handler: async (ctx, args) => {
		const membership = await requireWorkspaceMembership(ctx, args.workspaceId);

		if (!canManageWorkspaceMemberships(membership.role)) {
			throw new ConvexError("Forbidden");
		}

		const existingMembership = await ctx.db
			.query("memberships")
			.withIndex("by_workspaceId_userId", (q: any) =>
				q.eq("workspaceId", args.workspaceId).eq("userId", args.userId),
			)
			.unique();

		if (existingMembership) {
			const workspaceMemberships = await ctx.db
				.query("memberships")
				.withIndex("by_workspaceId", (q: any) =>
					q.eq("workspaceId", args.workspaceId),
				)
				.collect();
			const leadCount = workspaceMemberships.filter(
				(workspaceMembership) => workspaceMembership.role === "lead",
			).length;

			if (
				wouldLeaveWorkspaceWithoutLead({
					currentRole: existingMembership.role,
					nextRole: args.role,
					leadCount,
				})
			) {
				throw new ConvexError("At least one lead is required");
			}

			await ctx.db.patch(existingMembership._id, { role: args.role });
			return existingMembership._id;
		}

		const targetUserMembership = await getSingleWorkspaceMembershipForUser(
			ctx,
			args.userId,
		);

		if (
			targetUserMembership &&
			String(targetUserMembership.workspaceId) !== String(args.workspaceId)
		) {
			throw new ConvexError(MULTI_WORKSPACE_ERROR);
		}

		return ctx.db.insert("memberships", {
			workspaceId: args.workspaceId,
			userId: args.userId,
			role: args.role,
			createdAt: Date.now(),
		});
	},
});

export const joinWithPodCode = mutation({
	args: {
		podCode: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireCurrentUser(ctx);
		const userId = String(user._id);
		const podCode = normalizePodCode(args.podCode);
		const workspace = await ctx.db
			.query("workspaces")
			.withIndex("by_slug", (q: any) => q.eq("slug", podCode))
			.unique();

		if (!workspace) {
			throw new ConvexError("Invalid pod code");
		}

		const existingMembership = await ctx.db
			.query("memberships")
			.withIndex("by_workspaceId_userId", (q: any) =>
				q.eq("workspaceId", workspace._id).eq("userId", userId),
			)
			.unique();

		if (existingMembership) {
			return getWorkspaceAccessStateForMembership(
				ctx,
				existingMembership,
				workspace,
			);
		}

		const pilotMembership = await getSingleWorkspaceMembershipForUser(ctx, userId);

		if (pilotMembership) {
			if (String(pilotMembership.workspaceId) === String(workspace._id)) {
				return getWorkspaceAccessStateForMembership(ctx, pilotMembership, workspace);
			}

			throw new ConvexError(MULTI_WORKSPACE_ERROR);
		}

		await ctx.db.insert("memberships", {
			workspaceId: workspace._id,
			userId,
			role: "agent",
			createdAt: Date.now(),
		});

		return getWorkspaceAccessStateForMembership(
			ctx,
			{
				workspaceId: workspace._id,
				userId,
				role: "agent",
			},
			workspace,
		);
	},
});
