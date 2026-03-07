import { makeFunctionReference } from "convex/server";

import type {
	QueueWorkspace,
	ReviewWorkspace,
	TicketDetailWorkspace,
} from "./tickets";

export const getTicketDetailReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	TicketDetailWorkspace | null
>("tickets:getDetail");

export const getQueueSnapshotReference = makeFunctionReference<
	"query",
	Record<string, never>,
	QueueWorkspace
>("tickets:getQueueSnapshot");

export const getReviewSnapshotReference = makeFunctionReference<
	"query",
	Record<string, never>,
	ReviewWorkspace
>("tickets:getReviewSnapshot");

export const classifyAndRouteTicketReference = makeFunctionReference<
	"mutation",
	{ ticketId: string },
	{
		classification: {
			request_type: string;
			priority: string;
			classification_confidence: number;
		};
		classificationSource: "provider" | "fallback";
		fallbackReason: "classifier_error" | "invalid_schema" | null;
		routingDecision: {
			assignedWorkerId: string | null;
			reviewState: string;
			routingReason: string;
			scoredCandidates: Array<{
				workerId: string;
				score: number;
				skillMatchTier: string;
				languageMatch: boolean;
				isAvailable: boolean;
				capacityRemaining: number;
				reasons: string[];
			}>;
		};
	}
>("tickets:classifyAndRoute");

export const rerouteTicketReference = makeFunctionReference<
	"mutation",
	{ ticketId: string },
	{
		routingDecision: {
			assignedWorkerId: string | null;
			reviewState: string;
			routingReason: string;
			scoredCandidates: Array<{
				workerId: string;
				score: number;
				skillMatchTier: string;
				languageMatch: boolean;
				isAvailable: boolean;
				capacityRemaining: number;
				reasons: string[];
			}>;
		};
	}
>("tickets:reroute");

export type { QueueWorkspace, ReviewWorkspace, TicketDetailWorkspace };
