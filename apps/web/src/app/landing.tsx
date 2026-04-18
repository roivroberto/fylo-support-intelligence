"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route as NextRoute } from "next";
import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
	ArrowRight,
	Zap,
	Eye,
	Users,
	GitBranch,
	ShieldCheck,
	BarChart3,
	Inbox,
	Route,
	CheckCircle2,
	Star,
	ChevronRight,
	Loader2,
} from "lucide-react";
import "./landing.css";

// --- Animation helpers ---
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

// --- Dashboard Mockup (looping conveyor animation) ---

type Ticket = {
	id: string;
	subject: string;
	assignee: string | null;
	skill: "Billing" | "Technical" | "Onboarding";
	confidence: number;
	review: boolean;
};

const TICKET_POOL: Ticket[] = [
	{ id: "T-1042", subject: "Cannot export CSV report",       assignee: "Priya K.", skill: "Billing",    confidence: 94, review: false },
	{ id: "T-1043", subject: "API timeout on batch endpoint",  assignee: "Omar B.",  skill: "Technical",  confidence: 88, review: false },
	{ id: "T-1044", subject: "Refund request – order #8821",   assignee: null,       skill: "Billing",    confidence: 61, review: true  },
	{ id: "T-1045", subject: "How do I add a team member?",    assignee: "Lena M.",  skill: "Onboarding", confidence: 97, review: false },
	{ id: "T-1046", subject: "Webhook not firing on prod",     assignee: "Omar B.",  skill: "Technical",  confidence: 83, review: false },
	{ id: "T-1047", subject: "Seat limit – billing threshold", assignee: "Priya K.", skill: "Billing",    confidence: 91, review: false },
	{ id: "T-1048", subject: "SSO setup guide needed",         assignee: "Lena M.",  skill: "Onboarding", confidence: 76, review: false },
	{ id: "T-1049", subject: "Dashboard slow for large orgs",  assignee: null,       skill: "Technical",  confidence: 58, review: true  },
];

const SKILL_COLORS: Record<string, string> = {
	Billing:    "text-violet-400 bg-violet-400/10",
	Technical:  "text-sky-400 bg-sky-400/10",
	Onboarding: "text-teal-400 bg-teal-400/10",
};

// Timings (ms)
const IDLE_DURATION    = 2200; // how long the queue rests between transitions
const ROUTING_DURATION = 1500; // how long "Routing…" badge is shown before exit

function TicketRow({ ticket, isRouting }: { ticket: Ticket; isRouting: boolean }) {
	return (
		<>
			<div className="flex items-start justify-between gap-3">
				{/* Left: id + skill + subject */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<span className="font-mono text-[10px] text-white/30">{ticket.id}</span>
						<span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${SKILL_COLORS[ticket.skill]}`}>
							{ticket.skill}
						</span>
					</div>
					<p className="text-xs text-white/80 truncate">{ticket.subject}</p>
				</div>

				{/* Right: status badge + assignee */}
				<div className="flex flex-col items-end gap-1 shrink-0">
					<AnimatePresence mode="wait" initial={false}>
						{isRouting ? (
							<motion.span
								key="routing"
								initial={{ opacity: 0, scale: 0.88 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.88 }}
								transition={{ duration: 0.18, ease: "easeInOut" }}
								className="ticket-badge-routing"
							>
								<Loader2 size={9} className="animate-spin" />
								Routing…
							</motion.span>
						) : (
							<motion.span
								key="status"
								initial={{ opacity: 0, scale: 0.88 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.88 }}
								transition={{ duration: 0.18, ease: "easeInOut" }}
								className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
									ticket.review
										? "text-amber-400 bg-amber-400/10 border-amber-400/20"
										: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
								}`}
							>
								{ticket.review ? "⚠ Review" : "✓ Routed"}
							</motion.span>
						)}
					</AnimatePresence>

					{ticket.assignee ? (
						<span className="text-[10px] text-white/40">→ {ticket.assignee}</span>
					) : (
						<span className="text-[10px] text-amber-400/60">Awaiting review</span>
					)}
				</div>
			</div>

			{/* Confidence bar */}
			<div className="mt-2 flex items-center gap-2">
				<span className="text-[10px] text-white/30 font-mono w-16">Confidence</span>
				<div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
					<motion.div
						initial={{ width: 0 }}
						animate={{ width: `${ticket.confidence}%` }}
						transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
						className={`h-full rounded-full ${ticket.confidence >= 75 ? "bg-emerald-400" : "bg-amber-400"}`}
					/>
				</div>
				<span className="text-[10px] font-mono text-white/40">{ticket.confidence}%</span>
			</div>
		</>
	);
}

