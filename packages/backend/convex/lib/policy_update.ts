export type RoutingPolicyInput = Partial<{
	autoAssignThreshold: number;
	maxAssignmentsPerWorker: number;
	requireLeadReview: boolean;
	allowSecondarySkills: boolean;
}>;

export type RoutingPolicySettings = {
	autoAssignThreshold: number;
	maxAssignmentsPerWorker: number;
	requireLeadReview: boolean;
	allowSecondarySkills: boolean;
};

export const DEFAULT_ROUTING_POLICY: RoutingPolicySettings = {
	autoAssignThreshold: 0.8,
	maxAssignmentsPerWorker: 8,
	requireLeadReview: true,
	allowSecondarySkills: true,
};

function clampInteger(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, Math.round(value)));
}

export function sanitizePolicyInput(
	input: RoutingPolicyInput,
): RoutingPolicySettings {
	return {
		autoAssignThreshold: Math.min(
			0.95,
			Math.max(0.6, input.autoAssignThreshold ?? 0.8),
		),
		maxAssignmentsPerWorker: clampInteger(
			input.maxAssignmentsPerWorker ??
				DEFAULT_ROUTING_POLICY.maxAssignmentsPerWorker,
			1,
			20,
		),
		requireLeadReview:
			input.requireLeadReview ?? DEFAULT_ROUTING_POLICY.requireLeadReview,
		allowSecondarySkills:
			input.allowSecondarySkills ?? DEFAULT_ROUTING_POLICY.allowSecondarySkills,
	};
}
