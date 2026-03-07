import { makeFunctionReference } from "convex/server";

type ApprovedReplyTicket = {
	_id: string;
	requesterEmail: string | null;
	subject: string | null;
	reviewState?: string | null;
	status?: string | null;
};

export const getApprovedReplyTicketReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	ApprovedReplyTicket | null
>("replies:getApprovedReplyTicket");

export const sendApprovedReplyReference = makeFunctionReference<
	"action",
	{
		ticketId: string;
		to?: string;
		subject?: string;
		draftReply: string;
	},
	{ messageId: string; providerMessageId: string }
>("replies:sendApproved");

export type { ApprovedReplyTicket };
