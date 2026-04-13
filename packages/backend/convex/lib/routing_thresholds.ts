export const AUTO_ASSIGN_THRESHOLD = 0.8;
export const MANUAL_TRIAGE_THRESHOLD = 0.5;

export type ReviewState =
	| "auto_assign_allowed"
	| "manager_verification"
	| "manual_triage";

export function computeReviewState(
	confidence: number,
	thresholds?: {
		autoAssignThreshold?: number;
		manualTriageThreshold?: number;
	},
): ReviewState {
	const manualTriageThreshold =
		thresholds?.manualTriageThreshold ?? MANUAL_TRIAGE_THRESHOLD;
	const autoAssignThreshold =
		thresholds?.autoAssignThreshold ?? AUTO_ASSIGN_THRESHOLD;

	if (confidence < manualTriageThreshold) {
		return "manual_triage";
	}

	if (confidence <= autoAssignThreshold) {
		return "manager_verification";
	}

	return "auto_assign_allowed";
}
