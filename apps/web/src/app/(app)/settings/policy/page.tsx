import { PolicyForm } from "../../../../components/settings/policy-form";

export default function PolicySettingsPage() {
	return (
		<section className="flex flex-col gap-5">
			<div className="grid gap-4 lg:grid-cols-[1fr_280px]">
				<div className="app-card p-5">
					<p className="app-eyebrow app-eyebrow--violet mb-2">Routing policy</p>
					<h1 className="app-h2 mb-2">Tune routing thresholds</h1>
					<p className="app-body">
						Control when tickets are auto-assigned vs. escalated to human review.
						Only leads can save changes.
					</p>
				</div>
				<div className="app-card p-5 flex flex-col gap-3">
					<p className="app-eyebrow">Current baseline</p>
					<ul className="flex flex-col gap-2" style={{ marginTop: "0.25rem" }}>
						{[
							["Live policy", "loads for current workspace"],
							["Lead access", "controls whether edits save"],
							["Single workspace", "policy view is narrow in v1"],
						].map(([label, desc]) => (
							<li key={label} className="app-body" style={{ fontSize: "0.8rem" }}>
								<span style={{ color: "#f0f0f0", fontWeight: 600 }}>{label}</span>{" "}
								{desc}
							</li>
						))}
					</ul>
				</div>
			</div>
			<PolicyForm />
		</section>
	);
}
