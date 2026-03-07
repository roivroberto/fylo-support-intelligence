import { makeFunctionReference } from "convex/server";

type RoutingPolicySettings = {
	autoAssignThreshold: number;
	maxAssignmentsPerWorker: number;
	requireLeadReview: boolean;
	allowSecondarySkills: boolean;
};

type CurrentPolicyWorkspace = {
	workspaceId: string;
	canManage: boolean;
	policy: RoutingPolicySettings;
};

export const getCurrentPolicyReference = makeFunctionReference<
	"query",
	Record<string, never>,
	CurrentPolicyWorkspace
>("policies:getCurrent");

export const saveCurrentPolicyReference = makeFunctionReference<
	"mutation",
	RoutingPolicySettings,
	RoutingPolicySettings
>("policies:saveCurrent");

export type { CurrentPolicyWorkspace, RoutingPolicySettings };
