type WorkloadCard = {
	id: string;
	name: string;
	role: string;
	activeTickets: number;
	reviewQueue: number;
	status: "clear" | "watch" | "busy";
	note: string;
};

const STATUS_MAX_PIPS = 6;

function statusBadgeClass(status: WorkloadCard["status"]): string {
	if (status === "busy")  return "app-badge app-badge--busy";
	if (status === "watch") return "app-badge app-badge--watch";
	return "app-badge app-badge--routed";
}

function statusDotClass(status: WorkloadCard["status"]): string {
	if (status === "busy")  return "status-dot status-dot--busy";
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
	if (cards.length === 0) {
		return (
			<div className="app-card">
				<p className="app-empty">No team members in this workspace yet.</p>
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{cards.map((card) => (
				<article key={card.id} className="app-card p-5 flex flex-col gap-4">
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
				</article>
			))}
		</div>
	);
}

export type { WorkloadCard };
