import { AgentProfileForm } from "../../../../components/settings/agent-profile-form";

export default function ProfileSettingsPage() {
	return (
		<section className="flex flex-col gap-5">
			<div className="grid gap-4 lg:grid-cols-[1fr_280px]">
				<div className="app-card p-5">
					<p className="app-eyebrow app-eyebrow--violet mb-2">Agent profile</p>
					<h1 className="app-h2 mb-2">Upload your routing profile</h1>
					<p className="app-body">
						Parsed skills from your resume replace role-based defaults—so tickets
						route to you based on what you actually know.
					</p>
				</div>
				<div className="app-card p-5 flex flex-col gap-3">
					<p className="app-eyebrow">What changes</p>
					<ul className="flex flex-col gap-2" style={{ marginTop: "0.25rem" }}>
						{[
							["Parsed skills", "replace role defaults in assignment"],
							["Fallback routing", "keeps assignments safe when parsing fails"],
						].map(([label, desc]) => (
							<li key={label} className="app-body" style={{ fontSize: "0.8rem" }}>
								<span style={{ color: "#f0f0f0", fontWeight: 600 }}>{label}</span>{" "}
								{desc}
							</li>
						))}
					</ul>
				</div>
			</div>
			<AgentProfileForm />
		</section>
	);
}
