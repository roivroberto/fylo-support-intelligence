import type { Route } from "next";
import Link from "next/link";

type TicketRow = {
	id: string;
	reason: string;
	title?: string;
	requester?: string;
	priority?: "low" | "medium" | "high";
	status?: string;
	decisionHref?: string;
	assignedWorkerLabel?: string;
	classificationConfidence?: number;
	classificationSource?: "provider" | "fallback";
	requestType?: string;
};

const priorityClass: Record<NonNullable<TicketRow["priority"]>, string> = {
	low:    "priority-low",
	medium: "priority-medium",
	high:   "priority-high",
};

function statusBadgeClass(status: string | undefined): string {
	const s = (status ?? "").toLowerCase();
	if (s.includes("routed") || s.includes("assigned")) return "app-badge app-badge--routed";
	if (s.includes("review") || s.includes("triage"))   return "app-badge app-badge--review";
	if (s.includes("urgent"))                            return "app-badge app-badge--urgent";
	return "app-badge app-badge--pending";
}

export function TicketTable({ rows }: { rows: TicketRow[] }) {
	if (rows.length === 0) {
		return (
			<div className="app-card">
				<p className="app-empty">No tickets in the queue right now.</p>
			</div>
		);
	}

	return (
		<div className="app-table-wrap">
			<table className="app-table">
				<thead>
					<tr>
						<th>Ticket</th>
						<th>Confidence</th>
						<th>Routing reason</th>
						<th>Priority</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => {
						const conf =
							typeof row.classificationConfidence === "number"
								? Math.round(row.classificationConfidence * 100)
								: null;
						const confLow = conf !== null && conf < 75;

						return (
							<tr key={row.id}>
								{/* Ticket */}
								<td>
									{row.decisionHref ? (
										<Link
											href={row.decisionHref as Route}
											className="app-table cell-link cell-primary"
										>
											{row.title ?? row.id}
										</Link>
									) : (
										<span className="cell-primary">{row.title ?? row.id}</span>
									)}
									{row.requester && (
										<div className="cell-sub">{row.requester}</div>
									)}
									{row.requestType && (
										<div className="cell-sub">{row.requestType}</div>
									)}
								</td>

								{/* Confidence */}
								<td>
									{conf !== null ? (
										<div className="conf-bar-wrap">
											<div className="conf-bar-bg">
												<div
													className={`conf-bar-fill${confLow ? " conf-bar-fill--low" : ""}`}
													style={{ width: `${conf}%` }}
												/>
											</div>
											<span
												style={{
													fontFamily: "var(--font-jetbrains-mono)",
													fontSize: "0.7rem",
													color: confLow
														? "#fbbf24"
														: "rgba(240,240,240,0.6)",
												}}
											>
												{conf}%
											</span>
										</div>
									) : (
										<span className="cell-sub">—</span>
									)}
									{row.classificationSource === "fallback" && (
										<div className="cell-sub" style={{ color: "#fbbf24" }}>
											fallback
										</div>
									)}
								</td>

								{/* Routing reason */}
								<td>
									<span style={{ color: "rgba(240,240,240,0.65)", fontFamily: "var(--font-dm-sans)", fontSize: "0.8rem" }}>
										{row.reason}
									</span>
								</td>

								{/* Priority */}
								<td>
									<span
										className={`${priorityClass[row.priority ?? "medium"]}`}
										style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}
									>
										{row.priority ?? "medium"}
									</span>
								</td>

								{/* Status */}
								<td>
									<span className={statusBadgeClass(row.status)}>
										{row.status ?? "ready"}
									</span>
									{row.assignedWorkerLabel && (
										<div className="cell-sub" style={{ marginTop: "0.35rem" }}>
											→ {row.assignedWorkerLabel}
										</div>
									)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

export type { TicketRow };
