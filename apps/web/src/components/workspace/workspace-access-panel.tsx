"use client";

import { joinWithPodCodeReference } from "@Fylo/backend/convex/memberships_reference";
import {
	ensureOnboardingWorkspaceReference,
	getCurrentWorkspaceReference,
} from "@Fylo/backend/convex/workspaces_reference";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { authClient } from "../../lib/auth-client";
import { normalizeSessionUser } from "../../lib/current-user";
import {
	clearPendingWorkspaceAction,
	clearPersistedWorkspaceAccessState,
	persistWorkspaceAccessState,
	readPendingWorkspaceAction,
	readPersistedWorkspaceAccessState,
} from "../../lib/workspace-access-state";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type Feedback = { type: "success" | "error"; message: string } | null;

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
	if (!feedback) return null;
	return (
		<p
			aria-live="polite"
			className={`app-feedback ${feedback.type === "error" ? "app-feedback--error" : "app-feedback--success"}`}
		>
			{feedback.message}
		</p>
	);
}

function WorkspaceDetails({
	name,
	podCode,
	role,
}: {
	name: string;
	podCode: string;
	role: string;
}) {
	const isLead = role === "lead";
	return (
		<div className="app-card p-5 flex flex-col gap-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="app-eyebrow mb-1">Active workspace</p>
					<h2 className="app-h2">{name}</h2>
				</div>
				<span className={`role-badge ${isLead ? "role-badge--lead" : "role-badge--agent"}`}>
					{role}
				</span>
			</div>
			<div
				className="flex flex-col gap-2"
				style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}
			>
				<div className="flex items-center justify-between">
					<span className="app-field-label">Pod code</span>
					<code
						style={{
							fontFamily: "var(--font-jetbrains-mono)",
							fontSize: "0.75rem",
							color: "#a78bfa",
							background: "rgba(167,139,250,0.08)",
							border: "1px solid rgba(167,139,250,0.2)",
							borderRadius: "3px",
							padding: "0.15rem 0.5rem",
						}}
					>
						{podCode}
					</code>
				</div>
			</div>
		</div>
	);
}

