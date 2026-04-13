export const WORKSPACE_ROLES = ["lead", "agent"] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
	return value === "lead" || value === "agent";
}

export function canManagePolicy(role: WorkspaceRole): boolean {
	return canManageWorkspaceMemberships(role);
}

export function canManageWorkspaceMemberships(role: WorkspaceRole): boolean {
	return role === "lead";
}

export function wouldLeaveWorkspaceWithoutLead({
	currentRole,
	nextRole,
	leadCount,
}: {
	currentRole: WorkspaceRole;
	nextRole: WorkspaceRole;
	leadCount: number;
}): boolean {
	return currentRole === "lead" && nextRole !== "lead" && leadCount <= 1;
}
