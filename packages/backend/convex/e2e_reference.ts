import { makeFunctionReference } from "convex/server";

type SeedE2EDataResult = {
	viewerEmail: string;
	viewerRole: "lead" | "agent";
	busyAgentUserId: string;
	watchAgentUserId: string;
	clearAgentUserId: string;
	ticketId: string;
	missingInfoTicketId: string;
	persistedDraftTicketId: string;
	approvedSendTicketId: string | null;
};

type OutboundMessageWorkspace = {
	id: string;
	deliveryStatus: string | null;
	providerMessageId: string | null;
	externalId: string | null;
	to: string[];
	from: string | null;
	subject: string | null;
	sentAt: number | null;
	rawBody: string;
};

export const seedE2EDataReference = makeFunctionReference<
	"mutation",
	{
		viewerRole?: "lead" | "agent";
		liveSendTo?: string;
		persistedDraftSeedKey?: string;
	},
	SeedE2EDataResult
>("e2e:seedData");

export const getLatestOutboundForTicketReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	OutboundMessageWorkspace | null
>("e2e:getLatestOutboundForTicket");

export type { OutboundMessageWorkspace, SeedE2EDataResult };
