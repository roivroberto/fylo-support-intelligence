import { makeFunctionReference } from "convex/server";

import type { WorkspaceAccessState } from "./lib/workspace_access";

export const joinWithPodCodeReference = makeFunctionReference<
	"mutation",
	{ podCode: string },
	WorkspaceAccessState
>("memberships:joinWithPodCode");
