"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
		const top = recommendedAssigneeOptions[0];
		if (!top) return "No recommended assignee available yet.";
		return `${top.label} — ${top.skillMatchTier}, ${top.capacityRemaining} open slots`;
	}, [recommendedAssigneeOptions]);

	async function handleAddNote() {
		const body = noteBody.trim();
		if (!body || isSavingNote) return;
		setIsSavingNote(true);
		setStatus(null);
		try {
			await createNote({ ticketId, body });
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
		if (isApplyingReview) return;
		setIsApplyingReview(true);
		setStatus(null);
		try {
			await applyLeadReview({
				ticketId,
				action,
				...(selectedAssigneeId ? { assignedWorkerId: selectedAssigneeId } : {}),
			});
			setStatus(action === "approve" ? "Review approved" : "Ticket re-routed");
			router.refresh();
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Failed to apply review");
		} finally {
			setIsApplyingReview(false);
		}
	}

	return (
		<div className="app-card p-5 flex flex-col gap-5">
			<p className="app-eyebrow">Workflow actions</p>

			{/* Note input */}
			<div className="flex flex-col gap-2">
				<label htmlFor="ticket-note-body" className="app-field-label">
					Add note
				</label>
				<textarea
					id="ticket-note-body"
					value={noteBody}
					onChange={(e) => setNoteBody(e.currentTarget.value)}
					placeholder="Capture lead guidance, handoff context, or routing concerns…"
					className="app-textarea"
					style={{ minHeight: "5.5rem" }}
				/>
				<button
					type="button"
					onClick={() => void handleAddNote()}
					disabled={isSavingNote || noteBody.trim().length === 0}
					className="app-btn app-btn--sm w-fit"
				>
					{isSavingNote ? "Saving…" : "Add note"}
				</button>
			</div>

			{/* Assignee + review actions */}
			<div
				className="flex flex-col gap-3 p-4"
				style={{
					background: "rgba(167,139,250,0.04)",
					border: "1px solid rgba(167,139,250,0.15)",
					borderRadius: "4px",
				}}
			>
				<div>
					<p className="app-field-label mb-1">Recommended assignee</p>
					<p className="app-body" style={{ fontSize: "0.8rem", color: "#f0f0f0" }}>
						{recommendationSummary}
					</p>
				</div>

				<select
					value={selectedAssigneeId}
					onChange={(e) => setSelectedAssigneeId(e.currentTarget.value)}
					className="app-select"
				>
					<option value="">Select assignee</option>
					{recommendedAssigneeOptions.map((opt) => (
						<option key={opt.id} value={opt.id}>
							{opt.label} — {opt.skillMatchTier} — {opt.capacityRemaining} open
						</option>
					))}
				</select>

				{needsReview ? (
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => void handleReviewAction("approve")}
							disabled={isApplyingReview || !canApprove}
							className="app-btn app-btn--primary app-btn--sm"
						>
							{isApplyingReview ? "Applying…" : "Approve assignment"}
						</button>
						<button
							type="button"
							onClick={() => void handleReviewAction("reassign")}
							disabled={isApplyingReview}
							className="app-btn app-btn--sm"
						>
							{isApplyingReview ? "Applying…" : "Re-run routing"}
						</button>
					</div>
				) : (
					<p className="app-body" style={{ fontSize: "0.75rem" }}>
						Ticket is assignable without extra review.
					</p>
				)}
			</div>

			{status && (
				<p
					className="app-feedback"
					style={{ color: status.includes("Failed") ? "#f87171" : "#34d399" }}
				>
					{status}
				</p>
			)}
		</div>
	);
}
