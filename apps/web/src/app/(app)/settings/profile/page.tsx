import { AgentProfileForm } from "../../../../components/settings/agent-profile-form";

export default function ProfileSettingsPage() {
	return (
		<section className="grid gap-4">
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
				<div className="border bg-card p-5 text-card-foreground">
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						Agent profile
					</p>
					<h2 className="mt-2 text-xl font-semibold tracking-tight">
						Turn resumes into routing context
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
						This profile keeps assignment grounded in the work you are actually equipped
						to handle.
					</p>
				</div>
				<div className="border bg-card p-5 text-sm text-muted-foreground">
					<p className="text-[11px] uppercase tracking-[0.2em]">What changes</p>
					<div className="mt-3 space-y-2">
						<p>
							<span className="font-medium text-foreground">Parsed skills</span> replace
							the role defaults used in assignment
						</p>
						<p>
							<span className="font-medium text-foreground">Fallback routing</span>
							keeps assignments safe when parsing is unavailable
						</p>
					</div>
				</div>
			</div>
			<AgentProfileForm />
		</section>
	);
}
