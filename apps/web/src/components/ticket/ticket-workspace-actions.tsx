"use client";

import { useAction, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createNoteReference } from "../../../../../packages/backend/convex/notes_reference";
import { applyLeadReviewReference } from "../../../../../packages/backend/convex/review_reference";
import { classifyAndRouteActionReference } from "../../../../../packages/backend/convex/tickets_reference";
import { humanizeSnakeCase } from "../../lib/utils";

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
	/** When true, lead cannot assign themselves — only agents in the dropdown */
	isLead?: boolean;
	currentUserId?: string | null;
};

export function TicketWorkspaceActions({
	ticketId,
	reviewState,
	assignedWorkerId,
	recommendedAssigneeOptions,
	isLead = false,
	currentUserId = null,
}: TicketWorkspaceActionsProps) {
	const router = useRouter();
	const createNote = useMutation(createNoteReference);
	const applyLeadReview = useMutation(applyLeadReviewReference);
	const classifyAndRoute = useAction(classifyAndRouteActionReference);
	/** Lead can only assign agents, not themselves; filter out current user when lead */
	const assigneeOptions = useMemo(
		() =>
			isLead && currentUserId != null
				? recommendedAssigneeOptions.filter((opt) => opt.id !== currentUserId)
				: recommendedAssigneeOptions,
		[isLead, currentUserId, recommendedAssigneeOptions],
	);
	const [noteBody, setNoteBody] = useState("");
	const initialAssignee =
		assignedWorkerId && assigneeOptions.some((o) => o.id === assignedWorkerId)
			? assignedWorkerId
			: assigneeOptions[0]?.id ?? "";
	const [selectedAssigneeId, setSelectedAssigneeId] = useState(initialAssignee);
	const [status, setStatus] = useState<string | null>(null);
	const [isSavingNote, setIsSavingNote] = useState(false);
	const [isApplyingReview, setIsApplyingReview] = useState(false);
	const [isClassifying, setIsClassifying] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const needsReview =
		reviewState === "manager_verification" || reviewState === "manual_triage";
	const canApprove = Boolean(selectedAssigneeId);

	const recommendationSummary = useMemo(() => {
		const top = assigneeOptions[0];
		if (!top) return "No recommended assignee available yet.";
		const tierLabel = top.skillMatchTier !== "none" ? `${humanizeSnakeCase(top.skillMatchTier)}, ` : "";
		return `${top.label} — ${tierLabel}${top.capacityRemaining} open slots`;
	}, [assigneeOptions]);

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

	async function handleReclassifyAndRoute() {
		if (isClassifying) return;
		setIsClassifying(true);
		setStatus(null);
		try {
			await classifyAndRoute({ ticketId });
			setStatus("Re-classified and routed");
			router.refresh();
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Failed to re-classify and route");
		} finally {
			setIsClassifying(false);
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

			{/* Assignee + review actions — only leads can assign */}
			{isLead && (
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

					<div style={{ position: "relative" }}>
						<button
							aria-label="Select assignee"
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							className="app-select flex justify-between items-center w-full"
							style={{ textAlign: "left" }}
						>
							<span>
								{selectedAssigneeId
									? assigneeOptions.find((o) => o.id === selectedAssigneeId)?.label || "Select assignee"
									: "Select assignee"}
							</span>
							<span style={{ fontSize: "0.8rem", opacity: 0.5 }}>▼</span>
						</button>

						{isDropdownOpen && (
							<div
								className="app-card"
								style={{
									position: "absolute",
									top: "100%",
									left: 0,
									right: 0,
									marginTop: "0.5rem",
									zIndex: 10,
									maxHeight: "200px",
									overflowY: "auto",
									padding: "0.25rem",
									display: "flex",
									flexDirection: "column",
									gap: "0.25rem",
								}}
							>
								{assigneeOptions.map((opt) => (
									<button
										key={opt.id}
										onClick={() => {
											setSelectedAssigneeId(opt.id);
											setIsDropdownOpen(false);
										}}
										className="flex items-center justify-between p-2 rounded hover:bg-white/10 transition-colors"
										style={{
											textAlign: "left",
											width: "100%",
											background: opt.id === selectedAssigneeId ? "rgba(255,255,255,0.05)" : "transparent",
											border: "none",
											cursor: "pointer",
										}}
									>
										<span className="app-body" style={{ color: "#f0f0f0" }}>{opt.label}</span>
										<div className="flex items-center gap-2">
											{opt.skillMatchTier !== "none" && (
												<span
													className="app-badge"
													style={{
														padding: "2px 6px",
														fontSize: "0.65rem",
														textTransform: "none",
														color: opt.skillMatchTier === "primary" ? "#8b5cf6" : "#9ca3af",
														borderColor: opt.skillMatchTier === "primary" ? "rgba(139,92,246,0.3)" : "rgba(156,163,175,0.3)",
														background: opt.skillMatchTier === "primary" ? "rgba(139,92,246,0.05)" : "rgba(156,163,175,0.05)"
													}}
												>
													{humanizeSnakeCase(opt.skillMatchTier)}
												</span>
											)}
											<span className="app-body" style={{ fontSize: "0.75rem", color: "rgba(240,240,240,0.5)" }}>
												{opt.capacityRemaining} open
											</span>
										</div>
									</button>
								))}
							</div>
						)}
					</div>

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

					<div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
						<button
							type="button"
							onClick={() => void handleReclassifyAndRoute()}
							disabled={isClassifying}
							className="app-btn app-btn--sm"
						>
							{isClassifying ? "Re-classifying…" : "Re-classify and route"}
						</button>
					</div>
				</div>
			)}

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
