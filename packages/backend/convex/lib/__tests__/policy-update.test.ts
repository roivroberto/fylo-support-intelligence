import { describe, expect, it } from "vitest";

import { sanitizePolicyInput } from "../policy_update";

describe("sanitizePolicyInput", () => {
	it("clamps auto-assign threshold to max 0.95", () => {
		const policy = sanitizePolicyInput({ autoAssignThreshold: 1.2 });

		expect(policy.autoAssignThreshold).toBe(0.95);
	});

	it("clamps auto-assign threshold to min 0.6", () => {
		const policy = sanitizePolicyInput({ autoAssignThreshold: 0.2 });

		expect(policy.autoAssignThreshold).toBe(0.6);
	});

	it("fills missing settings from the routing defaults", () => {
		const policy = sanitizePolicyInput({});

		expect(policy).toEqual({
			autoAssignThreshold: 0.8,
			maxAssignmentsPerWorker: 8,
			requireLeadReview: true,
			allowSecondarySkills: true,
		});
	});
});
