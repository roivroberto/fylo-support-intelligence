"use client";

import { useAction } from "convex/react";
import React, { useState } from "react";

import { sendApprovedReplyReference } from "../../../../../packages/backend/convex/replies_reference";

type DraftReplyPanelProps = {
	ticketId: string;
	to: string | null;
	subject: string | null;
	draft: {
		summary: string;
		recommendedAction: string;
		draftReply: string;
		usedFallback: boolean;
		generatedAtLabel: string;
	};
};

export function DraftReplyPanel({
	ticketId,
	to,
	subject,
	draft,
}: DraftReplyPanelProps) {
	const sendApproved = useAction(sendApprovedReplyReference);
	const [status, setStatus] = useState<string | null>(null);
	const [isSending, setIsSending] = useState(false);
	const [hasSent, setHasSent] = useState(false);
	const canSend = Boolean(to && subject) && !hasSent;

	async function handleSend() {
		if (!to || !subject || isSending || hasSent) {
			return;
		}

		setIsSending(true);
		setStatus(null);

		try {
			const result = await sendApproved({
				ticketId,
				draftReply: draft.draftReply,
			});
			setHasSent(true);
			setStatus(`Reply sent via Resend (${result.providerMessageId})`);
		} catch (error) {
			setStatus(
				error instanceof Error
					? error.message
					: "Failed to send approved reply",
			);
		} finally {
			setIsSending(false);
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
				</div>
				<span className="inline-flex w-fit border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground">
					{draft.generatedAtLabel}
				</span>
			</div>

			<div className="mt-4 grid gap-4 text-sm">
				<div className="flex flex-col gap-3 border border-dashed px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
							Approved send
						</p>
						<p className="mt-2 text-sm text-foreground">
							{hasSent
								? "Reply sent"
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
					<p className="mt-2 text-foreground">{draft.summary}</p>
				</div>
				<div>
					<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
						Recommended action
					</p>
					<p className="mt-2 text-foreground">{draft.recommendedAction}</p>
				</div>
				<div>
					<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
						Draft reply
					</p>
					<pre className="mt-2 whitespace-pre-wrap font-sans text-foreground">
						{draft.draftReply}
					</pre>
				</div>
				{draft.usedFallback ? (
					<p className="border border-dashed px-3 py-2 text-xs text-muted-foreground">
						Using the deterministic fallback draft until live model generation
						is configured.
					</p>
				) : null}
			</div>
		</section>
	);
}
