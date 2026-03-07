import { makeFunctionReference } from "convex/server";

type TicketDraftWorkspace = {
	summary: string;
	recommendedAction: string;
	draftReply: string;
	usedFallback: boolean;
	fallbackReason: "generator_error" | "invalid_schema" | null;
	generatedAtLabel: string;
};

export const getTicketDraftReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	TicketDraftWorkspace | null
>("drafts:getForTicket");

export type { TicketDraftWorkspace };
