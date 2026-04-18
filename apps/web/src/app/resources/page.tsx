"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
	ArrowRight,
	BookOpen,
	FileText,
	Play,
	Github,
	MessageSquare,
	ChevronRight,
	Zap,
	GitBranch,
	BarChart3,
	Users,
	Route,
	ShieldCheck,
	Bell,
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

// ── Quick-link hubs ──
const HUBS = [
	{
		icon: BookOpen,
		color: "violet",
		title: "Documentation",
		desc: "Full reference for every Fylo feature — routing rules, agent profiles, webhooks, and more.",
		link: { label: "Browse docs →", href: "#" },
	},
	{
		icon: Play,
		color: "sky",
		title: "Video Guides",
		desc: "Short, focused screencasts. Get up and running in minutes, not hours.",
		link: { label: "Watch videos →", href: "#" },
	},
	{
		icon: Github,
		color: "teal",
		title: "API Reference",
		desc: "REST API and webhook schema. Pipe tickets anywhere in your stack.",
		link: { label: "View API docs →", href: "#" },
	},
	{
		icon: MessageSquare,
		color: "emerald",
		title: "Community",
		desc: "Ask questions, share routing setups, and trade war stories with other support teams.",
		link: { label: "Join community →", href: "#" },
	},
];

// ── Featured guides ──
const GUIDES = [
	{
		tag: "Getting Started",
		tagColor: "text-violet-400 bg-violet-400/10",
		title: "Connect your inbox and route your first 10 tickets",
		desc: "A hands-on walkthrough of Fylo setup — from OAuth to watching your first ticket auto-route in real time.",
		readTime: "5 min read",
		icon: Zap,
	},
	{
		tag: "Routing Rules",
		tagColor: "text-sky-400 bg-sky-400/10",
		title: "Building a skill matrix that actually matches your team",
		desc: "How to design skill tags that reflect your agents' real strengths, and how Fylo uses them to outperform round-robin.",
		readTime: "8 min read",
		icon: GitBranch,
	},
	{
		tag: "Analytics",
		tagColor: "text-teal-400 bg-teal-400/10",
		title: "Reading the Workload Dashboard without misreading it",
		desc: "What each metric means, which ones to watch, and the three signals that reliably predict a queue pile-up.",
		readTime: "6 min read",
		icon: BarChart3,
	},
	{
		tag: "Team Management",
		tagColor: "text-emerald-400 bg-emerald-400/10",
		title: "Managing capacity across pods: the Fylo way",
		desc: "Structuring agent pods, setting workload caps, and using the review queue as a safety net instead of a bottleneck.",
		readTime: "7 min read",
		icon: Users,
	},
	{
		tag: "Advanced",
		tagColor: "text-amber-400 bg-amber-400/10",
		title: "Custom routing rules: conditionals and overrides",
		desc: "Writing conditional routing logic for edge cases — VIP senders, language routing, and channel-specific escalations.",
		readTime: "10 min read",
		icon: Route,
	},
	{
		tag: "Security",
		tagColor: "text-rose-400 bg-rose-400/10",
		title: "Audit logs and compliance for regulated industries",
		desc: "How Fylo's audit trail works, what it captures, and how to export it for SOC 2 and GDPR evidence requests.",
		readTime: "9 min read",
		icon: ShieldCheck,
	},
];

// ── Changelog entries ──
const CHANGELOG = [
	{
		date: "Mar 10, 2026",
		version: "v1.4.0",
		tag: "Feature",
		tagColor: "text-violet-400 bg-violet-400/10",
		title: "Custom confidence thresholds per skill",
		desc: "Set different review triggers for each skill category. Billing can be strict; Onboarding can be looser.",
	},
	{
		date: "Feb 28, 2026",
		version: "v1.3.2",
		tag: "Improvement",
		tagColor: "text-sky-400 bg-sky-400/10",
		title: "Workload analytics now includes trend lines",
		desc: "Daily and weekly rolling averages on pod load charts so you can spot drift before it becomes a pile-up.",
	},
	{
		date: "Feb 14, 2026",
		version: "v1.3.0",
		tag: "Feature",
		tagColor: "text-violet-400 bg-violet-400/10",
		title: "Webhook events on every ticket state change",
		desc: "Subscribe to captured, classified, routed, reviewed, and resolved events. Pipe to Slack, PagerDuty, or your own data warehouse.",
	},
	{
		date: "Jan 30, 2026",
		version: "v1.2.5",
		tag: "Fix",
		tagColor: "text-emerald-400 bg-emerald-400/10",
		title: "Routing latency reduced by 40%",
		desc: "Classification pipeline refactored to batch concurrent tickets. P95 routing time down from 1.8 s to 1.1 s.",
	},
	{
		date: "Jan 15, 2026",
		version: "v1.2.0",
		tag: "Feature",
		tagColor: "text-violet-400 bg-violet-400/10",
		title: "Manager review queue launched",
		desc: "Low-confidence tickets now surface in a dedicated queue for team leads — with one-click routing and override notes.",
	},
];

