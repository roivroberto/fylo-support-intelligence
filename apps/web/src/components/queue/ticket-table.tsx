"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { humanizeSnakeCase } from "../../lib/utils";

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
	low: "priority-low",
	medium: "priority-medium",
	high: "priority-high",
};

function statusBadgeClass(status: string | undefined): string {
	const s = (status ?? "").toLowerCase();
	if (s.includes("routed") || s.includes("assigned")) return "app-badge app-badge--routed";
	if (s.includes("review") || s.includes("triage")) return "app-badge app-badge--review";
	if (s.includes("urgent")) return "app-badge app-badge--urgent";
	return "app-badge app-badge--pending";
}

function statusLabel(status: string | undefined): string {
	const s = (status ?? "new").toLowerCase();
	if (s === "assigned") return "Assigned";
	if (s === "reviewed") return "Reviewed";
	if (s === "new") return "New";
	return status ?? "New";
}

function priorityLabel(priority: string | undefined): string {
	const p = (priority ?? "medium").toLowerCase();
	if (p === "high") return "High";
	if (p === "low") return "Low";
	return "Medium";
}

function TicketTableRow({
	row,
	onSelect,
}: {
	row: TicketRow;
	onSelect: (() => void) | undefined;
}) {
	const conf =
		typeof row.classificationConfidence === "number"
			? Math.round(row.classificationConfidence * 100)
			: null;
	const confLow = conf !== null && conf < 75;
	const href = row.decisionHref as Route | undefined;

	return (
		<tr
			onClick={onSelect}
			className={href ? "app-table-row-clickable" : undefined}
			tabIndex={href ? 0 : undefined}
			onKeyDown={
				href
					? (e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							onSelect?.();
						}
					}
					: undefined
			}
		>
			{/* Ticket */}
			<td>
				<span className="cell-primary">{row.title ?? row.id}</span>
				{row.requester && <div className="cell-sub">{row.requester}</div>}
				{row.requestType && <div className="cell-sub">{humanizeSnakeCase(row.requestType)}</div>}
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
						<span className={`conf-pct${confLow ? " conf-pct--low" : ""}`}>
							{conf}%
						</span>
					</div>
				) : (
					<span className="cell-sub">—</span>
				)}
				{row.classificationSource === "fallback" && (
					<div className="cell-sub cell-fallback">Fallback</div>
				)}
			</td>

			{/* Routing reason */}
			<td>
				<span className="cell-reason">{row.reason}</span>
			</td>

			{/* Priority */}
			<td>
				<span className={`priority-tag ${priorityClass[row.priority ?? "medium"]}`}>
					{priorityLabel(row.priority)}
				</span>
			</td>

			{/* Status */}
			<td>
				<div className="cell-status-block">
					<span className={statusBadgeClass(row.status)}>
						{statusLabel(row.status)}
					</span>
					{row.assignedWorkerLabel != null && (
						<span className="cell-sub cell-assignment">
							→ {row.assignedWorkerLabel}
						</span>
					)}
				</div>
			</td>
		</tr>
	);
}

export type TicketTableProps = {
	rows: TicketRow[];
	loading?: boolean;
};

export function TicketTable({ rows, loading = false }: TicketTableProps) {
	const router = useRouter();

	if (loading) {
		return (
			<div className="app-card">
				<p className="app-loading">Loading live queue…</p>
			</div>
		);
	}

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
					{rows.map((row, index) => (
						<TicketTableRow
							key={String(row.id || `row-${index}`)}
							row={row}
							onSelect={
								row.decisionHref
									? () => router.push(row.decisionHref as Route)
									: undefined
							}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}

export type { TicketRow };
