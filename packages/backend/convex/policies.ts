import {
	makeFunctionReference,
	mutationGeneric as mutation,
	queryGeneric as query,
} from "convex/server";
import { ConvexError, v } from "convex/values";

import { authComponent } from "./auth";
import { canManagePolicy } from "./lib/authz";
import { requireSinglePilotWorkspaceMembership } from "./lib/pilot_workspace";
import {
	DEFAULT_ROUTING_POLICY,
	type RoutingPolicyInput,
	sanitizePolicyInput,
} from "./lib/policy_update";

const ROUTING_POLICY_SLUG = "routing-policy";
const ROUTING_POLICY_TITLE = "Routing policy";

export type CurrentPolicyWorkspace = {
	workspaceId: string;
	canManage: boolean;
	policy: ReturnType<typeof sanitizePolicyInput>;
};

export const getCurrentPolicyReference = makeFunctionReference<
	"query",
	Record<string, never>,
	CurrentPolicyWorkspace
>("policies:getCurrent");

export const saveCurrentPolicyReference = makeFunctionReference<
	"mutation",
	ReturnType<typeof sanitizePolicyInput>,
	ReturnType<typeof sanitizePolicyInput>
>("policies:saveCurrent");

async function requireCurrentUser(ctx: any) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError("Unauthenticated");
	}

	return user;
}

async function requirePilotMembership(ctx: any) {
	const user = await requireCurrentUser(ctx);
	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_userId", (q: any) => q.eq("userId", String(user._id)))
		.collect();
	const membership = requireSinglePilotWorkspaceMembership(memberships);

	return {
		membership,
		userId: String(user._id),
	};
}

function readStoredPolicy(body: string) {
	try {
		return sanitizePolicyInput(JSON.parse(body) as RoutingPolicyInput);
	} catch {
		return DEFAULT_ROUTING_POLICY;
	}
}

export const getCurrent = query({
	args: {},
	handler: async (ctx) => {
		const { membership } = await requirePilotMembership(ctx);
		const existingPolicy = await ctx.db
			.query("policies")
			.withIndex("by_workspaceId_slug", (q: any) =>
				q
					.eq("workspaceId", membership.workspaceId)
					.eq("slug", ROUTING_POLICY_SLUG),
			)
			.unique();

		return {
			workspaceId: String(membership.workspaceId),
			canManage: canManagePolicy(membership.role),
			policy: existingPolicy
				? readStoredPolicy(existingPolicy.body)
				: DEFAULT_ROUTING_POLICY,
		};
	},
});

export const saveCurrent = mutation({
	args: {
		autoAssignThreshold: v.number(),
		maxAssignmentsPerWorker: v.number(),
		requireLeadReview: v.boolean(),
		allowSecondarySkills: v.boolean(),
	},
	handler: async (ctx, args) => {
		const { membership, userId } = await requirePilotMembership(ctx);

		if (!canManagePolicy(membership.role)) {
			throw new ConvexError("Forbidden");
		}

		const sanitizedPolicy = sanitizePolicyInput(args);
		const now = Date.now();
		const existingPolicy = await ctx.db
			.query("policies")
			.withIndex("by_workspaceId_slug", (q: any) =>
				q
					.eq("workspaceId", membership.workspaceId)
					.eq("slug", ROUTING_POLICY_SLUG),
			)
			.unique();

		if (existingPolicy) {
			await ctx.db.patch(existingPolicy._id, {
				title: ROUTING_POLICY_TITLE,
				body: JSON.stringify(sanitizedPolicy),
				updatedAt: now,
			});
		} else {
			await ctx.db.insert("policies", {
				workspaceId: membership.workspaceId,
				title: ROUTING_POLICY_TITLE,
				slug: ROUTING_POLICY_SLUG,
				body: JSON.stringify(sanitizedPolicy),
				createdAt: now,
				updatedAt: now,
				createdByUserId: userId,
			});
		}

		return sanitizedPolicy;
	},
});