export function WorkspaceAccessPanel() {
	const { data: session, isPending: isSessionPending } = authClient.useSession();
	const user = normalizeSessionUser(session?.user);
	const workspaceState = useQuery(getCurrentWorkspaceReference, session ? {} : "skip");
	const joinWithPodCode = useMutation(joinWithPodCodeReference);
	const ensureOnboardingWorkspace = useMutation(ensureOnboardingWorkspaceReference);
	const [podCode, setPodCode] = useState("");
	const [localState, setLocalState] = useState<{
		ownerSessionKey: string | null;
		state: typeof workspaceState;
	} | null>(() => readPersistedWorkspaceAccessState());
	const [feedback, setFeedback] = useState<Feedback>(null);
	const [isJoining, setIsJoining] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const sessionKey = session?.user?.email ?? null;
	const pendingWorkspaceAction = readPendingWorkspaceAction();

	const resolvedWorkspaceState =
		localState?.ownerSessionKey === sessionKey &&
		localState.state?.isMember &&
		!workspaceState?.isMember
			? localState.state
			: workspaceState ?? localState?.state;
	const title = useMemo(() => user.name ?? user.email ?? "Pilot user", [user]);

	useEffect(() => {
		if (isSessionPending) return;
		if (!sessionKey) return;
		if (localState?.ownerSessionKey && localState.ownerSessionKey !== sessionKey) {
			setLocalState(null);
			clearPersistedWorkspaceAccessState();
		}
		setFeedback(null);
		setPodCode("");
	}, [isSessionPending, localState, sessionKey]);

	useEffect(() => {
		if (
			isSessionPending || !sessionKey || !pendingWorkspaceAction ||
			pendingWorkspaceAction.ownerSessionKey !== sessionKey ||
			resolvedWorkspaceState?.isMember || isJoining || isCreating
		) return;

		const runPendingAction = async () => {
			try {
				if (pendingWorkspaceAction.type === "join" && pendingWorkspaceAction.podCode) {
					setIsJoining(true);
					const nextState = await joinWithPodCode({ podCode: pendingWorkspaceAction.podCode });
					const persisted = { ownerSessionKey: sessionKey, state: nextState };
					setLocalState(persisted);
					persistWorkspaceAccessState(persisted);
					clearPendingWorkspaceAction();
					if (pendingWorkspaceAction.redirectTo !== "/") {
						window.location.assign(pendingWorkspaceAction.redirectTo);
					}
					return;
				}
				if (pendingWorkspaceAction.type === "create") {
					setIsCreating(true);
					const nextState = await ensureOnboardingWorkspace({});
					const persisted = { ownerSessionKey: sessionKey, state: nextState };
					setLocalState(persisted);
					persistWorkspaceAccessState(persisted);
					clearPendingWorkspaceAction();
				}
			} catch (error) {
				clearPendingWorkspaceAction();
				setFeedback({
					type: "error",
					message: error instanceof Error ? error.message : "Unable to complete workspace setup",
				});
			} finally {
				setIsJoining(false);
				setIsCreating(false);
			}
		};
		void runPendingAction();
	}, [
		ensureOnboardingWorkspace, isCreating, isJoining, isSessionPending,
		joinWithPodCode, pendingWorkspaceAction, resolvedWorkspaceState?.isMember, sessionKey,
	]);

	async function handleJoin(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (isJoining) return;
		const trimmed = podCode.trim();
		if (!trimmed) {
			setFeedback({ type: "error", message: "Enter a pod code." });
			return;
		}
		setFeedback(null);
		setIsJoining(true);
		try {
			const nextState = await joinWithPodCode({ podCode: trimmed });
			const persisted = { ownerSessionKey: sessionKey, state: nextState };
			setLocalState(persisted);
			persistWorkspaceAccessState(persisted);
			setPodCode("");
			setFeedback({ type: "success", message: "Joined workspace." });
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to join workspace" });
		} finally {
			setIsJoining(false);
		}
	}

	async function handleCreateWorkspace() {
		if (isCreating) return;
		setFeedback(null);
		setIsCreating(true);
		try {
			const nextState = await ensureOnboardingWorkspace({});
			const persisted = { ownerSessionKey: sessionKey, state: nextState };
			setLocalState(persisted);
			persistWorkspaceAccessState(persisted);
			setFeedback({ type: "success", message: "Workspace ready." });
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to create workspace" });
		} finally {
			setIsCreating(false);
		}
	}

	/* ── Loading / no session states ── */
	if (isSessionPending) {
		return (
			<div className="app-card p-5">
				<p className="app-loading">Checking session…</p>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="app-card p-6 flex flex-col gap-5">
				<div>
					<p className="app-eyebrow app-eyebrow--violet mb-2">Workspace access</p>
					<h2 className="app-h2 mb-2">Join your pod</h2>
					<p className="app-body">Create an account or sign in to continue.</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Link href="/sign-up" className={buttonVariants()}>Sign up</Link>
					<Link href="/sign-in" className={buttonVariants({ variant: "outline" })}>Sign in</Link>
				</div>
			</div>
		);
	}

	if (!resolvedWorkspaceState) {
		return (
			<div className="app-card p-5">
				<p className="app-loading">Loading workspace…</p>
			</div>
		);
	}

	if (resolvedWorkspaceState.isMember && resolvedWorkspaceState.workspace) {
		return (
			<div className="flex flex-col gap-3">
				<WorkspaceDetails
					name={resolvedWorkspaceState.workspace.name}
					podCode={resolvedWorkspaceState.workspace.podCode}
					role={resolvedWorkspaceState.workspace.role}
				/>
				<FeedbackMessage feedback={feedback} />
			</div>
		);
	}

	if (resolvedWorkspaceState.canCreateWorkspace) {
		return (
			<div className="app-card p-6 flex flex-col gap-5">
				<div>
					<p className="app-eyebrow app-eyebrow--violet mb-2">Workspace access</p>
					<h2 className="app-h2 mb-2">Start your workspace</h2>
					<p className="app-body">
						Signed in as <span style={{ color: "#f0f0f0" }}>{title}</span>.
						Create the first workspace then share the pod code with your team.
					</p>
				</div>
				<Button disabled={isCreating} onClick={() => void handleCreateWorkspace()}>
					{isCreating ? "Creating…" : "Create workspace"}
				</Button>
				<FeedbackMessage feedback={feedback} />
			</div>
		);
	}

	return (
		<div className="app-card p-6 flex flex-col gap-5">
			<div>
				<p className="app-eyebrow app-eyebrow--violet mb-2">Workspace access</p>
				<h2 className="app-h2 mb-2">Join an existing workspace</h2>
				<p className="app-body">
					Signed in as <span style={{ color: "#f0f0f0" }}>{title}</span>.
					Enter a pod code to join your team's workspace.
				</p>
			</div>
			<form className="flex flex-col gap-4" onSubmit={handleJoin}>
				<div className="flex flex-col gap-2">
					<Label htmlFor="workspace-pod-code">Pod code</Label>
					<Input
						id="workspace-pod-code"
						autoComplete="off"
						disabled={isJoining}
						placeholder="pod-team01"
						value={podCode}
						onChange={(e) => setPodCode(e.currentTarget.value)}
					/>
				</div>
				<Button disabled={isJoining} type="submit">
					{isJoining ? "Joining…" : "Join workspace"}
				</Button>
				<FeedbackMessage feedback={feedback} />
			</form>
		</div>
	);
}
