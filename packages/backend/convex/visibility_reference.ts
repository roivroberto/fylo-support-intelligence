import { makeFunctionReference } from "convex/server";

type VisibilityCard = {
	id: string;
	label: string;
	role: string;
	assignedCount: number;
	reviewCount: number;
	capacityState: "clear" | "watch" | "busy";
};

type TeamVisibilityWorkspace = {
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

export type { TeamVisibilityWorkspace, VisibilityCard };
