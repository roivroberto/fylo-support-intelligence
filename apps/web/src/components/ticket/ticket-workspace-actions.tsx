"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

import { createNoteReference } from "../../../../../packages/backend/convex/notes_reference";
import { applyLeadReviewReference } from "../../../../../packages/backend/convex/review_reference";

type AssigneeOption = {
	id: string;
	label: string;
	skillMatchTier: string;
	capacityRemaining: number;
	languageMatch: boolean;
};

type TicketWorkspaceActionsProps = {
	ticketId: string;
	reviewState: string;
	assignedWorkerId?: string | null;
	recommendedAssigneeOptions: AssigneeOption[];
};

export function TicketWorkspaceActions({
	ticketId,
	reviewState,
	assignedWorkerId,
	recommendedAssigneeOptions,
}: TicketWorkspaceActionsProps) {
	const router = useRouter();
	const createNote = useMutation(createNoteReference);
	const applyLeadReview = useMutation(applyLeadReviewReference);
	const [noteBody, setNoteBody] = useState("");
	const [selectedAssigneeId, setSelectedAssigneeId] = useState(
		assignedWorkerId ?? recommendedAssigneeOptions[0]?.id ?? "",
	);
	const [status, setStatus] = useState<string | null>(null);
	const [isSavingNote, setIsSavingNote] = useState(false);
	const [isApplyingReview, setIsApplyingReview] = useState(false);
	const needsReview =
		reviewState === "manager_verification" || reviewState === "manual_triage";
	const canApprove = Boolean(selectedAssigneeId);
	const recommendationSummary = useMemo(() => {
		const topOption = recommendedAssigneeOptions[0];

		if (!topOption) {
			return "No recommended assignee is available yet.";
		}

		return `${topOption.label} is the current top recommendation (${topOption.skillMatchTier}, ${topOption.capacityRemaining} open slots).`;
	}, [recommendedAssigneeOptions]);

	async function handleAddNote() {
		const nextBody = noteBody.trim();

		if (!nextBody || isSavingNote) {
			return;
		}

		setIsSavingNote(true);
		setStatus(null);

		try {
			await createNote({ ticketId, body: nextBody });
			setNoteBody("");
			setStatus("Note added");
			router.refresh();
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Failed to add note");
		} finally {
			setIsSavingNote(false);
		}
	}

	async function handleReviewAction(action: "approve" | "reassign") {
		if (isApplyingReview) {
			return;
		}

		setIsApplyingReview(true);
		setStatus(null);

		try {
			await applyLeadReview({
				ticketId,
				action,
				...(selectedAssigneeId ? { assignedWorkerId: selectedAssigneeId } : {}),
			});
			setStatus(
				action === "approve"
					? "Review approved"
					: "Ticket sent back through routing",
			);
			router.refresh();
		} catch (error) {
			setStatus(
				error instanceof Error ? error.message : "Failed to apply review action",
			);
		} finally {
			setIsApplyingReview(false);
		}
	}

	return (
		<section className="border bg-card p-5 text-card-foreground">
			<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
				Workflow actions
			</p>
			<div className="mt-4 grid gap-4">
				<div className="grid gap-2">
					<label className="text-xs uppercase tracking-[0.18em] text-muted-foreground" htmlFor="ticket-note-body">
						New note
					</label>
					<textarea
						id="ticket-note-body"
						value={noteBody}
						onChange={(event) => setNoteBody(event.currentTarget.value)}
						placeholder="Capture lead guidance, handoff context, or routing concerns."
						className="min-h-28 border bg-background px-3 py-2 text-sm text-foreground outline-none"
					/>
					<button
						type="button"
						onClick={() => void handleAddNote()}
						disabled={isSavingNote || noteBody.trim().length === 0}
						className="inline-flex w-fit items-center justify-center border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSavingNote ? "Saving..." : "Add note"}
					</button>
				</div>

				<div className="grid gap-3 border border-dashed p-4">
					<div>
						<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
							Recommended assignee
						</p>
						<p className="mt-2 text-sm text-foreground">{recommendationSummary}</p>
					</div>
					<select
						value={selectedAssigneeId}
						onChange={(event) => setSelectedAssigneeId(event.currentTarget.value)}
						className="border bg-background px-3 py-2 text-sm text-foreground"
					>
						<option value="">Select assignee</option>
						{recommendedAssigneeOptions.map((option) => (
							<option key={option.id} value={option.id}>
								{option.label} - {option.skillMatchTier} - {option.capacityRemaining} open
							</option>
						))}
					</select>
					{needsReview ? (
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => void handleReviewAction("approve")}
								disabled={isApplyingReview || !canApprove}
								className="inline-flex items-center justify-center border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isApplyingReview ? "Applying..." : "Approve assignment"}
							</button>
							<button
								type="button"
								onClick={() => void handleReviewAction("reassign")}
								disabled={isApplyingReview}
								className="inline-flex items-center justify-center border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isApplyingReview ? "Applying..." : "Re-run routing"}
							</button>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							This ticket is already assignable without extra review.
						</p>
					)}
				</div>

				{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
			</div>
		</section>
	);
}
