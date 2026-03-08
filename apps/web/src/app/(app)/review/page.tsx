"use client";

import { useQuery } from "convex/react";

import { ReviewList } from "../../../components/review/review-list";
import { getReviewSnapshotReference } from "../../../../../../packages/backend/convex/tickets_reference";
import { authClient } from "../../../lib/auth-client";

export default function ReviewPage() {
	const { data: session } = authClient.useSession();
	const review = useQuery(getReviewSnapshotReference, session ? {} : "skip");
	const items = review?.items ?? [];
	const count = review?.count ?? 0;

	return (
		<section className="flex flex-col gap-5">
			<div className="grid gap-4 lg:grid-cols-[1fr_auto]">
				<div className="app-card p-5">
					<p className="app-eyebrow app-eyebrow--violet mb-2">Review queue</p>
					<h1 className="app-h2 mb-2">Human decisions in flight</h1>
					<p className="app-body">
						Tickets that need lead confirmation or manual triage before routing
						can proceed.
					</p>
				</div>
				<div className="app-stat-card" style={{ minWidth: "9rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
					<div
						className="app-stat-val"
						style={{ color: count > 0 ? "#fbbf24" : undefined }}
					>
						{count}
					</div>
					<div className="app-stat-label">Open items</div>
				</div>
			</div>

			{review ? (
				<ReviewList items={items} />
			) : (
				<div className="app-card">
					<p className="app-loading">Loading review queue…</p>
				</div>
			)}
		</section>
	);
}
