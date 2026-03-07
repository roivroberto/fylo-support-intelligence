import { makeFunctionReference } from "convex/server";

import type { TicketDraftWorkspace } from "./drafts";

export const getTicketDraftReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	TicketDraftWorkspace | null
>("drafts:getForTicket");

export const ensureTicketDraftReference = makeFunctionReference<
	"action",
	{ ticketId: string },
	TicketDraftWorkspace
>("drafts:ensureForTicket");

export const regenerateTicketDraftReference = makeFunctionReference<
	"action",
	{ ticketId: string },
	TicketDraftWorkspace
>("drafts:regenerateForTicket");

export type { TicketDraftWorkspace };
