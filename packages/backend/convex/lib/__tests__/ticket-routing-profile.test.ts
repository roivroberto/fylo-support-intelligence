import { describe, expect, it } from "vitest";

import { routeTicket } from "../routing/route_ticket";
import type { RoutingWorker } from "../routing/types";

function buildWorker(input: Partial<RoutingWorker> & Pick<RoutingWorker, "id">): RoutingWorker {
	return {
		id: input.id,
		primary: input.primary ?? [],
		secondary: input.secondary ?? [],
		languages: input.languages ?? ["en"],
		load: input.load ?? 0,
		capacity: input.capacity ?? 8,
	};
}

describe("profile-backed routing", () => {
	it("prefers a worker whose parsed primary skills match the ticket", () => {
		const decision = routeTicket({
			ticket: {
				request_type: "technical_problem",
				language: "en",
				classification_confidence: 0.9,
			},
			workers: [
				buildWorker({
					id: "agent_a",
					primary: ["billing_issue"],
					secondary: ["general_inquiry"],
				}),
				buildWorker({
					id: "agent_b",
					primary: ["technical_problem"],
					secondary: ["general_inquiry"],
				}),
			],
			policy: {
				autoAssignThreshold: 0.8,
				allowSecondarySkills: true,
			},
		});

		expect(decision.assignedWorkerId).toBe("agent_b");
		expect(decision.scoredCandidates[0]?.workerId).toBe("agent_b");
	});

	it("still falls back to available workers when no primary skill matches", () => {
		const decision = routeTicket({
			ticket: {
				request_type: "billing_issue",
				language: "en",
				classification_confidence: 0.9,
			},
			workers: [
				buildWorker({ id: "agent_a", primary: ["billing_issue"] }),
				buildWorker({ id: "agent_b", primary: ["technical_problem"] }),
			],
			policy: {
				autoAssignThreshold: 0.8,
			},
		});

		expect(decision.assignedWorkerId).toBe("agent_a");
	});
});
