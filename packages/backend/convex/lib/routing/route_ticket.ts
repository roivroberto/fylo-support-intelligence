import { computeReviewState } from "../routing_thresholds";
import { scoreCandidate } from "./score_candidate";
import type { RouteTicketInput, RoutingDecision } from "./types";

type ScoredCandidate = RoutingDecision["scoredCandidates"][number];

type RoutingPolicyOverrides = {
	autoAssignThreshold?: number;
	manualTriageThreshold?: number;
	allowSecondarySkills?: boolean;
	requireLeadReview?: boolean;
};

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
	const policy = input.policy ?? {};
	const manualTriageThreshold = policy.manualTriageThreshold ?? 0.5;
	const autoAssignThreshold = policy.autoAssignThreshold ?? 0.8;
	const reviewState = computeReviewState(
		input.ticket.classification_confidence,
		{
			autoAssignThreshold,
			manualTriageThreshold,
		},
	);
	const scoredCandidates = input.workers
		.map((worker) => scoreCandidate(input.ticket, worker))
		.filter(
			(candidate) =>
				policy.allowSecondarySkills !== false ||
				candidate.skillMatchTier !== "secondary",
		)
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
	const requiresLeadReviewForException =
		policy.requireLeadReview === true &&
		selectedCandidate !== null &&
		(selectedCandidate.skillMatchTier !== "primary" ||
			selectedCandidate.languageMatch === false);
	const effectiveReviewState = requiresLeadReviewForException
		? "manager_verification"
		: reviewState;
	const selectionExplanation = selectedCandidate
		? `Recommended ${selectedCandidate.workerId} via ${selectedCandidate.reasons.join(", ")}. ${comparison}`
		: comparison;
	const assignedWorkerId =
		effectiveReviewState === "auto_assign_allowed"
			? (selectedCandidate?.workerId ?? null)
			: null;

	return {
		assignedWorkerId,
		reviewState: effectiveReviewState,
		routingReason:
			effectiveReviewState === "auto_assign_allowed"
				? selectionExplanation
				: `Review required (${effectiveReviewState}). ${selectionExplanation}`,
		scoredCandidates,
	};
}
