export const AUTO_ASSIGN_THRESHOLD = 0.8;
export const MANUAL_TRIAGE_THRESHOLD = 0.5;

export type ReviewState =
	| "auto_assign_allowed"
	| "manager_verification"
	| "manual_triage";

export function computeReviewState(confidence: number): ReviewState {
	if (confidence < MANUAL_TRIAGE_THRESHOLD) {
		return "manual_triage";
	}

	if (confidence <= AUTO_ASSIGN_THRESHOLD) {
		return "manager_verification";
	}

	return "auto_assign_allowed";
}
