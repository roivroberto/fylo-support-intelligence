import { makeFunctionReference } from "convex/server";

type TicketDetailNote = {
	id: string;
	body: string;
	authorLabel: string;
	createdAtLabel: string;
};

type TicketDetailWorkspace = {
	id: string;
	title?: string;
	requesterEmail?: string;
	reviewState: string;
	status: string;
	routingReason?: string;
	assignedWorkerLabel: string;
	assignmentContext: string;
	notes: TicketDetailNote[];
};

export const getTicketDetailReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	TicketDetailWorkspace | null
>("tickets:getDetail");

export type { TicketDetailWorkspace };
