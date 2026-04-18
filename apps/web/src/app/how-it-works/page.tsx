"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
	Inbox,
	Cpu,
	GitBranch,
	Users,
	ShieldCheck,
	CheckCircle2,
	ArrowRight,
	ChevronDown,
	Mail,
	Tag,
	BarChart3,
	AlertTriangle,
	FileText,
	Zap,
	Route,
} from "lucide-react";

import { PageShell } from "@/components/page-shell";

// ── Animation helpers ──
const EASE = "easeOut" as const;

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 28 },
	visible: (i: number = 0) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.55, ease: EASE, delay: i * 0.08 },
	}),
};

function AnimatedSection({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, margin: "-80px" });
	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={inView ? "visible" : "hidden"}
			variants={fadeUp}
			className={className}
		>
			{children}
		</motion.div>
	);
}

// ── Step detail data ──
const STEPS = [
	{
		num: "01",
		icon: Mail,
		color: "violet",
		title: "Emails arrive in your inbox",
		tagline: "One mailbox to rule them all.",
		desc: "Connect your support inbox to Fylo in under two minutes. Every inbound email is captured, deduplicated, and converted into a structured ticket — subject, sender, full body thread, and metadata preserved.",
		callouts: [
			{ icon: Zap, text: "Instant capture — no polling delays" },
			{ icon: FileText, text: "Full thread context preserved" },
			{ icon: ShieldCheck, text: "DKIM/DMARC verified on ingest" },
		],
		visual: (
			<div className="hiw-visual-shell">
				<div className="hiw-email-row">
					<div className="hiw-email-dot bg-violet-400/60" />
					<div className="flex-1 min-w-0">
						<p className="text-[11px] font-mono text-white/60 truncate">noreply@customer.io · Re: invoice #4421</p>
						<p className="text-[10px] text-white/30 truncate">We need a refund for the duplicate charge on our…</p>
					</div>
					<span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded shrink-0">Captured</span>
				</div>
				<div className="hiw-email-row">
					<div className="hiw-email-dot bg-sky-400/60" />
					<div className="flex-1 min-w-0">
						<p className="text-[11px] font-mono text-white/60 truncate">dev@acme.dev · Webhook 500 on batch endpoint</p>
						<p className="text-[10px] text-white/30 truncate">Since yesterday 14:00 UTC we're seeing consistent…</p>
					</div>
					<span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded shrink-0">Captured</span>
				</div>
				<div className="hiw-email-row opacity-60">
					<div className="hiw-email-dot bg-teal-400/60" />
					<div className="flex-1 min-w-0">
						<p className="text-[11px] font-mono text-white/50 truncate">onboard@newco.io · How do I add seats?</p>
						<p className="text-[10px] text-white/20 truncate">Just signed up and trying to invite my team…</p>
					</div>
					<span className="text-[10px] font-mono text-white/20 px-2 py-0.5">Incoming…</span>
				</div>
			</div>
		),
	},
	{
		num: "02",
		icon: Cpu,
		color: "sky",
		title: "AI classifies and extracts context",
		tagline: "Understand before you act.",
		desc: "Each ticket is processed by Fylo's classification layer. It identifies intent, assigns a skill tag (Billing, Technical, Onboarding, etc.), scores urgency, and extracts structured context — all before a human touches it.",
		callouts: [
			{ icon: Tag, text: "Skill tags matched to your team's expertise" },
			{ icon: BarChart3, text: "Urgency scoring prevents SLA slips" },
			{ icon: FileText, text: "Inline confidence score per classification" },
		],
		visual: (
			<div className="hiw-visual-shell">
				<div className="flex items-start gap-3 p-3 rounded bg-white/[0.03] border border-white/[0.07]">
					<div className="w-7 h-7 rounded bg-sky-400/10 border border-sky-400/20 flex items-center justify-center shrink-0">
						<Cpu size={13} className="text-sky-400" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-widest">Classification result</p>
						<div className="space-y-1.5">
							<div className="flex justify-between items-center">
								<span className="text-[10px] text-white/50">Skill</span>
								<span className="text-[10px] font-mono text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded">Billing</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-[10px] text-white/50">Urgency</span>
								<span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">High</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-[10px] text-white/50">Confidence</span>
								<span className="text-[10px] font-mono text-emerald-400">94%</span>
							</div>
							<div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
								<div className="h-full bg-emerald-400 rounded-full w-[94%]" />
							</div>
						</div>
					</div>
				</div>
			</div>
		),
	},
	{
		num: "03",
		icon: GitBranch,
		color: "teal",
		title: "Rules engine picks the right agent",
		tagline: "Skill meets capacity.",
		desc: "Fylo's routing engine intersects skill tags, live agent workload, and availability. It picks the best-fit agent — not just the next one. Every routing decision is recorded with its reasoning so you can audit or override it.",
		callouts: [
			{ icon: Users, text: "Workload-aware: won't pile onto full agents" },
			{ icon: Route, text: "Skill-matching beats round-robin" },
			{ icon: FileText, text: "Full routing rationale stored in audit log" },
		],
		visual: (
			<div className="hiw-visual-shell">
				<div className="space-y-2">
					{[
						{ name: "Priya K.", skill: "Billing", load: 3, max: 5, match: true },
						{ name: "Omar B.", skill: "Technical", load: 5, max: 5, match: false },
						{ name: "Lena M.", skill: "Onboarding", load: 1, max: 5, match: false },
					].map((a) => (
						<div
							key={a.name}
							className={`flex items-center gap-3 px-3 py-2.5 rounded border transition-all ${
								a.match
									? "bg-violet-400/08 border-violet-400/30"
									: "bg-white/[0.02] border-white/[0.06] opacity-50"
							}`}
						>
							<div className="w-6 h-6 rounded-full bg-violet-400/15 border border-violet-400/25 flex items-center justify-center">
								<span className="text-[8px] font-mono font-bold text-violet-400">
									{a.name.split(" ").map((n) => n[0]).join("")}
								</span>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-[10px] font-mono text-white/70">{a.name}</p>
								<div className="flex gap-0.5 mt-1">
									{Array.from({ length: a.max }).map((_, j) => (
										<div key={j} className={`h-0.5 w-3 rounded-sm ${j < a.load ? "bg-violet-400/60" : "bg-white/10"}`} />
									))}
								</div>
							</div>
							{a.match && (
								<span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded shrink-0">
									✓ Assigned
								</span>
							)}
						</div>
					))}
				</div>
			</div>
		),
	},
	{
		num: "04",
		icon: AlertTriangle,
		color: "amber",
		title: "Low-confidence → manager review queue",
		tagline: "Uncertainty surfaces, not disappears.",
		desc: "When Fylo's confidence drops below your threshold, the ticket doesn't silently misroute — it lands in a dedicated review queue visible to team leads. One click to accept, re-assign, or override with a note.",
		callouts: [
			{ icon: ShieldCheck, text: "Configurable confidence threshold per skill" },
			{ icon: Users, text: "Manager queue with one-click routing" },
			{ icon: FileText, text: "Override notes captured for model feedback" },
		],
		visual: (
			<div className="hiw-visual-shell">
				<div className="flex items-start gap-3 p-3 rounded bg-amber-400/[0.04] border border-amber-400/20">
					<AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] font-mono text-amber-400 font-semibold mb-1">Flagged for Review</p>
						<p className="text-[10px] text-white/50 mb-2">Confidence 58% — below threshold of 70%</p>
						<p className="text-[11px] font-mono text-white/60 truncate">T-1049 · Dashboard slow for large orgs</p>
						<div className="flex gap-2 mt-3">
							<button className="text-[10px] px-2 py-1 rounded bg-violet-400/15 border border-violet-400/25 text-violet-400 font-mono">
								Route to Omar
							</button>
							<button className="text-[10px] px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-white/40 font-mono">
								Re-assign
							</button>
						</div>
					</div>
				</div>
			</div>
		),
	},
	{
		num: "05",
		icon: CheckCircle2,
		color: "emerald",
		title: "Resolved with a full audit trail",
		tagline: "Know exactly what happened and why.",
		desc: "When a ticket closes, Fylo captures the full routing journey — classification, assignment rationale, any overrides, and resolution time. Export to CSV, pipe to your data warehouse, or browse in-app.",
		callouts: [
			{ icon: FileText, text: "Per-ticket routing timeline with reasoning" },
			{ icon: BarChart3, text: "Team + pod performance analytics" },
			{ icon: Zap, text: "Webhook events on every state change" },
		],
		visual: (
			<div className="hiw-visual-shell">
				<div className="space-y-1.5">
					{[
						{ time: "09:14:02", event: "Ticket captured", color: "text-white/30" },
						{ time: "09:14:03", event: "Classified → Billing (94%)", color: "text-violet-400" },
						{ time: "09:14:03", event: "Routed → Priya K.", color: "text-teal-400" },
						{ time: "09:36:41", event: "Resolved by Priya K.", color: "text-emerald-400" },
					].map((e) => (
						<div key={e.time} className="flex items-center gap-3">
							<span className="text-[9px] font-mono text-white/20 w-14 shrink-0">{e.time}</span>
							<div className="w-1.5 h-1.5 rounded-full bg-white/15 shrink-0" />
							<span className={`text-[10px] font-mono ${e.color}`}>{e.event}</span>
						</div>
					))}
				</div>
			</div>
		),
	},
];

