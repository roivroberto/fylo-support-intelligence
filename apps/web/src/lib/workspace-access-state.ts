import type { WorkspaceAccessState } from "@Fylo/backend/convex/workspaces_reference";

const WORKSPACE_ACCESS_STATE_KEY = "fylo:workspace-access-state";

type PersistedWorkspaceAccessState = {
	ownerSessionKey: string | null;
	state: WorkspaceAccessState;
};

export type PendingWorkspaceAction = {
	ownerSessionKey: string | null;
	type: "create" | "join";
	redirectTo: string;
	podCode?: string;
};

const PENDING_WORKSPACE_ACTION_KEY = "fylo:pending-workspace-action";

export function persistWorkspaceAccessState(input: PersistedWorkspaceAccessState) {
	if (typeof window === "undefined") {
		return;
	}

	window.sessionStorage.setItem(WORKSPACE_ACCESS_STATE_KEY, JSON.stringify(input));
}

export function readPersistedWorkspaceAccessState() {
	if (typeof window === "undefined") {
		return null;
	}

	const raw = window.sessionStorage.getItem(WORKSPACE_ACCESS_STATE_KEY);

	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as PersistedWorkspaceAccessState;
	} catch {
		window.sessionStorage.removeItem(WORKSPACE_ACCESS_STATE_KEY);
		return null;
	}
}

export function clearPersistedWorkspaceAccessState() {
	if (typeof window === "undefined") {
		return;
	}

	window.sessionStorage.removeItem(WORKSPACE_ACCESS_STATE_KEY);
}

export function persistPendingWorkspaceAction(action: PendingWorkspaceAction) {
	if (typeof window === "undefined") {
		return;
	}

	window.sessionStorage.setItem(PENDING_WORKSPACE_ACTION_KEY, JSON.stringify(action));
}

export function readPendingWorkspaceAction() {
	if (typeof window === "undefined") {
		return null;
	}

	const raw = window.sessionStorage.getItem(PENDING_WORKSPACE_ACTION_KEY);

	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as PendingWorkspaceAction;
	} catch {
		window.sessionStorage.removeItem(PENDING_WORKSPACE_ACTION_KEY);
		return null;
	}
}

export function clearPendingWorkspaceAction() {
	if (typeof window === "undefined") {
		return;
	}

	window.sessionStorage.removeItem(PENDING_WORKSPACE_ACTION_KEY);
}
