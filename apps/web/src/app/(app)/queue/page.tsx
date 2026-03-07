"use client";

import { useQuery } from "convex/react";
import React from "react";

import { TicketTable } from "../../../components/queue/ticket-table";
import { getQueueSnapshotReference } from "../../../../../../packages/backend/convex/tickets_reference";

export default function QueuePage() {
	const queue = useQuery(getQueueSnapshotReference, {});
	const rows = queue?.rows ?? [];
	const summary = queue ?? { totalCount: 0, urgentCount: 0, fallbackCount: 0 };

	return (
		<section className="grid gap-4">
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
				<div className="border bg-card p-5 text-card-foreground">
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						Shared queue
					</p>
					<h2 className="mt-2 text-xl font-semibold tracking-tight">
						Shared Queue
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
						Live queue coverage shows AI classification, routing status, and
						who needs follow-through right now.
					</p>
				</div>
				<div className="border bg-card p-5 text-sm text-muted-foreground">
					<p className="text-[11px] uppercase tracking-[0.2em]">Queue health</p>
					<div className="mt-3 space-y-2">
						<p>
							<span className="font-medium text-foreground">
								{summary.totalCount} tickets
							</span>{" "}
							visible in the current queue
						</p>
						<p>
							<span className="font-medium text-foreground">
								{summary.urgentCount} urgent
							</span>{" "}
							item{summary.urgentCount === 1 ? "" : "s"} need immediate review
						</p>
						<p>
							<span className="font-medium text-foreground">
								{summary.fallbackCount} fallback
							</span>{" "}
							classification result{summary.fallbackCount === 1 ? "" : "s"}
						</p>
					</div>
				</div>
			</div>
			{queue ? (
				<TicketTable rows={rows} />
			) : (
				<div className="border bg-card p-5 text-sm text-muted-foreground">
					Loading live queue...
				</div>
			)}
		</section>
	);
}
