import { computeReviewState } from "../routing_thresholds";
import { scoreCandidate } from "./score_candidate";
import type { RouteTicketInput, RoutingDecision } from "./types";

type ScoredCandidate = RoutingDecision["scoredCandidates"][number];

function compareCandidates(
	left: ScoredCandidate,
	right: ScoredCandidate,
): number {
	if (right.score !== left.score) {
		return right.score - left.score;
	}

	if (right.capacityRemaining !== left.capacityRemaining) {
		return right.capacityRemaining - left.capacityRemaining;
	}

	return left.workerId.localeCompare(right.workerId);
}

function explainComparison(
	winner: ScoredCandidate,
	runnerUp: ScoredCandidate | null,
): string {
	if (!runnerUp) {
		return `${winner.workerId} is the only eligible recommendation.`;
	}

	if (winner.score !== runnerUp.score) {
		return `${winner.workerId} beat ${runnerUp.workerId} on total_score (${winner.score} vs ${runnerUp.score}).`;
	}

	if (winner.capacityRemaining !== runnerUp.capacityRemaining) {
		return `${winner.workerId} beat ${runnerUp.workerId} on capacity_remaining (${winner.capacityRemaining} vs ${runnerUp.capacityRemaining}).`;
	}

	return `${winner.workerId} beat ${runnerUp.workerId} on worker_id tie-breaker.`;
}

export function routeTicket(input: RouteTicketInput): RoutingDecision {
	const reviewState = computeReviewState(
		input.ticket.classification_confidence,
	);
	const scoredCandidates = input.workers
		.map((worker) => scoreCandidate(input.ticket, worker))
		.sort(compareCandidates);

	const selectedCandidate =
		scoredCandidates.find((candidate) => candidate.isAvailable) ?? null;
	const runnerUp =
		selectedCandidate === null
			? null
			: (scoredCandidates.find(
					(candidate) =>
						candidate.isAvailable &&
						candidate.workerId !== selectedCandidate.workerId,
				) ?? null);
	const comparison =
		selectedCandidate === null
			? "No workers available for deterministic routing."
			: explainComparison(selectedCandidate, runnerUp);
	const selectionExplanation = selectedCandidate
		? `Recommended ${selectedCandidate.workerId} via ${selectedCandidate.reasons.join(", ")}. ${comparison}`
		: comparison;
	const assignedWorkerId =
		reviewState === "auto_assign_allowed"
			? (selectedCandidate?.workerId ?? null)
			: null;

	return {
		assignedWorkerId,
		reviewState,
		routingReason:
			reviewState === "auto_assign_allowed"
				? selectionExplanation
				: `Review required (${reviewState}). ${selectionExplanation}`,
		scoredCandidates,
	};
}
