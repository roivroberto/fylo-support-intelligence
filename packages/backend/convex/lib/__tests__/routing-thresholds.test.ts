import { describe, expect, it } from "vitest";
import { computeReviewState } from "../routing_thresholds";

describe("computeReviewState", () => {
	it("routes <0.5 confidence to manual triage", () => {
		expect(computeReviewState(0.49)).toBe("manual_triage");
	});

	it("routes 0.5 confidence to manager verification", () => {
		expect(computeReviewState(0.5)).toBe("manager_verification");
	});

	it("routes <=0.8 confidence to manager verification", () => {
		expect(computeReviewState(0.8)).toBe("manager_verification");
	});

	it("routes >0.8 confidence to auto assign allowed", () => {
		expect(computeReviewState(0.81)).toBe("auto_assign_allowed");
	});

	it("supports policy threshold overrides", () => {
		expect(
			computeReviewState(0.76, {
				autoAssignThreshold: 0.75,
				manualTriageThreshold: 0.4,
			}),
		).toBe("auto_assign_allowed");
		expect(
			computeReviewState(0.39, {
				autoAssignThreshold: 0.75,
				manualTriageThreshold: 0.4,
			}),
		).toBe("manual_triage");
	});
});
