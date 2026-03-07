import { ConvexError } from "convex/values";

import type { WorkspaceRole } from "./authz";

const MULTI_WORKSPACE_ERROR =
	"Multiple workspaces are not supported in the pilot yet";
const PILOT_WORKSPACE_EXISTS_ERROR = "A pilot workspace already exists";

type PilotMembership = {
	workspaceId: string;
	role: WorkspaceRole;
};

export function requireSinglePilotWorkspaceMembership<
	T extends PilotMembership,
>(memberships: T[]): T {
	if (memberships.length === 0) {
		throw new ConvexError("Forbidden");
	}

	if (memberships.length > 1) {
		throw new ConvexError(MULTI_WORKSPACE_ERROR);
	}

	return memberships[0];
}

export function assertPilotWorkspaceCanBeCreated(existingWorkspaceCount: number) {
	if (existingWorkspaceCount > 0) {
		throw new ConvexError(PILOT_WORKSPACE_EXISTS_ERROR);
	}
}

export { MULTI_WORKSPACE_ERROR, PILOT_WORKSPACE_EXISTS_ERROR };
