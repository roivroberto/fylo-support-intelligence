import { makeFunctionReference } from "convex/server";

type SeedE2EDataResult = {
	viewerEmail: string;
	viewerRole: "lead" | "agent";
	busyAgentUserId: string;
	watchAgentUserId: string;
	clearAgentUserId: string;
	ticketId: string;
	missingInfoTicketId: string;
};

export const seedE2EDataReference = makeFunctionReference<
	"mutation",
	{ viewerRole?: "lead" | "agent" },
	SeedE2EDataResult
>("e2e:seedData");

export type { SeedE2EDataResult };
