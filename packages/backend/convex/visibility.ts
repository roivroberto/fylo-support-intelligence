import { makeFunctionReference, queryGeneric as query } from "convex/server";
import { ConvexError } from "convex/values";

import { authComponent } from "./auth";
import { requireSinglePilotWorkspaceMembership } from "./lib/pilot_workspace";

export type VisibilityCard = {
	id: string;
	label: string;
	role: string;
	assignedCount: number;
	reviewCount: number;
	capacityState: "clear" | "watch" | "busy";
};

export type TeamVisibilityWorkspace = {
	workspaceId: string;
	reviewQueueCount: number;
	unassignedCount: number;
	cards: VisibilityCard[];
};

export const getTeamVisibilityReference = makeFunctionReference<
	"query",
	Record<string, never>,
	TeamVisibilityWorkspace
>("visibility:getTeamVisibility");

async function requirePilotMembership(ctx: any) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError("Unauthenticated");
	}

	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_userId", (q: any) => q.eq("userId", String(user._id)))
		.collect();

	return requireSinglePilotWorkspaceMembership(memberships);
}

function computeCapacityState(
	assignedCount: number,
	reviewCount: number,
): VisibilityCard["capacityState"] {
	if (assignedCount + reviewCount >= 5) {
		return "busy";
	}

	if (assignedCount + reviewCount >= 3) {
		return "watch";
	}

	return "clear";
}

function toTeamCard(input: {
	id: string;
	label: string;
	role: string;
	assignedCount: number;
	reviewCount: number;
}): VisibilityCard {
	return {
		...input,
		capacityState: computeCapacityState(input.assignedCount, input.reviewCount),
	};
}

export function buildTeamVisibilitySnapshot(input: {
	workspaceId: string;
	memberships: Array<{
		_id: string;
		userId: string;
		role: string;
	}>;
	tickets: Array<{
		assignedWorkerId?: string | null;
		reviewState?: string | null;
	}>;
}): TeamVisibilityWorkspace {
	const memberIds = new Set(
		input.memberships.map((membership) => membership.userId),
	);
	const visibleTickets = input.tickets.filter(
		(ticket) =>
			ticket.assignedWorkerId == null || memberIds.has(ticket.assignedWorkerId),
	);

	return {
		workspaceId: input.workspaceId,
		reviewQueueCount: visibleTickets.filter(
			(ticket) => ticket.reviewState === "manager_verification",
		).length,
		unassignedCount: visibleTickets.filter(
			(ticket) => ticket.assignedWorkerId == null,
		).length,
		cards: input.memberships.map((workspaceMembership) => {
			const assignedCount = visibleTickets.filter(
				(ticket) => ticket.assignedWorkerId === workspaceMembership.userId,
			).length;
			const reviewCount = visibleTickets.filter(
				(ticket) =>
					ticket.reviewState === "manager_verification" &&
					ticket.assignedWorkerId === workspaceMembership.userId,
			).length;

			return toTeamCard({
				id: String(workspaceMembership._id),
				label: workspaceMembership.userId,
				role: workspaceMembership.role,
				assignedCount,
				reviewCount,
			});
		}),
	};
}

export const getTeamVisibility = query({
	args: {},
	handler: async (ctx) => {
		const membership = await requirePilotMembership(ctx);
		const workspaceMemberships = await ctx.db
			.query("memberships")
			.withIndex("by_workspaceId", (q: any) =>
				q.eq("workspaceId", membership.workspaceId),
			)
			.collect();
		const tickets = await ctx.db.query("tickets").collect();

		return buildTeamVisibilitySnapshot({
			workspaceId: String(membership.workspaceId),
			memberships: workspaceMemberships.map((workspaceMembership) => ({
				_id: String(workspaceMembership._id),
				userId: workspaceMembership.userId,
				role: workspaceMembership.role,
			})),
			tickets: tickets.map((ticket) => ({
				assignedWorkerId: ticket.assignedWorkerId,
				reviewState: ticket.reviewState,
			})),
		});
	},
});
