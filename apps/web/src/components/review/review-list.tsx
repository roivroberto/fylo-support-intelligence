import type { Route } from "next";
import Link from "next/link";

type ReviewItem = {
	id: string;
	title: string;
	decisionWindow: string;
	owner: string;
	note: string;
	reviewState?: string;
	decisionHref?: string;
	requestType?: string;
	priority?: string;
};

function reviewStateBadge(state: string | undefined): string {
	if (!state) return "app-badge app-badge--pending";
	const s = state.toLowerCase();
	if (s.includes("approved") || s.includes("complete")) return "app-badge app-badge--routed";
	if (s.includes("manual") || s.includes("triage"))     return "app-badge app-badge--urgent";
	return "app-badge app-badge--review";
}

export function ReviewList({ items }: { items: ReviewItem[] }) {
	if (items.length === 0) {
		return (
			<div className="app-card">
				<p className="app-empty">No items pending review.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{items.map((item) => (
				<article key={item.id} className="app-card p-5">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						{/* Left */}
						<div className="flex flex-col gap-1.5 min-w-0">
							<p className="app-eyebrow">{item.id}</p>

							{item.decisionHref ? (
								<Link
									href={item.decisionHref as Route}
									className="app-h3 hover:text-violet-400 transition-colors"
									style={{ textDecoration: "none" }}
								>
									{item.title}
								</Link>
							) : (
								<h2 className="app-h3">{item.title}</h2>
							)}

							{(item.requestType ?? item.priority) && (
								<p className="app-field-label" style={{ marginTop: "0.1rem" }}>
									{[item.requestType, item.priority].filter(Boolean).join(" · ")}
								</p>
							)}

							<p className="app-body" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
								{item.note}
							</p>
						</div>

						{/* Right */}
						<div className="flex flex-col items-start gap-2 sm:items-end shrink-0">
							{item.reviewState && (
								<span className={reviewStateBadge(item.reviewState)}>
									{item.reviewState}
								</span>
							)}
							<p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.8rem", color: "rgba(240,240,240,0.6)" }}>
								{item.owner}
							</p>
							<p style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.65rem", color: "rgba(240,240,240,0.3)" }}>
								{item.decisionWindow}
							</p>
						</div>
					</div>
				</article>
			))}
		</div>
	);
}

export type { ReviewItem };
