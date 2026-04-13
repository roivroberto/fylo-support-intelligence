import type { WorkspaceRole } from "./authz";
import { requireSinglePilotWorkspaceMembership } from "./pilot_workspace";

export type WorkspaceSummary = {
	workspaceId: string;
	name: string;
	podCode: string;
	role: WorkspaceRole;
};

export type WorkspaceAccessState = {
	isMember: boolean;
	canCreateWorkspace: boolean;
	workspace: WorkspaceSummary | null;
};

type WorkspaceRecord = {
	_id?: string;
	name: string;
	slug: string;
};

type MembershipRecord = {
	workspaceId: any;
	userId?: string;
	role: WorkspaceRole;
};

export function normalizePodCode(podCode: string) {
	return podCode.trim().toLowerCase();
}

export function buildPodCode(userId: string) {
	const normalizedUserId = userId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
	const suffix = normalizedUserId.slice(0, 8) || "workspace";

	return normalizePodCode(`pod-${suffix}`);
}

export function buildWorkspaceAccessState(input: {
	workspace: WorkspaceRecord | null;
	membership: MembershipRecord | null;
	canCreateWorkspace: boolean;
}): WorkspaceAccessState {
	if (!input.workspace || !input.membership) {
		return {
			isMember: false,
			canCreateWorkspace: input.canCreateWorkspace,
			workspace: null,
		};
	}

	return {
		isMember: true,
		canCreateWorkspace: false,
		workspace: {
			workspaceId: String(input.workspace._id ?? input.membership.workspaceId),
			name: input.workspace.name,
			podCode: input.workspace.slug,
			role: input.membership.role,
		},
	};
}

export async function getSingleWorkspaceMembershipForUser(
	ctx: any,
	userId: string,
) {
	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_userId", (q: any) => q.eq("userId", userId))
		.collect();

	if (memberships.length === 0) {
		return null;
	}

	return requireSinglePilotWorkspaceMembership(memberships);
}

export async function getWorkspaceAccessStateForMembership(
	ctx: any,
	membership: MembershipRecord,
	workspaceOverride?: WorkspaceRecord | null,
): Promise<WorkspaceAccessState> {
	const workspace = workspaceOverride ?? (await ctx.db.get(membership.workspaceId));

	return buildWorkspaceAccessState({
		workspace,
		membership,
		canCreateWorkspace: false,
	});
}

export async function getWorkspaceAccessStateForUser(
	ctx: any,
	userId: string,
): Promise<WorkspaceAccessState> {
	const membership = await getSingleWorkspaceMembershipForUser(ctx, userId);

	if (membership) {
		return getWorkspaceAccessStateForMembership(ctx, membership);
	}

	// User has no workspace membership — they can create their own workspace as team lead
	return buildWorkspaceAccessState({
		workspace: null,
		membership: null,
		canCreateWorkspace: true,
	});
}
