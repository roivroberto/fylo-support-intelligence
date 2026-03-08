"use client";

import { useQuery } from "convex/react";

import { TicketTable } from "../../../components/queue/ticket-table";
import { getQueueSnapshotReference } from "../../../../../../packages/backend/convex/tickets_reference";

export default function QueuePage() {
	const queue = useQuery(getQueueSnapshotReference, {});
	const rows = queue?.rows ?? [];
	const summary = queue ?? { totalCount: 0, urgentCount: 0, fallbackCount: 0 };

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

			{/* Table */}
			{queue ? (
				<TicketTable rows={rows} />
			) : (
				<div className="app-card">
					<p className="app-loading">Loading live queue…</p>
				</div>
			)}
		</section>
	);
}
