"use client";

import { useAction } from "convex/react";
import { useEffect, useRef, useState } from "react";

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
	return { ticketId, draftState: draft, status: null, isSending: false, isRegenerating: false, hasSent: false };
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
}: DraftReplyPanelViewState & { currentTicketId: string; nextDraft: TicketDraftWorkspace }) {
	if (ticketId !== currentTicketId) {
		return createDraftReplyPanelViewState(currentTicketId, nextDraft);
	}
	return { ticketId, draftState, status, isSending, isRegenerating, hasSent };
}

type DraftReplyPanelProps = {
	ticketId: string;
	to: string | null;
	subject: string | null;
	draft: TicketDraftWorkspace;
};

export function DraftReplyPanel({ ticketId, to, subject, draft }: DraftReplyPanelProps) {
	const sendApproved = useAction(sendApprovedReplyReference);
	const regenerateDraft = useAction(regenerateTicketDraftReference);
	const [viewState, setViewState] = useState(() =>
		createDraftReplyPanelViewState(ticketId, draft),
	);
	const latestRegenerationRequestRef = useRef(0);
	const currentTicketIdRef = useRef(ticketId);
	currentTicketIdRef.current = ticketId;

	const { draftState, status, isSending, isRegenerating, hasSent } =
		getDraftReplyPanelViewState({ ...viewState, currentTicketId: ticketId, nextDraft: draft });
	const canSend = Boolean(to && subject) && !hasSent && !isRegenerating;

	useEffect(() => {
		setViewState((cur) =>
			cur.ticketId === ticketId
				? { ...cur, draftState: draft }
				: createDraftReplyPanelViewState(ticketId, draft),
		);
	}, [ticketId, draft]);

	async function handleSend() {
		if (!to || !subject || isSending || hasSent) return;
		const reqTicketId = ticketId;
		setViewState((c) => ({ ...getDraftReplyPanelViewState({ ...c, currentTicketId: reqTicketId, nextDraft: draft }), isSending: true, status: null }));
		try {
			const result = await sendApproved({ ticketId: reqTicketId, draftReply: draftState.draftReply });
			if (currentTicketIdRef.current !== reqTicketId) return;
			setViewState((c) => ({ ...getDraftReplyPanelViewState({ ...c, currentTicketId: reqTicketId, nextDraft: draft }), hasSent: true, status: `Reply sent (${result.providerMessageId})` }));
		} catch (error) {
			if (currentTicketIdRef.current !== reqTicketId) return;
			setViewState((c) => ({ ...getDraftReplyPanelViewState({ ...c, currentTicketId: reqTicketId, nextDraft: draft }), status: error instanceof Error ? error.message : "Failed to send reply" }));
		} finally {
			if (currentTicketIdRef.current === reqTicketId) {
				setViewState((c) => ({ ...getDraftReplyPanelViewState({ ...c, currentTicketId: reqTicketId, nextDraft: draft }), isSending: false }));
			}
		}
	}

	async function handleRegenerate() {
		if (isRegenerating) return;
		setViewState((c) => ({ ...getDraftReplyPanelViewState({ ...c, currentTicketId: ticketId, nextDraft: draft }), isRegenerating: true, status: null }));
		const reqId = latestRegenerationRequestRef.current + 1;
		latestRegenerationRequestRef.current = reqId;
		const reqTicketId = ticketId;
		try {
			const regenerated = await regenerateDraft({ ticketId });
			if (latestRegenerationRequestRef.current !== reqId || currentTicketIdRef.current !== reqTicketId) return;
			setViewState((c) => ({ ...getDraftReplyPanelViewState({ ...c, currentTicketId: reqTicketId, nextDraft: draft }), draftState: regenerated }));
		} catch (error) {
			if (latestRegenerationRequestRef.current !== reqId || currentTicketIdRef.current !== reqTicketId) return;
			setViewState((c) => ({ ...getDraftReplyPanelViewState({ ...c, currentTicketId: reqTicketId, nextDraft: draft }), status: error instanceof Error ? error.message : "Failed to regenerate draft" }));
		} finally {
			if (latestRegenerationRequestRef.current === reqId && currentTicketIdRef.current === reqTicketId) {
				setViewState((c) => ({ ...getDraftReplyPanelViewState({ ...c, currentTicketId: reqTicketId, nextDraft: draft }), isRegenerating: false }));
			}
		}
	}

	const draftSections = [
		{ label: "Conversation summary",  value: draftState.summary },
		{ label: "Recommended action",    value: draftState.recommendedAction },
		{ label: "Draft reply",           value: draftState.draftReply, pre: true },
	];

	return (
		<div className="app-card p-5 flex flex-col gap-5">
			{/* Header row */}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-2">
					<p className="app-eyebrow app-eyebrow--violet">AI reply workspace</p>
					<h3 className="app-h3">Summary & draft reply</h3>
					<button
						type="button"
						onClick={() => void handleRegenerate()}
						disabled={isRegenerating || isSending}
						className="app-btn app-btn--sm w-fit"
					>
						{isRegenerating ? "Regenerating…" : "Regenerate draft"}
					</button>
				</div>
				<span className="app-badge app-badge--pending" style={{ flexShrink: 0 }}>
					{draftState.generatedAtLabel}
				</span>
			</div>

			{/* Send area */}
			<div
				style={{
					background: hasSent ? "rgba(52,211,153,0.05)" : "rgba(167,139,250,0.04)",
					border: `1px solid ${hasSent ? "rgba(52,211,153,0.2)" : "rgba(167,139,250,0.15)"}`,
					borderRadius: "4px",
					padding: "0.85rem 1rem",
					display: "flex",
					flexDirection: "column",
					gap: "0.6rem",
				}}
			>
				<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="app-field-label mb-1">Approved send</p>
						<p className="app-body" style={{ fontSize: "0.8rem", color: hasSent ? "#34d399" : "#f0f0f0" }}>
							{hasSent
								? "Reply sent"
								: isRegenerating
									? "Refreshing draft before send…"
									: canSend
										? `Ready to send to ${to}`
										: "Requester email and subject required before sending."}
						</p>
					</div>
					<button
						type="button"
						onClick={() => void handleSend()}
						disabled={!canSend || isSending}
						className={`app-btn app-btn--sm${hasSent ? "" : " app-btn--primary"}`}
						style={{ flexShrink: 0 }}
					>
						{isSending ? "Sending…" : hasSent ? "Sent ✓" : "Send approved reply"}
					</button>
				</div>
				{status && (
					<p className="app-feedback" style={{ color: status.includes("Failed") || status.includes("failed") ? "#f87171" : "#34d399", fontSize: "0.7rem" }}>
						{status}
					</p>
				)}
			</div>

			{/* Content sections */}
			<div className="flex flex-col gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
				{draftSections.map(({ label, value, pre }) => (
					<div key={label}>
						<p className="app-field-label mb-2">{label}</p>
						{pre ? (
							<pre
								style={{
									fontFamily: "var(--font-dm-sans), sans-serif",
									fontSize: "0.8rem",
									lineHeight: 1.65,
									color: "rgba(240,240,240,0.8)",
									whiteSpace: "pre-wrap",
									margin: 0,
								}}
							>
								{value}
							</pre>
						) : (
							<p className="app-body" style={{ fontSize: "0.8rem" }}>{value}</p>
						)}
					</div>
				))}
			</div>

			{draftState.usedFallback && (
				<p
					className="app-body"
					style={{
						fontSize: "0.75rem",
						padding: "0.6rem 0.75rem",
						background: "rgba(251,191,36,0.05)",
						border: "1px solid rgba(251,191,36,0.15)",
						borderRadius: "4px",
						color: "#fbbf24",
					}}
				>
					Using deterministic fallback — latest AI generation did not return a usable reply.
				</p>
			)}
		</div>
	);
}
