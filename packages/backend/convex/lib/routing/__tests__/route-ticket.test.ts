import { describe, expect, it } from "vitest";
import { routeTicket } from "../route_ticket";

describe("routeTicket", () => {
	it("prefers primary skill match over lower-load secondary", () => {
		const decision = routeTicket({
			ticket: {
				request_type: "refund_request",
				language: "en",
				classification_confidence: 0.9,
			},
			workers: [
				{
					id: "w1",
					primary: ["refund_request"],
					secondary: [],
					load: 7,
					capacity: 10,
					languages: ["en"],
				},
				{
					id: "w2",
					primary: ["billing_question"],
					secondary: ["refund_request"],
					load: 1,
					capacity: 10,
					languages: ["en"],
				},
			],
		});

		expect(decision.assignedWorkerId).toBe("w1");
		expect(decision.routingReason).toContain("beat w2");
	});

	it("skips workers with no remaining capacity", () => {
		const decision = routeTicket({
			ticket: {
				request_type: "refund_request",
				language: "en",
				classification_confidence: 0.9,
			},
			workers: [
				{
					id: "w1",
					primary: ["refund_request"],
					secondary: [],
					load: 10,
					capacity: 10,
					languages: ["en"],
				},
				{
					id: "w2",
					primary: ["billing_question"],
					secondary: ["refund_request"],
					load: 1,
					capacity: 10,
					languages: ["en"],
				},
			],
		});

		expect(decision.assignedWorkerId).toBe("w2");
		expect(decision.routingReason).toContain("capacity_remaining:9");
	});

	it("recommends without assigning when confidence requires manager verification", () => {
		const decision = routeTicket({
			ticket: {
				request_type: "refund_request",
				language: "en",
				classification_confidence: 0.8,
			},
			workers: [
				{
					id: "w1",
					primary: ["refund_request"],
					secondary: [],
					load: 4,
					capacity: 10,
					languages: ["en"],
				},
			],
		});

		expect(decision.reviewState).toBe("manager_verification");
		expect(decision.assignedWorkerId).toBeNull();
		expect(decision.scoredCandidates[0]?.workerId).toBe("w1");
		expect(decision.routingReason).toContain("Review required");
	});

	it("does not auto-assign when confidence requires manual triage", () => {
		const decision = routeTicket({
			ticket: {
				request_type: "refund_request",
				language: "en",
				classification_confidence: 0.4,
			},
			workers: [
				{
					id: "w1",
					primary: ["refund_request"],
					secondary: [],
					load: 2,
					capacity: 10,
					languages: ["en"],
				},
			],
		});

		expect(decision.reviewState).toBe("manual_triage");
		expect(decision.assignedWorkerId).toBeNull();
		expect(decision.scoredCandidates[0]?.workerId).toBe("w1");
	});

	it("breaks exact ties deterministically by worker id and explains the comparison", () => {
		const decision = routeTicket({
			ticket: {
				request_type: "refund_request",
				language: "en",
				classification_confidence: 0.9,
			},
			workers: [
				{
					id: "w2",
					primary: ["refund_request"],
					secondary: [],
					load: 4,
					capacity: 10,
					languages: ["en"],
				},
				{
					id: "w1",
					primary: ["refund_request"],
					secondary: [],
					load: 4,
					capacity: 10,
					languages: ["en"],
				},
			],
		});

		expect(decision.assignedWorkerId).toBe("w1");
		expect(
			decision.scoredCandidates.map((candidate) => candidate.workerId),
		).toEqual(["w1", "w2"]);
		expect(decision.routingReason).toContain("beat w2");
		expect(decision.routingReason).toContain("worker_id");
	});

	it("respects policy options for secondary skills and required lead review", () => {
		const decision = routeTicket({
			ticket: {
				request_type: "refund_request",
				language: "en",
				classification_confidence: 0.95,
			},
			workers: [
				{
					id: "lead_1",
					primary: ["billing_issue"],
					secondary: ["refund_request"],
					load: 1,
					capacity: 10,
					languages: ["en"],
				},
			],
			policy: {
				allowSecondarySkills: true,
				requireLeadReview: true,
			},
		});

		expect(decision.assignedWorkerId).toBeNull();
		expect(decision.reviewState).toBe("manager_verification");
	});
});
