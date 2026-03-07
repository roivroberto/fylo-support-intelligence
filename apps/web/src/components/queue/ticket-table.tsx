import type { Route } from "next";
import React from "react";
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

const priorityTone: Record<NonNullable<TicketRow["priority"]>, string> = {
	low: "text-muted-foreground",
	medium: "text-foreground",
	high: "text-destructive",
};

export function TicketTable({ rows }: { rows: TicketRow[] }) {
	return (
		<div className="overflow-x-auto border bg-card text-card-foreground">
			<table className="min-w-[640px] w-full border-collapse text-left text-sm">
				<thead className="bg-muted/40 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						<tr>
							<th className="px-4 py-3 font-medium">Ticket</th>
							<th className="px-4 py-3 font-medium">AI</th>
							<th className="px-4 py-3 font-medium">Routing reason</th>
							<th className="px-4 py-3 font-medium">Priority</th>
							<th className="px-4 py-3 font-medium">Status</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.id} className="border-t align-top">
							<td className="px-4 py-3">
								{row.decisionHref ? (
									<Link href={row.decisionHref as Route} className="font-medium text-foreground underline-offset-4 hover:underline">
										{row.title ?? row.id}
									</Link>
								) : (
									<div className="font-medium text-foreground">
										{row.title ?? row.id}
									</div>
								)}
								{row.requester ? (
									<div className="text-xs text-muted-foreground">
										{row.requester}
									</div>
								) : null}
								{row.requestType ? (
									<div className="text-xs text-muted-foreground">
										{row.requestType}
									</div>
								) : null}
							</td>
							<td className="px-4 py-3 text-sm text-foreground">
								<div>
									{typeof row.classificationConfidence === "number"
										? `${Math.round(row.classificationConfidence * 100)}%`
										: "-"}
								</div>
								<div className="text-xs text-muted-foreground">
									{row.classificationSource ?? "fallback"}
								</div>
							</td>
							<td className="px-4 py-3 text-sm text-foreground">
								{row.reason}
							</td>
							<td className="px-4 py-3">
								<span className={priorityTone[row.priority ?? "medium"]}>
									{row.priority ?? "medium"}
								</span>
							</td>
							<td className="px-4 py-3 text-muted-foreground">
								<div>{row.status ?? "Ready for review"}</div>
								{row.assignedWorkerLabel ? (
									<div className="text-xs">{row.assignedWorkerLabel}</div>
								) : null}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export type { TicketRow };
