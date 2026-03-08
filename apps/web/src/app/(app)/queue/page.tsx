"use client";

import { useAction, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { QueueTableErrorBoundary } from "../../../components/queue/queue-table-error-boundary";
import { TicketTable } from "../../../components/queue/ticket-table";
import {
	createTicketFromFormReference,
	getQueueSnapshotReference,
} from "../../../../../../packages/backend/convex/tickets_reference";
import { authClient } from "../../../lib/auth-client";

export default function QueuePage() {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const queue = useQuery(getQueueSnapshotReference, session ? {} : "skip");
	const createTicketFromForm = useAction(createTicketFromFormReference);
	const rows = queue?.rows ?? [];
	const summary = queue ?? { totalCount: 0, urgentCount: 0, fallbackCount: 0 };

	const [showCreateForm, setShowCreateForm] = useState(false);
	const [requesterEmail, setRequesterEmail] = useState("");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);

	async function handleCreateTicket(e: React.FormEvent) {
		e.preventDefault();
		setCreateError(null);
		setIsSubmitting(true);
		try {
			const { ticketId } = await createTicketFromForm({
				requesterEmail: requesterEmail.trim() || null,
				subject: subject.trim() || null,
				body: body.trim() || undefined,
			});
			setShowCreateForm(false);
			setRequesterEmail("");
			setSubject("");
			setBody("");
			router.push(`/tickets/${ticketId}`);
		} catch (err) {
			setCreateError(err instanceof Error ? err.message : "Failed to create ticket");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<section className="flex flex-col gap-5">
			{/* Page header */}
			<div className="grid gap-4 lg:grid-cols-[1fr_auto]">
				<div className="app-card p-5">
					<p className="app-eyebrow app-eyebrow--violet mb-2">Shared queue</p>
					<h1 className="app-h2 mb-2">Ticket queue</h1>
					<p className="app-body">
						Live routing status, AI classification confidence, and assignment for
						every open ticket.
					</p>
					<button
						type="button"
						onClick={() => setShowCreateForm((v) => !v)}
						className="app-btn app-btn--sm mt-3"
					>
						{showCreateForm ? "Cancel" : "Create ticket"}
					</button>
				</div>

				{/* Queue health stats */}
				<div className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:w-56">
					<div className="app-stat-card">
						<div className="app-stat-val">{summary.totalCount}</div>
						<div className="app-stat-label">Total tickets</div>
					</div>
					<div className="app-stat-card">
						<div className="app-stat-val" style={{ color: summary.urgentCount > 0 ? "#f87171" : undefined }}>
							{summary.urgentCount}
						</div>
						<div className="app-stat-label">Urgent</div>
					</div>
					<div className="app-stat-card">
						<div className="app-stat-val" style={{ color: summary.fallbackCount > 0 ? "#fbbf24" : undefined }}>
							{summary.fallbackCount}
						</div>
						<div className="app-stat-label">Fallback</div>
					</div>
				</div>
			</div>

			{/* Create ticket form */}
			{showCreateForm && (
				<div className="app-card p-5 border-l-[3px] border-l-[#a78bfa]/50">
					<p className="app-eyebrow mb-1">Manual ingest</p>
					<h2 className="app-h3 mb-1">Create ticket</h2>
					<p className="app-body text-[rgba(240,240,240,0.5)] text-sm mb-5 max-w-xl">
						Add a ticket manually. It will be classified and routed like incoming messages.
					</p>
					<form
						onSubmit={handleCreateTicket}
						className="flex flex-col gap-5 max-w-xl"
						aria-describedby={createError ? "create-ticket-error" : undefined}
					>
						<div className="grid gap-1">
							<label htmlFor="create-requester" className="app-field-label block">
								Requester email
							</label>
							<input
								id="create-requester"
								type="email"
								value={requesterEmail}
								onChange={(e) => {
									setRequesterEmail(e.target.value);
									if (createError) setCreateError(null);
								}}
								className="app-input w-full"
								placeholder="customer@example.com"
								autoComplete="email"
								aria-invalid={createError ? "true" : undefined}
							/>
						</div>
						<div className="grid gap-1">
							<label htmlFor="create-subject" className="app-field-label block">
								Subject
							</label>
							<input
								id="create-subject"
								type="text"
								value={subject}
								onChange={(e) => {
									setSubject(e.target.value);
									if (createError) setCreateError(null);
								}}
								className="app-input w-full"
								placeholder="Brief subject"
								aria-invalid={createError ? "true" : undefined}
							/>
						</div>
						<div className="grid gap-1">
							<label htmlFor="create-body" className="app-field-label block">
								Body <span className="font-normal text-[rgba(240,240,240,0.35)]">(optional)</span>
							</label>
							<textarea
								id="create-body"
								value={body}
								onChange={(e) => setBody(e.target.value)}
								className="app-textarea w-full resize-y min-h-[6rem]"
								rows={4}
								placeholder="Message or context…"
							/>
						</div>
						{createError && (
							<p
								id="create-ticket-error"
								role="alert"
								className="text-sm font-medium text-[#f87171] bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] rounded px-3 py-2"
							>
								{createError}
							</p>
						)}
						<div className="flex flex-wrap items-center gap-3 pt-1">
							<button
								type="submit"
								disabled={isSubmitting}
								className="app-btn app-btn--primary"
								aria-busy={isSubmitting ? "true" : undefined}
							>
								{isSubmitting ? "Creating…" : "Create and classify"}
							</button>
							<button
								type="button"
								onClick={() => {
									setShowCreateForm(false);
									setCreateError(null);
									setRequesterEmail("");
									setSubject("");
									setBody("");
								}}
								className="app-btn"
								disabled={isSubmitting}
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Table: single mount to avoid removeChild on unmount when queue reconnects */}
			<QueueTableErrorBoundary>
				<TicketTable rows={rows} loading={queue === undefined} />
			</QueueTableErrorBoundary>
		</section>
	);
}
