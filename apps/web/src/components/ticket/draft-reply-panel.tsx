"use client";

import { useAction } from "convex/react";
import React, { useEffect, useRef, useState } from "react";

import {
	regenerateTicketDraftReference,
	type TicketDraftWorkspace,
} from "../../../../../packages/backend/convex/drafts_reference";
import { sendApprovedReplyReference } from "../../../../../packages/backend/convex/replies_reference";

export type DraftReplyPanelViewState = {
	ticketId: string;
	draftState: TicketDraftWorkspace;
	status: string | null;
	isSending: boolean;
	isRegenerating: boolean;
	hasSent: boolean;
};

function createDraftReplyPanelViewState(
	ticketId: string,
	draft: TicketDraftWorkspace,
): DraftReplyPanelViewState {
	return {
		ticketId,
		draftState: draft,
		status: null,
		isSending: false,
		isRegenerating: false,
		hasSent: false,
	};
}

export function getDraftReplyPanelViewState({
	currentTicketId,
	nextDraft,
	ticketId,
	draftState,
	status,
	isSending,
	isRegenerating,
	hasSent,
	}: DraftReplyPanelViewState & {
	currentTicketId: string;
	nextDraft: TicketDraftWorkspace;
}) {
	if (ticketId !== currentTicketId) {
		return createDraftReplyPanelViewState(currentTicketId, nextDraft);
	}

	return {
		ticketId,
		draftState,
		status,
		isSending,
		isRegenerating,
		hasSent,
	};
}

type DraftReplyPanelProps = {
	ticketId: string;
	to: string | null;
	subject: string | null;
	draft: TicketDraftWorkspace;
};

