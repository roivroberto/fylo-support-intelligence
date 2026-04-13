import type {
	CandidateScore,
	RoutingTicket,
	RoutingWorker,
	SkillMatchTier,
} from "./types";

const SKILL_MATCH_SCORES: Record<SkillMatchTier, number> = {
	primary: 100,
	secondary: 50,
	none: 0,
};

const LANGUAGE_MATCH_SCORE = 20;

function getSkillMatchTier(
	ticket: RoutingTicket,
	worker: RoutingWorker,
): SkillMatchTier {
	if (worker.primary.includes(ticket.request_type)) {
		return "primary";
	}

	if (worker.secondary.includes(ticket.request_type)) {
		return "secondary";
	}

	return "none";
}

export function scoreCandidate(
	ticket: RoutingTicket,
	worker: RoutingWorker,
): CandidateScore {
	const skillMatchTier = getSkillMatchTier(ticket, worker);
	const languageMatch = worker.languages.includes(ticket.language);
	const capacityRemaining = Math.max(worker.capacity - worker.load, 0);
	const isAvailable = capacityRemaining > 0;
	const score =
		(isAvailable ? 0 : Number.NEGATIVE_INFINITY) +
		SKILL_MATCH_SCORES[skillMatchTier] +
		(languageMatch ? LANGUAGE_MATCH_SCORE : 0) +
		capacityRemaining;

	const reasons = [
		`skill:${skillMatchTier}`,
		languageMatch
			? `language:${ticket.language}`
			: `language_mismatch:${ticket.language}`,
		isAvailable ? "availability:ready" : "availability:at_capacity",
		`capacity_remaining:${capacityRemaining}`,
	];

	return {
		workerId: worker.id,
		score,
		skillMatchTier,
		languageMatch,
		isAvailable,
		capacityRemaining,
		reasons,
	};
}
