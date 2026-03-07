import type { Route } from "next";
import Link from "next/link";
import type React from "react";

const sections: Array<{ href: Route; label: string; description: string }> = [
	{
		href: "/queue" as Route,
		label: "Shared queue",
		description: "Triage new work and routing signals.",
	},
	{
		href: "/review" as Route,
		label: "Review",
		description: "Track items waiting on human confirmation.",
	},
	{
		href: "/settings/profile" as Route,
		label: "Profile",
		description: "Upload your resume and tune assignment fit.",
	},
	{
		href: "/settings/policy" as Route,
		label: "Policy",
		description: "Tune routing thresholds and workload guardrails.",
	},
	{
		href: "/visibility" as Route,
		label: "Visibility",
		description: "Spot team workload pressure before handoffs drift.",
	},
];

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<main className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
			<section className="border bg-card text-card-foreground">
				<div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
					<div className="space-y-2">
						<p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
							Operational core pilot
						</p>
						<h1 className="text-2xl font-semibold tracking-tight">
							Shared operations workspace
						</h1>
						<p className="max-w-2xl text-sm text-muted-foreground">
							A lightweight queue and review surface for routing, handoff, and
							decision visibility.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						{sections.map((section) => (
							<Link
								key={section.href}
								href={section.href}
								className="border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								{section.label}
							</Link>
						))}
					</div>
				</div>
				<div className="grid gap-px border-t bg-border sm:grid-cols-2 xl:grid-cols-4">
					{sections.map((section) => (
						<div
							key={section.href}
							className="bg-card px-5 py-3 text-sm text-muted-foreground"
						>
							<span className="font-medium text-foreground">
								{section.label}:
							</span>{" "}
							{section.description}
						</div>
					))}
				</div>
			</section>
			{children}
		</main>
	);
}