export function DraftReplyPanel({
	ticketId,
	to,
	subject,
	draft,
}: DraftReplyPanelProps) {
	const sendApproved = useAction(sendApprovedReplyReference);
	const regenerateDraft = useAction(regenerateTicketDraftReference);
	const [viewState, setViewState] = useState(() =>
		createDraftReplyPanelViewState(ticketId, draft),
	);
	const latestRegenerationRequestRef = useRef(0);
	const currentTicketIdRef = useRef(ticketId);
	currentTicketIdRef.current = ticketId;
	const {
		draftState,
		status,
		isSending,
		isRegenerating,
		hasSent,
	} = getDraftReplyPanelViewState({
		...viewState,
		currentTicketId: ticketId,
		nextDraft: draft,
	});
	const canSend = Boolean(to && subject) && !hasSent && !isRegenerating;

	useEffect(() => {
		setViewState((current) =>
			current.ticketId === ticketId
				? { ...current, draftState: draft }
				: createDraftReplyPanelViewState(ticketId, draft),
		);
	}, [ticketId, draft]);

	async function handleSend() {
		if (!to || !subject || isSending || hasSent) {
			return;
		}

		const requestedTicketId = ticketId;

		setViewState((current) => ({
			...getDraftReplyPanelViewState({
				...current,
				currentTicketId: requestedTicketId,
				nextDraft: draft,
			}),
			isSending: true,
			status: null,
		}));

		try {
			const result = await sendApproved({
				ticketId: requestedTicketId,
				draftReply: draftState.draftReply,
			});

			if (currentTicketIdRef.current !== requestedTicketId) {
				return;
			}

			setViewState((current) => ({
				...getDraftReplyPanelViewState({
					...current,
					currentTicketId: requestedTicketId,
					nextDraft: draft,
				}),
				hasSent: true,
				status: `Reply sent via Resend (${result.providerMessageId})`,
			}));
		} catch (error) {
			if (currentTicketIdRef.current !== requestedTicketId) {
				return;
			}

			setViewState((current) => ({
				...getDraftReplyPanelViewState({
					...current,
					currentTicketId: requestedTicketId,
					nextDraft: draft,
				}),
				status:
					error instanceof Error
						? error.message
						: "Failed to send approved reply",
			}));
		} finally {
			if (currentTicketIdRef.current !== requestedTicketId) {
				return;
			}

			setViewState((current) => ({
				...getDraftReplyPanelViewState({
					...current,
					currentTicketId: requestedTicketId,
					nextDraft: draft,
				}),
				isSending: false,
			}));
		}
	}

	async function handleRegenerate() {
		if (isRegenerating) {
			return;
		}

		setViewState((current) => ({
			...getDraftReplyPanelViewState({
				...current,
				currentTicketId: ticketId,
				nextDraft: draft,
			}),
			isRegenerating: true,
			status: null,
		}));
		const requestId = latestRegenerationRequestRef.current + 1;
		latestRegenerationRequestRef.current = requestId;
		const requestedTicketId = ticketId;

		try {
			const regeneratedDraft = await regenerateDraft({
				ticketId,
			});

			if (
				latestRegenerationRequestRef.current !== requestId ||
				currentTicketIdRef.current !== requestedTicketId
			) {
				return;
			}

			setViewState((current) => ({
				...getDraftReplyPanelViewState({
					...current,
					currentTicketId: requestedTicketId,
					nextDraft: draft,
				}),
				draftState: regeneratedDraft,
			}));
		} catch (error) {
			if (
				latestRegenerationRequestRef.current !== requestId ||
				currentTicketIdRef.current !== requestedTicketId
			) {
				return;
			}

			setViewState((current) => ({
				...getDraftReplyPanelViewState({
					...current,
					currentTicketId: requestedTicketId,
					nextDraft: draft,
				}),
				status:
					error instanceof Error ? error.message : "Failed to regenerate draft",
			}));
		} finally {
			if (
				latestRegenerationRequestRef.current === requestId &&
				currentTicketIdRef.current === requestedTicketId
			) {
				setViewState((current) => ({
					...getDraftReplyPanelViewState({
						...current,
						currentTicketId: requestedTicketId,
						nextDraft: draft,
					}),
					isRegenerating: false,
				}));
			}
		}
	}

	return (
		<section className="border bg-card p-5 text-card-foreground">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						AI reply workspace
					</p>
					<h3 className="mt-3 text-base font-semibold tracking-tight">
						Summary and draft reply
					</h3>
					<button
						type="button"
						onClick={() => void handleRegenerate()}
						disabled={isRegenerating || isSending}
						className="mt-3 inline-flex w-fit items-center justify-center border px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isRegenerating ? "Regenerating..." : "Regenerate draft"}
					</button>
				</div>
				<span className="inline-flex w-fit border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground">
					{draftState.generatedAtLabel}
				</span>
			</div>
			<p className="mt-2 text-xs text-muted-foreground">
				Generated {new Date(draftState.generatedAt).toISOString()}
			</p>

			<div className="mt-4 grid gap-4 text-sm">
				<div className="flex flex-col gap-3 border border-dashed px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
							Approved send
						</p>
						<p className="mt-2 text-sm text-foreground">
							{hasSent
								? "Reply sent"
								: isRegenerating
									? "Refreshing draft before send..."
								: canSend
									? `Ready to send to ${to}`
									: "Requester email and subject are required before sending."}
						</p>
						{status ? (
							<p className="mt-2 text-xs text-muted-foreground">{status}</p>
						) : null}
					</div>
					<button
						type="button"
						onClick={() => void handleSend()}
						disabled={!canSend || isSending}
						className="inline-flex w-fit items-center justify-center border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-foreground disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSending
							? "Sending..."
							: hasSent
								? "Reply sent"
								: "Send approved reply"}
					</button>
				</div>
				<div>
					<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
						Conversation summary
					</p>
					<p className="mt-2 text-foreground">{draftState.summary}</p>
				</div>
				<div>
					<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
						Recommended action
					</p>
					<p className="mt-2 text-foreground">{draftState.recommendedAction}</p>
				</div>
				<div>
					<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
						Draft reply
					</p>
					<pre className="mt-2 whitespace-pre-wrap font-sans text-foreground">
						{draftState.draftReply}
					</pre>
				</div>
				{draftState.usedFallback ? (
					<p className="border border-dashed px-3 py-2 text-xs text-muted-foreground">
						Using the deterministic fallback draft because the latest AI
						generation did not return a usable reply.
					</p>
				) : null}
			</div>
		</section>
	);
}
