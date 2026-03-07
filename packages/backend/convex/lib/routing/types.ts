import type { ReviewState } from "../routing_thresholds";

export type RequestType = string;

export type SkillMatchTier = "primary" | "secondary" | "none";

export interface RoutingTicket {
	request_type: RequestType;
	language: string;
	classification_confidence: number;
}

export interface RoutingWorker {
	id: string;
	primary: RequestType[];
	secondary: RequestType[];
	load: number;
	capacity: number;
	languages: string[];
}

export interface RouteTicketInput {
	ticket: RoutingTicket;
	workers: RoutingWorker[];
}

export interface CandidateScore {
	workerId: string;
	score: number;
	skillMatchTier: SkillMatchTier;
	languageMatch: boolean;
	isAvailable: boolean;
	capacityRemaining: number;
	reasons: string[];
}

export interface RoutingDecision {
	assignedWorkerId: string | null;
	reviewState: ReviewState;
	routingReason: string;
	scoredCandidates: CandidateScore[];
}
