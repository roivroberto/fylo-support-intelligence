import { makeFunctionReference } from "convex/server";

import type { WorkspaceAccessState } from "./lib/workspace_access";

export const getCurrentWorkspaceReference = makeFunctionReference<
	"query",
	Record<string, never>,
	WorkspaceAccessState
>("workspaces:getCurrentWorkspace");

export const getWebhookWorkspaceReference = makeFunctionReference<
	"query",
	Record<string, never>,
	{ workspaceId: string } | null
>("workspaces:getWebhookWorkspace");

export const ensureOnboardingWorkspaceReference = makeFunctionReference<
	"mutation",
	Record<string, never>,
	WorkspaceAccessState
>("workspaces:ensureOnboardingWorkspace");

export type { WorkspaceAccessState };
