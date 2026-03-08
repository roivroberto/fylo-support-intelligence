type WorkloadCard = {
	id: string;
	name: string;
	role: string;
	activeTickets: number;
	reviewQueue: number;
	status: "clear" | "watch" | "busy";
	note: string;
	profile?: {
		primarySkills: string[];
		secondarySkills: string[];
		languages: string[];
		summary?: string;
	} | null;
};

import { useState } from "react";
import { humanizeSnakeCase } from "../../lib/utils";

const STATUS_MAX_PIPS = 6;

function statusBadgeClass(status: WorkloadCard["status"]): string {
	if (status === "busy") return "app-badge app-badge--busy";
	if (status === "watch") return "app-badge app-badge--watch";
	return "app-badge app-badge--routed";
}

function statusDotClass(status: WorkloadCard["status"]): string {
	if (status === "busy") return "status-dot status-dot--busy";
	if (status === "watch") return "status-dot status-dot--watch";
	return "status-dot status-dot--clear";
}

function pipClass(index: number, status: WorkloadCard["status"], active: number): string {
	if (index >= active) return "pip pip--empty";
	if (status === "busy") return "pip pip--full";
	return "pip pip--on";
}

function statusLabel(status: WorkloadCard["status"]): string {
	if (status === "busy") return "Busy";
	if (status === "watch") return "Watching";
	return "Available";
}

function roleLabel(role: string): string {
	const r = role.toLowerCase();
	if (r === "lead") return "Lead";
	if (r === "agent") return "Agent";
	return role;
}

export function WorkloadCards({ cards }: { cards: WorkloadCard[] }) {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	if (cards.length === 0) {
		return (
			<div className="app-card">
				<p className="app-empty">No team members in this workspace yet.</p>
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{cards.map((card) => {
				const isExpanded = expandedId === card.id;

				return (
					<article
						key={card.id}
						className="app-card p-5 flex flex-col gap-4 cursor-pointer hover:bg-white/5 transition-colors"
						onClick={() => setExpandedId(isExpanded ? null : card.id)}
					>
						{/* Header */}
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="app-eyebrow mb-1">{roleLabel(card.role)}</p>
								<h2 className="app-h3">{card.name}</h2>
							</div>
							<div className="flex items-center gap-2">
								<span className={statusDotClass(card.status)} />
								<span className={statusBadgeClass(card.status)}>
									{statusLabel(card.status)}
								</span>
							</div>
						</div>

						{/* Load pip bar */}
						<div>
							<p className="app-field-label mb-2">Active load</p>
							<div className="pip-bar">
								{Array.from({ length: STATUS_MAX_PIPS }).map((_, i) => (
									<div
										key={i}
										className={pipClass(i, card.status, card.activeTickets)}
									/>
								))}
							</div>
						</div>

						{/* Stats */}
						<div
							className="grid grid-cols-2 gap-3 pt-3"
							style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
						>
							<div>
								<p className="app-field-label mb-1">Active</p>
								<p
									style={{
										fontFamily: "var(--font-jetbrains-mono)",
										fontSize: "1.375rem",
										fontWeight: 800,
										letterSpacing: "-0.04em",
										color: card.status === "busy" ? "#f87171" : "#f0f0f0",
									}}
								>
									{card.activeTickets}
								</p>
							</div>
							<div>
								<p className="app-field-label mb-1">In review</p>
								<p
									style={{
										fontFamily: "var(--font-jetbrains-mono)",
										fontSize: "1.375rem",
										fontWeight: 800,
										letterSpacing: "-0.04em",
										color: card.reviewQueue > 0 ? "#fbbf24" : "rgba(240,240,240,0.4)",
									}}
								>
									{card.reviewQueue}
								</p>
							</div>
						</div>

						{/* Note */}
						<p className="app-body" style={{ fontSize: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
							{card.note}
						</p>

						{/* Expanded Profile Info */}
						{isExpanded && card.profile && (
							<div className="flex flex-col gap-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
								<div>
									<p className="app-field-label mb-1">Summary</p>
									<p className="app-body" style={{ fontSize: "0.85rem", color: "#f0f0f0" }}>
										{card.profile.summary || "No summary available."}
									</p>
								</div>
								<div>
									<p className="app-field-label mb-1">Primary Skills</p>
									<div className="flex flex-wrap gap-1 mt-1">
										{card.profile.primarySkills.map((skill) => (
											<span key={skill} className="app-badge app-badge--routed" style={{ padding: "2px 6px", fontSize: "0.7rem", textTransform: "none" }}>{humanizeSnakeCase(skill)}</span>
										))}
									</div>
								</div>
								<div>
									<p className="app-field-label mb-1">Secondary Skills</p>
									<div className="flex flex-wrap gap-1 mt-1">
										{card.profile.secondarySkills.map((skill) => (
											<span key={skill} className="app-badge" style={{ padding: "2px 6px", fontSize: "0.7rem", textTransform: "none" }}>{humanizeSnakeCase(skill)}</span>
										))}
									</div>
								</div>
								<div>
									<p className="app-field-label mb-1">Languages</p>
									<div className="flex flex-wrap gap-1 mt-1">
										{card.profile.languages.map((lang) => (
											<span key={lang} className="app-badge" style={{ padding: "2px 6px", fontSize: "0.7rem", textTransform: "uppercase" }}>{lang}</span>
										))}
									</div>
								</div>
							</div>
						)}
						{isExpanded && !card.profile && (
							<div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
								<p className="app-body" style={{ fontSize: "0.85rem", color: "rgba(240,240,240,0.5)" }}>
									No agent profile available (resume not parsed).
								</p>
							</div>
						)}
					</article>
				);
			})}
		</div>
	);
}

export type { WorkloadCard };