// Each slot in the visible queue gets a unique, never-reused instance key.
// This prevents Framer Motion's layout engine from interpolating a
// re-entering ticket from its previous DOM position.
type QueueEntry = { ticket: Ticket; ikey: number };

function DashboardMockup() {
	const [queue, setQueue] = useState<QueueEntry[]>(() =>
		TICKET_POOL.slice(0, 4).map((ticket, i) => ({ ticket, ikey: i })),
	);
	const [routingIkey, setRoutingIkey] = useState<number | null>(null);
	const nextPoolIdx = useRef(4); // next index into TICKET_POOL
	const nextIkey    = useRef(4); // next unique instance key to assign
	const queueRef    = useRef(queue);
	useEffect(() => { queueRef.current = queue; }, [queue]);

	useEffect(() => {
		let t1: ReturnType<typeof setTimeout>;
		let t2: ReturnType<typeof setTimeout>;

		const cycle = () => {
			// Step 1 – light up "Routing…" on current top entry
			const top = queueRef.current[0];
			if (!top) return;
			setRoutingIkey(top.ikey);

			// Step 2 – after routing badge has shown, swap the queue
			t2 = setTimeout(() => {
				setRoutingIkey(null);
				setQueue((prev) => {
					const nextTicket = TICKET_POOL[nextPoolIdx.current % TICKET_POOL.length];
					const newEntry: QueueEntry = { ticket: nextTicket, ikey: nextIkey.current };
					nextPoolIdx.current += 1;
					nextIkey.current    += 1;
					return [...prev.slice(1), newEntry];
				});

				// Step 3 – idle pause, then repeat
				t1 = setTimeout(cycle, IDLE_DURATION);
			}, ROUTING_DURATION);
		};

		// First cycle fires after a brief initial pause
		t1 = setTimeout(cycle, 1400);
		return () => { clearTimeout(t1); clearTimeout(t2); };
	}, []);

	return (
		<div className="mockup-shell w-full max-w-xl">
			{/* Title bar */}
			<div className="mockup-titlebar">
				<div className="flex gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
					<span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
					<span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
				</div>
				<span className="text-xs text-white/30 font-mono">fylo — ticket queue</span>
				<div />
			</div>

			{/* Body */}
			<div className="mockup-body">
				{/* Queue header */}
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<Inbox size={13} className="text-white/40" />
						<span className="text-xs font-mono text-white/50 uppercase tracking-widest">
							Incoming Queue
						</span>
					</div>
					<AnimatePresence mode="wait" initial={false}>
						{routingIkey !== null ? (
							<motion.span
								key="processing"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
								className="text-xs text-violet-400/70 font-mono"
							>
								Processing…
							</motion.span>
						) : (
							<motion.span
								key="count"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
								className="text-xs text-white/30"
							>
								4 tickets
							</motion.span>
						)}
					</AnimatePresence>
				</div>

				{/* ── The looping ticket list ── */}
				<div className="flex flex-col gap-2 overflow-hidden">
					<AnimatePresence mode="popLayout" initial={false}>
						{queue.map((entry) => (
							<motion.div
								key={entry.ikey}
								layout
								initial={{ opacity: 0, y: 18 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, x: 72, transition: { duration: 0.36, ease: "easeInOut" } }}
								transition={{ duration: 0.38, ease: "easeInOut" }}
								className="ticket-row"
							>
								<TicketRow ticket={entry.ticket} isRouting={routingIkey === entry.ikey} />
							</motion.div>
						))}
					</AnimatePresence>
				</div>

				{/* Pod summary */}
				<div className="mt-4 pt-3 border-t border-white/5">
					<div className="flex items-center gap-2 mb-2">
						<Users size={11} className="text-white/30" />
						<span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
							Pod Workload
						</span>
					</div>
					<div className="grid grid-cols-3 gap-2">
						{[
							{ name: "Priya K.", load: 3, max: 5 },
							{ name: "Omar B.", load: 5, max: 5 },
							{ name: "Lena M.", load: 1, max: 5 },
						].map((agent) => (
							<div key={agent.name} className="agent-pod">
								<div className="text-[10px] text-white/50 mb-1 truncate">{agent.name}</div>
								<div className="flex gap-0.5">
									{Array.from({ length: agent.max }).map((_, j) => (
										<div
											key={j}
											className={`h-1 flex-1 rounded-sm ${j < agent.load ? "bg-violet-400/70" : "bg-white/10"}`}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

// --- Routing Flow Diagram ---
function RoutingDiagram() {
	const steps = [
		{ icon: Inbox, label: "Inbox", sub: "Email arrives" },
		{ icon: GitBranch, label: "Rules Engine", sub: "Skills + workload" },
		{ icon: Users, label: "Agent Pod", sub: "Right person" },
		{ icon: CheckCircle2, label: "Resolved", sub: "With audit trail" },
	];
	return (
		<div className="flex items-center justify-center gap-0 flex-wrap">
			{steps.map((s, i) => (
				<div key={s.label} className="flex items-center">
					<div className="flow-step">
						<div className="flow-step-icon">
							<s.icon size={16} className="text-violet-400" />
						</div>
						<span className="text-xs font-mono text-white/70 font-semibold">
							{s.label}
						</span>
						<span className="text-[10px] text-white/30">{s.sub}</span>
					</div>
					{i < steps.length - 1 && (
						<ChevronRight
							size={14}
							className="text-white/20 mx-1 shrink-0"
						/>
					)}
				</div>
			))}
		</div>
	);
}

// --- Main Component ---
export default function LandingPage() {
	const features = [
		{
			icon: GitBranch,
			title: "Explainable Routing",
			desc: "See exactly why each ticket was assigned—skill, load, and expertise.",
			color: "violet",
		},
		{
			icon: ShieldCheck,
			title: "Human Review States",
			desc: "Uncertain cases go to a manager, not the void.",
			color: "amber",
		},
		{
			icon: BarChart3,
			title: "Workload Visibility",
			desc: "Every agent's queue, live. Spot overload before it happens.",
			color: "sky",
		},
		{
			icon: Zap,
			title: "Instant Triage",
			desc: "Emails become routed tickets in under a second.",
			color: "emerald",
		},
		{
			icon: Eye,
			title: "Full Audit Trail",
			desc: "Every routing decision logged with reasoning.",
			color: "teal",
		},
		{
			icon: Route,
			title: "Skill-Based Matching",
			desc: "Expertise tags beat round-robin. Fewer re-routes.",
			color: "rose",
		},
	];

	const steps = [
		{
			num: "01",
			icon: Inbox,
			title: "Capture",
			desc: "Emails auto-convert into structured tickets.",
		},
		{
			num: "02",
			icon: Route,
			title: "Route",
			desc: "Skill tags and live workload pick the right agent.",
		},
		{
			num: "03",
			icon: Eye,
			title: "Review",
			desc: "Low-confidence cases surface for manager review. No code.",
		},
	];

	const testimonials = [
		{
			quote: "40% faster triage in week one. And we can see exactly why every ticket landed where it did.",
			name: "Sarah L.",
			role: "Head of Support, Growthly",
			initials: "SL",
		},
		{
			quote: "We stopped losing tickets the moment we turned on Fylo.",
			name: "Marcus T.",
			role: "Support Lead, Stackify",
			initials: "MT",
		},
	];

	const logos = [
		"Growthly",
		"Stackify",
		"Novu",
		"Buildbase",
		"Launchpad",
		"Relo",
	];

	const colorMap: Record<string, string> = {
		violet: "text-violet-400 bg-violet-400/10 border-violet-400/20",
		amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
		sky: "text-sky-400 bg-sky-400/10 border-sky-400/20",
		emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
		teal: "text-teal-400 bg-teal-400/10 border-teal-400/20",
		rose: "text-rose-400 bg-rose-400/10 border-rose-400/20",
	};

	return (
		<div
			className="landing-page min-h-screen flex flex-col overflow-x-hidden"
			suppressHydrationWarning
		>
			<div className="grain" suppressHydrationWarning />

			{/* ── NAV ── */}
			<header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-md">
				<div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
					<div className="flex items-center gap-8">
            <Image
                src="/white_fylo.svg"
                alt="Fylo"
                width={0}
                height={0}
                sizes="100vw"
                style={{ width: 'auto', height: '28px' }} // Change 20px to your desired height
                priority
              /> <p className="text-white text-2xl font-bold">Fylo</p>
						<nav className="hidden md:flex items-center gap-6">
							{(
								[
									{ label: "How it Works", href: "/how-it-works" },
									{ label: "Pricing", href: "/pricing" },
									{ label: "Resources", href: "/resources" },
								] as { label: string; href: string }[]
							).map((item) => (
								<Link
									key={item.href}
								href={item.href as NextRoute}
									className="nav-link"
								>
									{item.label}
								</Link>
							))}
						</nav>
					</div>
					<div className="flex items-center gap-3">
						<Link href="/sign-in" className="nav-link hidden sm:block">
							Login
						</Link>
						<Link href="/sign-up" className="btn-cta">
							Get Started
						</Link>
					</div>
				</div>
			</header>

			{/* ── HERO ── */}
			<section className="relative w-full overflow-hidden hero-bg">
				{/* Radial glow */}
				<div className="hero-glow" />
				<div className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
					{/* Left: copy */}
					<div>
						<motion.div
							initial="hidden"
							animate="visible"
							custom={0}
							variants={fadeUp}
							className="badge mb-6"
						>
							<span className="badge-dot" />
							Explainable routing for small support teams
						</motion.div>

						<motion.h1
							initial="hidden"
							animate="visible"
							custom={1}
							variants={fadeUp}
							className="hero-h1"
						>
							Route every support email to the{" "}
							<span className="hero-highlight">right teammate</span> in seconds.
						</motion.h1>

						<motion.p
							initial="hidden"
							animate="visible"
							custom={2}
							variants={fadeUp}
							className="hero-sub"
						>
							Emails in, right person assigned. Routes by skill and load—flags anything uncertain for review.
						</motion.p>

						<motion.div
							initial="hidden"
							animate="visible"
							custom={3}
							variants={fadeUp}
							className="flex flex-wrap gap-3 mt-8"
						>
							<Link href="/sign-up" className="btn-cta btn-cta-lg group">
								Start Free Trial
								<ArrowRight
									size={16}
									className="ml-2 group-hover:translate-x-1 transition-transform"
								/>
							</Link>
							<a href="#how-it-works" className="btn-ghost btn-ghost-lg">
								See How It Works
							</a>
						</motion.div>

						<motion.p
							initial="hidden"
							animate="visible"
							custom={4}
							variants={fadeUp}
							className="mt-4 text-xs text-white/30 font-secondary"
						>
							No credit card required · Takes 2 minutes to set up
						</motion.p>
					</div>

					{/* Right: dashboard mockup */}
					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
						className="flex justify-center lg:justify-end"
					>
						<DashboardMockup />
					</motion.div>
				</div>
			</section>

			{/* ── SOCIAL PROOF: LOGOS ── */}
			<section className="border-y border-white/[0.06] py-10 bg-white/[0.01] overflow-hidden">
				<p className="text-center text-xs font-mono text-white/25 uppercase tracking-widest mb-8">
					Trusted by fast-moving support teams
				</p>
				{/* Marquee: two identical tracks side-by-side scrolling left */}
				<div className="marquee-outer">
					<div className="marquee-track">
						<div className="marquee-content">
							{logos.map((logo) => (
								<span key={logo} className="logo-pill">{logo}</span>
							))}
						</div>
						<div className="marquee-content" aria-hidden="true">
							{logos.map((logo) => (
								<span key={`${logo}-dup`} className="logo-pill">{logo}</span>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ── METRICS ── */}
			<section className="py-16 max-w-5xl mx-auto px-6 w-full">
				<AnimatedSection>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{[
							{ val: "10K+", label: "Tickets routed daily" },
							{ val: "< 1s", label: "Avg. routing time" },
							{ val: "40%", label: "Triage time saved" },
							{ val: "97%", label: "Routing accuracy" },
						].map((m) => (
							<div key={m.label} className="metric-card">
								<span className="metric-val">{m.val}</span>
								<span className="metric-label">{m.label}</span>
							</div>
						))}
					</div>
				</AnimatedSection>
			</section>

			{/* ── FEATURES ── */}
			<section id="features" className="py-20 border-t border-white/[0.06]">
				<div className="max-w-5xl mx-auto px-6">
					<AnimatedSection>
						<div className="section-header">
							<p className="section-eyebrow">Features</p>
							<h2 className="section-h2">
								Built for teams that can't afford misroutes
							</h2>
							<p className="section-sub">
								Clear logic. Visible workloads. Zero guesswork.
							</p>
						</div>
					</AnimatedSection>

					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
						{features.map((f, i) => (
							<motion.div
								key={f.title}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, margin: "-60px" }}
								custom={i}
								variants={fadeUp}
								className="feature-card group"
							>
								<div
									className={`feature-icon-wrap border ${colorMap[f.color]}`}
								>
									<f.icon size={18} />
								</div>
								<h3 className="feature-title">{f.title}</h3>
								<p className="feature-desc">{f.desc}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ── HOW IT WORKS ── */}
			<section
				id="how-it-works"
				className="py-20 border-t border-white/[0.06] bg-white/[0.01]"
			>
				<div className="max-w-5xl mx-auto px-6">
					<AnimatedSection>
						<div className="section-header">
							<p className="section-eyebrow">How it works</p>
							<h2 className="section-h2">Three steps. No setup drama.</h2>
						</div>
					</AnimatedSection>

					{/* Flow diagram */}
					<AnimatedSection className="mt-10 mb-14">
						<div className="flow-diagram-wrap">
							<RoutingDiagram />
						</div>
					</AnimatedSection>

					{/* Steps */}
					<div className="grid md:grid-cols-3 gap-6">
						{steps.map((s, i) => (
							<motion.div
								key={s.num}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, margin: "-60px" }}
								custom={i}
								variants={fadeUp}
								className="step-card"
							>
								<div className="step-num">{s.num}</div>
								<div className="flex items-center gap-3 mb-3">
									<div className="step-icon-wrap">
										<s.icon size={16} className="text-violet-400" />
									</div>
									<h3 className="step-title">{s.title}</h3>
								</div>
								<p className="step-desc">{s.desc}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ── TESTIMONIALS ── */}
			<section className="py-20 border-t border-white/[0.06]">
				<div className="max-w-5xl mx-auto px-6">
					<AnimatedSection>
						<div className="section-header">
							<p className="section-eyebrow">Social proof</p>
							<h2 className="section-h2">What teams are saying</h2>
						</div>
					</AnimatedSection>

					<div className="grid md:grid-cols-2 gap-6 mt-12">
						{testimonials.map((t, i) => (
							<motion.div
								key={t.name}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, margin: "-60px" }}
								custom={i}
								variants={fadeUp}
								className="testimonial-card"
							>
								<div className="flex gap-0.5 mb-4">
									{Array.from({ length: 5 }).map((_, j) => (
										<Star
											key={j}
											size={12}
											className="text-amber-400 fill-amber-400"
										/>
									))}
								</div>
								<blockquote className="testimonial-quote">
									&ldquo;{t.quote}&rdquo;
								</blockquote>
								<div className="flex items-center gap-3 mt-5">
									<div className="testimonial-avatar">{t.initials}</div>
									<div>
										<p className="testimonial-name">{t.name}</p>
										<p className="testimonial-role">{t.role}</p>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ── CLOSING CTA ── */}
			<section className="py-24 border-t border-white/[0.06]">
				<div className="max-w-3xl mx-auto px-6 text-center">
					<AnimatedSection>
						<div className="badge mb-6 mx-auto w-fit">
							<span className="badge-dot" />
							Get started today
						</div>
						<h2 className="cta-h2">Less chaos. More signal.</h2>
						<p className="cta-sub">
							Triage faster, route smarter, see why every ticket landed where it did.
						</p>
						<div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
							<Link href="/sign-up" className="btn-cta btn-cta-lg group">
								Start Free Trial
								<ArrowRight
									size={16}
									className="ml-2 group-hover:translate-x-1 transition-transform"
								/>
							</Link>
							<a href="#" className="btn-ghost btn-ghost-lg">
								Book a Demo
							</a>
						</div>
						<p className="mt-4 text-xs text-white/25 font-secondary">
							No credit card required · Cancel anytime
						</p>
					</AnimatedSection>
				</div>
			</section>

			{/* ── FOOTER ── */}
			<footer className="border-t border-white/[0.06] py-8">
				<div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
					<Image src="/white_fylo.svg" alt="Fylo" width={60} height={24} />
					<p className="text-xs text-white/20 font-secondary">
						© 2026 Fylo. Explainable routing for small support teams.
					</p>
					<div className="flex gap-4">
						{["Privacy", "Terms", "Status"].map((l) => (
							<a key={l} href="#" className="text-xs text-white/25 hover:text-white/60 transition-colors font-secondary">
								{l}
							</a>
						))}
					</div>
				</div>
			</footer>
		</div>
	);
}