const FAQ_ITEMS = [
	{
		q: "How long does setup take?",
		a: "Under 5 minutes. Connect your inbox, define your skill tags, and Fylo starts routing. No code, no webhooks to configure manually.",
	},
	{
		q: "Can I adjust the confidence threshold?",
		a: "Yes. Each skill category can have its own threshold. Set Billing to 80% and Technical to 65% based on where your team wants more or less oversight.",
	},
	{
		q: "What happens when my team changes?",
		a: "Agent profiles update in real time. When someone goes offline or their workload caps out, Fylo automatically redistributes to the next best-fit agent.",
	},
	{
		q: "Does Fylo store email content?",
		a: "Only the structured ticket content needed for routing and audit. You control retention policies via your workspace settings.",
	},
	{
		q: "Can I override a routing decision?",
		a: "Always. Overrides are a first-class action — one click, optional note, logged automatically. Your overrides feed back into Fylo's accuracy over time.",
	},
];

const COLOR_MAP: Record<string, { icon: string; line: string; badge: string }> = {
	violet: {
		icon: "bg-violet-400/10 border-violet-400/20 text-violet-400",
		line: "bg-violet-400/20",
		badge: "text-violet-400",
	},
	sky: {
		icon: "bg-sky-400/10 border-sky-400/20 text-sky-400",
		line: "bg-sky-400/20",
		badge: "text-sky-400",
	},
	teal: {
		icon: "bg-teal-400/10 border-teal-400/20 text-teal-400",
		line: "bg-teal-400/20",
		badge: "text-teal-400",
	},
	amber: {
		icon: "bg-amber-400/10 border-amber-400/20 text-amber-400",
		line: "bg-amber-400/20",
		badge: "text-amber-400",
	},
	emerald: {
		icon: "bg-emerald-400/10 border-emerald-400/20 text-emerald-400",
		line: "bg-emerald-400/20",
		badge: "text-emerald-400",
	},
};

