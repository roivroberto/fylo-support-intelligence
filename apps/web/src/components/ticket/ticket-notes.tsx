type TicketNote = {
	id: string;
	body: string;
	authorLabel: string;
	createdAtLabel: string;
};

export function TicketNotes({ notes }: { notes: TicketNote[] }) {
	return (
		<div className="app-card p-5 flex flex-col gap-4">
			<p className="app-eyebrow">Notes</p>

			{notes.length === 0 ? (
				<p className="app-empty" style={{ padding: "0.75rem 0" }}>
					No notes yet.
				</p>
			) : (
				<div className="flex flex-col gap-3">
					{notes.map((note) => (
						<article
							key={note.id}
							style={{
								background: "rgba(255,255,255,0.02)",
								border: "1px solid rgba(255,255,255,0.06)",
								borderRadius: "4px",
								padding: "0.85rem 1rem",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									gap: "0.5rem",
									marginBottom: "0.6rem",
								}}
							>
								<span className="app-field-label">{note.authorLabel}</span>
								<span className="app-field-label">{note.createdAtLabel}</span>
							</div>
							<p className="app-body" style={{ fontSize: "0.8125rem", color: "rgba(240,240,240,0.8)" }}>
								{note.body}
							</p>
						</article>
					))}
				</div>
			)}
		</div>
	);
}

export type { TicketNote };
