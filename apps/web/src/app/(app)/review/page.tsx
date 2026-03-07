"use client";

import { useQuery } from "convex/react";
import React from "react";

import { ReviewList } from "../../../components/review/review-list";
import { getReviewSnapshotReference } from "../../../../../../packages/backend/convex/tickets_reference";

export default function ReviewPage() {
	const review = useQuery(getReviewSnapshotReference, {});
	const items = review?.items ?? [];
	const count = review?.count ?? 0;

	return (
		<section className="grid gap-4">
			<div className="border bg-card p-5 text-card-foreground">
				<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
					Review
				</p>
					<h2 className="mt-2 text-xl font-semibold tracking-tight">
						Human decisions still in flight
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
						This live review queue shows tickets that still require lead
						confirmation or manual triage.
					</p>
					<p className="mt-3 text-sm text-muted-foreground">
						<span className="font-medium text-foreground">{count}</span> open
						review item{count === 1 ? "" : "s"}
					</p>
				</div>
			{review ? (
				<ReviewList items={items} />
			) : (
				<div className="border bg-card p-5 text-sm text-muted-foreground">
					Loading review decisions...
				</div>
			)}
		</section>
	);
}