function FaqItem({ q, a }: { q: string; a: string }) {
	const ref = useRef<HTMLDetailsElement>(null);
	return (
		<details
			ref={ref}
			className="group border border-white/[0.07] rounded-md bg-white/[0.02] hover:bg-white/[0.035] transition-colors"
		>
			<summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none">
				<span className="font-mono text-sm text-white/80 font-semibold">{q}</span>
				<ChevronDown
					size={14}
					className="text-white/30 shrink-0 transition-transform group-open:rotate-180"
				/>
			</summary>
			<div className="px-5 pb-4">
				<p className="text-sm text-white/45 font-secondary leading-relaxed">{a}</p>
			</div>
		</details>
	);
}

export default function HowItWorksPage() {
	return (
		<PageShell>
			{/* ── HERO ── */}
			<section className="relative w-full overflow-hidden py-20 pb-16">
				<div className="subpage-hero-glow" />
				<div className="max-w-4xl mx-auto px-6 text-center relative z-10">
					<motion.div
						initial="hidden"
						animate="visible"
						custom={0}
						variants={fadeUp}
						className="badge mb-6 mx-auto w-fit"
					>
						<span className="badge-dot" />
						Under the hood
					</motion.div>
					<motion.h1
						initial="hidden"
						animate="visible"
						custom={1}
						variants={fadeUp}
						className="hero-h1"
					>
						How Fylo routes your{" "}
						<span className="hero-highlight">support emails</span>
					</motion.h1>
					<motion.p
						initial="hidden"
						animate="visible"
						custom={2}
						variants={fadeUp}
						className="hero-sub mx-auto text-center mt-4"
					>
						From inbox to resolved ticket — a five-step pipeline that's transparent at every stage.
					</motion.p>
					<motion.div
						initial="hidden"
						animate="visible"
						custom={3}
						variants={fadeUp}
						className="flex flex-wrap justify-center gap-3 mt-8"
					>
						<Link href="/sign-up" className="btn-cta btn-cta-lg group">
							Try it free
							<ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
						</Link>
					</motion.div>
				</div>
			</section>

			{/* ── STEP-BY-STEP ── */}
			<section className="py-16 max-w-5xl mx-auto px-6 w-full">
				<div className="space-y-20">
					{STEPS.map((step, i) => {
						const colors = COLOR_MAP[step.color];
						const isEven = i % 2 === 0;
						return (
							<motion.div
								key={step.num}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, margin: "-60px" }}
								custom={0}
								variants={fadeUp}
								className={`grid md:grid-cols-2 gap-10 items-center ${!isEven ? "md:[&>*:first-child]:order-2" : ""}`}
							>
								{/* Text side */}
								<div>
									<div className="flex items-center gap-3 mb-4">
										<div
											className={`w-9 h-9 rounded-md border flex items-center justify-center ${colors.icon}`}
										>
											<step.icon size={17} />
										</div>
										<span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${colors.badge}`}>
											Step {step.num}
										</span>
									</div>
									<h2 className="font-mono text-2xl font-extrabold text-white/90 leading-tight mb-1 tracking-tight">
										{step.title}
									</h2>
									<p className={`text-sm font-mono mb-4 ${colors.badge}`}>{step.tagline}</p>
									<p className="text-sm text-white/50 font-secondary leading-relaxed mb-6">
										{step.desc}
									</p>
									<ul className="space-y-2.5">
										{step.callouts.map((c) => (
											<li key={c.text} className="flex items-start gap-2.5">
												<div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${colors.icon}`}>
													<c.icon size={11} />
												</div>
												<span className="text-xs text-white/55 font-secondary">{c.text}</span>
											</li>
										))}
									</ul>
								</div>

								{/* Visual side */}
								<div>{step.visual}</div>
							</motion.div>
						);
					})}
				</div>
			</section>

			{/* ── INTEGRATIONS STRIP ── */}
			<section className="border-t border-white/[0.06] py-16 bg-white/[0.01]">
				<div className="max-w-5xl mx-auto px-6">
					<AnimatedSection>
						<div className="section-header mb-10">
							<p className="section-eyebrow">Integrations</p>
							<h2 className="section-h2">Plugs into your existing stack</h2>
							<p className="section-sub">No ripping out tools. Fylo sits quietly in the middle.</p>
						</div>
					</AnimatedSection>
					<AnimatedSection>
						<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
							{[
								{ name: "Gmail / Google Workspace", tag: "Email" },
								{ name: "Outlook / M365", tag: "Email" },
								{ name: "Slack", tag: "Notifications" },
								{ name: "Zapier", tag: "Automation" },
								{ name: "Webhooks", tag: "Custom" },
								{ name: "CSV Export", tag: "Data" },
								{ name: "REST API", tag: "Developers" },
								{ name: "More coming", tag: "Soon" },
							].map((item) => (
								<div key={item.name} className="feature-card flex flex-col gap-1.5">
									<span className="text-[9px] font-mono text-violet-400/60 uppercase tracking-widest">
										{item.tag}
									</span>
									<span className="text-sm font-mono text-white/70 font-semibold">{item.name}</span>
								</div>
							))}
						</div>
					</AnimatedSection>
				</div>
			</section>

			{/* ── FAQ ── */}
			<section className="py-20 max-w-3xl mx-auto px-6 w-full">
				<AnimatedSection>
					<div className="section-header mb-10">
						<p className="section-eyebrow">FAQ</p>
						<h2 className="section-h2">Common questions</h2>
					</div>
				</AnimatedSection>
				<AnimatedSection>
					<div className="space-y-2">
						{FAQ_ITEMS.map((item) => (
							<FaqItem key={item.q} q={item.q} a={item.a} />
						))}
					</div>
				</AnimatedSection>
			</section>

			{/* ── CLOSING CTA ── */}
			<section className="py-24 border-t border-white/[0.06]">
				<div className="max-w-3xl mx-auto px-6 text-center">
					<AnimatedSection>
						<h2 className="cta-h2">Ready to see it in action?</h2>
						<p className="cta-sub">
							Connect your inbox and watch Fylo route your first ten tickets — free, no card required.
						</p>
						<div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
							<Link href="/sign-up" className="btn-cta btn-cta-lg group">
								Start Free Trial
								<ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
							</Link>
							<Link href="/pricing" className="btn-ghost btn-ghost-lg">
								View Pricing
							</Link>
						</div>
					</AnimatedSection>
				</div>
			</section>
		</PageShell>
	);
}