const COLOR_CLASSES: Record<string, string> = {
	violet: "bg-violet-400/10 border-violet-400/20 text-violet-400",
	sky: "bg-sky-400/10 border-sky-400/20 text-sky-400",
	teal: "bg-teal-400/10 border-teal-400/20 text-teal-400",
	emerald: "bg-emerald-400/10 border-emerald-400/20 text-emerald-400",
};

export default function ResourcesPage() {
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
						Guides, docs &amp; changelog
					</motion.div>
					<motion.h1
						initial="hidden"
						animate="visible"
						custom={1}
						variants={fadeUp}
						className="hero-h1"
					>
						Everything you need to{" "}
						<span className="hero-highlight">get the most from Fylo</span>
					</motion.h1>
					<motion.p
						initial="hidden"
						animate="visible"
						custom={2}
						variants={fadeUp}
						className="hero-sub mx-auto text-center mt-4"
					>
						Documentation, hands-on guides, videos, and the latest product updates — all in one place.
					</motion.p>
				</div>
			</section>

			{/* ── RESOURCE HUBS ── */}
			<section className="pb-20 max-w-5xl mx-auto px-6 w-full">
				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{HUBS.map((hub, i) => (
						<motion.a
							key={hub.title}
							href={hub.link.href}
							initial="hidden"
							animate="visible"
							custom={i}
							variants={fadeUp}
							className="feature-card group flex flex-col gap-3 cursor-pointer"
						>
							<div className={`feature-icon-wrap border ${COLOR_CLASSES[hub.color]}`}>
								<hub.icon size={18} />
							</div>
							<div>
								<h3 className="feature-title">{hub.title}</h3>
								<p className="feature-desc">{hub.desc}</p>
							</div>
							<span className={`text-[11px] font-mono mt-auto flex items-center gap-1 ${COLOR_CLASSES[hub.color].split(" ")[0]}`}>
								{hub.link.label}
							</span>
						</motion.a>
					))}
				</div>
			</section>

			{/* ── FEATURED GUIDES ── */}
			<section className="border-t border-white/[0.06] py-20 bg-white/[0.01]">
				<div className="max-w-5xl mx-auto px-6">
					<AnimatedSection>
						<div className="section-header mb-12">
							<p className="section-eyebrow">Guides</p>
							<h2 className="section-h2">Learn by doing</h2>
							<p className="section-sub">
								Practical walkthroughs written by the team that built Fylo.
							</p>
						</div>
					</AnimatedSection>

					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{GUIDES.map((guide, i) => (
							<motion.a
								key={guide.title}
								href="#"
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, margin: "-60px" }}
								custom={i}
								variants={fadeUp}
								className="feature-card group flex flex-col gap-3 cursor-pointer"
							>
								<div className="flex items-center justify-between">
									<span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${guide.tagColor}`}>
										{guide.tag}
									</span>
									<span className="text-[9px] font-mono text-white/25">{guide.readTime}</span>
								</div>
								<div className="feature-icon-wrap border bg-violet-400/10 border-violet-400/20 text-violet-400">
									<guide.icon size={16} />
								</div>
								<div>
									<h3 className="feature-title leading-snug">{guide.title}</h3>
									<p className="feature-desc mt-1">{guide.desc}</p>
								</div>
								<div className="mt-auto flex items-center gap-1 text-[11px] font-mono text-violet-400/70 group-hover:text-violet-400 transition-colors">
									Read guide
									<ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
								</div>
							</motion.a>
						))}
					</div>

					<AnimatedSection className="mt-6 text-center">
						<a href="#" className="btn-ghost inline-flex items-center gap-2">
							<BookOpen size={13} />
							Browse all guides
						</a>
					</AnimatedSection>
				</div>
			</section>

			{/* ── VIDEO SECTION ── */}
			<section className="py-20 max-w-5xl mx-auto px-6 w-full">
				<AnimatedSection>
					<div className="section-header mb-12">
						<p className="section-eyebrow">Videos</p>
						<h2 className="section-h2">Watch, then ship</h2>
						<p className="section-sub">Short screencasts — under 10 minutes each.</p>
					</div>
				</AnimatedSection>
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{[
						{ title: "Getting started in 5 minutes", duration: "4:52", tag: "Setup" },
						{ title: "Configuring your first skill matrix", duration: "7:14", tag: "Routing" },
						{ title: "Using the manager review queue", duration: "5:30", tag: "Workflow" },
						{ title: "Reading the analytics dashboard", duration: "6:22", tag: "Analytics" },
						{ title: "Setting up webhooks with Zapier", duration: "8:07", tag: "Integrations" },
						{ title: "Exporting audit logs for compliance", duration: "4:18", tag: "Security" },
					].map((v, i) => (
						<motion.div
							key={v.title}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, margin: "-60px" }}
							custom={i}
							variants={fadeUp}
							className="group relative rounded-lg border border-white/[0.07] bg-white/[0.02] overflow-hidden cursor-pointer hover:border-white/[0.14] hover:bg-white/[0.04] transition-all"
						>
							{/* Thumbnail placeholder */}
							<div className="aspect-video bg-white/[0.03] flex items-center justify-center relative">
								<div className="absolute inset-0 bg-gradient-to-br from-violet-400/5 to-transparent" />
								<div className="w-10 h-10 rounded-full bg-violet-400/20 border border-violet-400/30 flex items-center justify-center group-hover:scale-110 transition-transform">
									<Play size={16} className="text-violet-400 ml-0.5" fill="currentColor" />
								</div>
								<span className="absolute bottom-2 right-2 text-[9px] font-mono text-white/30 bg-black/40 px-1.5 py-0.5 rounded">
									{v.duration}
								</span>
							</div>
							<div className="p-4">
								<span className="text-[9px] font-mono text-violet-400/60 uppercase tracking-widest">
									{v.tag}
								</span>
								<p className="text-xs font-mono font-semibold text-white/75 mt-1 leading-snug">{v.title}</p>
							</div>
						</motion.div>
					))}
				</div>
			</section>

			{/* ── CHANGELOG ── */}
			<section className="border-t border-white/[0.06] py-20 bg-white/[0.01]">
				<div className="max-w-3xl mx-auto px-6">
					<AnimatedSection>
						<div className="section-header mb-12">
							<p className="section-eyebrow">Changelog</p>
							<h2 className="section-h2">What&apos;s new in Fylo</h2>
							<p className="section-sub">
								Shipped updates, improvements, and fixes — newest first.
							</p>
						</div>
					</AnimatedSection>

					<div className="relative">
						{/* Timeline line */}
						<div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.05]" />

						<div className="space-y-8">
							{CHANGELOG.map((entry, i) => (
								<motion.div
									key={entry.version}
									initial="hidden"
									whileInView="visible"
									viewport={{ once: true, margin: "-60px" }}
									custom={i}
									variants={fadeUp}
									className="relative pl-8"
								>
									{/* Dot */}
									<div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border border-violet-400/30 bg-violet-400/15 flex items-center justify-center">
										<div className="w-1 h-1 rounded-full bg-violet-400/60" />
									</div>

									<div className="flex items-center gap-2 mb-2">
										<span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${entry.tagColor}`}>
											{entry.tag}
										</span>
										<span className="text-[9px] font-mono text-white/25">{entry.version}</span>
										<span className="text-[9px] font-mono text-white/20 ml-auto">{entry.date}</span>
									</div>
									<h3 className="font-mono text-sm font-bold text-white/80 mb-1">{entry.title}</h3>
									<p className="text-xs text-white/40 font-secondary leading-relaxed">{entry.desc}</p>
								</motion.div>
							))}
						</div>
					</div>

					<AnimatedSection className="mt-10 text-center">
						<a href="#" className="btn-ghost inline-flex items-center gap-2">
							<Bell size={12} />
							Subscribe to updates
						</a>
					</AnimatedSection>
				</div>
			</section>

			{/* ── COMMUNITY CALLOUT ── */}
			<section className="py-16 max-w-5xl mx-auto px-6 w-full">
				<AnimatedSection>
					<div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-8 text-center">
						<div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4">
							<MessageSquare size={20} className="text-emerald-400" />
						</div>
						<h3 className="font-mono text-xl font-extrabold text-white/85 mb-2 tracking-tight">
							Join the Fylo community
						</h3>
						<p className="text-sm text-white/40 font-secondary max-w-sm mx-auto mb-6">
							Ask questions, share your routing setups, and connect with support leads at teams like yours.
						</p>
						<a href="#" className="btn-ghost inline-flex items-center gap-2">
							<Github size={13} />
							Join on Discord
						</a>
					</div>
				</AnimatedSection>
			</section>

			{/* ── CLOSING CTA ── */}
			<section className="py-24 border-t border-white/[0.06]">
				<div className="max-w-3xl mx-auto px-6 text-center">
					<AnimatedSection>
						<h2 className="cta-h2">Still have questions?</h2>
						<p className="cta-sub">
							Our team responds in hours, not days. Or just start a free trial and see for yourself.
						</p>
						<div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
							<Link href="/sign-up" className="btn-cta btn-cta-lg group">
								Start Free Trial
								<ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
							</Link>
							<a href="mailto:hello@fylo.io" className="btn-ghost btn-ghost-lg">
								Email us
							</a>
						</div>
					</AnimatedSection>
				</div>
			</section>
		</PageShell>
	);
}
