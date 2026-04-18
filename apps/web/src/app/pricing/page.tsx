"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
	ArrowRight,
	CheckCircle2,
	MinusCircle,
	ChevronDown,
	Zap,
	Users,
	ShieldCheck,
	BarChart3,
	FileText,
	Mail,
	Headphones,
	Building2,
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

// ── Plan data ──
const PLANS = [
	{
		id: "starter",
		name: "Starter",
		tagline: "For solo operators and tiny teams.",
		price: { monthly: 0, annual: 0 },
		cta: { label: "Get Started Free", href: "/sign-up" },
		highlighted: false,
		badge: null,
		limits: "Up to 3 agents · 500 tickets/mo",
		features: [
			{ label: "3 agent seats", included: true },
			{ label: "500 tickets / month", included: true },
			{ label: "Email inbox integration", included: true },
			{ label: "Skill-based routing", included: true },
			{ label: "Confidence scoring", included: true },
			{ label: "Basic audit log (7-day)", included: true },
			{ label: "Manager review queue", included: false },
			{ label: "Custom routing rules", included: false },
			{ label: "Workload analytics dashboard", included: false },
			{ label: "Webhook events", included: false },
			{ label: "CSV + API export", included: false },
			{ label: "Priority support", included: false },
		],
	},
	{
		id: "growth",
		name: "Growth",
		tagline: "For support teams shipping daily.",
		price: { monthly: 49, annual: 39 },
		cta: { label: "Start Free Trial", href: "/sign-up" },
		highlighted: true,
		badge: "Most popular",
		limits: "Up to 15 agents · 5,000 tickets/mo",
		features: [
			{ label: "15 agent seats", included: true },
			{ label: "5,000 tickets / month", included: true },
			{ label: "Email inbox integration", included: true },
			{ label: "Skill-based routing", included: true },
			{ label: "Confidence scoring", included: true },
			{ label: "Full audit log (90-day)", included: true },
			{ label: "Manager review queue", included: true },
			{ label: "Custom routing rules", included: true },
			{ label: "Workload analytics dashboard", included: true },
			{ label: "Webhook events", included: true },
			{ label: "CSV + API export", included: false },
			{ label: "Priority support", included: false },
		],
	},
	{
		id: "scale",
		name: "Scale",
		tagline: "For high-volume ops that need SLAs.",
		price: { monthly: 149, annual: 119 },
		cta: { label: "Start Free Trial", href: "/sign-up" },
		highlighted: false,
		badge: null,
		limits: "Unlimited agents · Unlimited tickets",
		features: [
			{ label: "Unlimited agent seats", included: true },
			{ label: "Unlimited tickets", included: true },
			{ label: "Email inbox integration", included: true },
			{ label: "Skill-based routing", included: true },
			{ label: "Confidence scoring", included: true },
			{ label: "Full audit log (1-year)", included: true },
			{ label: "Manager review queue", included: true },
			{ label: "Custom routing rules", included: true },
			{ label: "Workload analytics dashboard", included: true },
			{ label: "Webhook events", included: true },
			{ label: "CSV + API export", included: true },
			{ label: "Priority support", included: true },
		],
	},
];

const FAQ_ITEMS = [
	{
		q: "Is there a free trial for paid plans?",
		a: "Yes — all paid plans include a 14-day free trial, no credit card required. You get the full feature set from day one.",
	},
	{
		q: "What counts as a ticket?",
		a: "Every inbound email that Fylo converts into a routed ticket. Outbound replies, internal notes, and tickets you manually dismiss do not count.",
	},
	{
		q: "Can I change plans mid-month?",
		a: "Absolutely. Upgrades are prorated immediately. Downgrades take effect at the end of your billing cycle.",
	},
	{
		q: "What happens if I hit my ticket limit?",
		a: "We'll notify you at 80% usage. Above the limit, new tickets queue but are not routed until you upgrade or the cycle resets.",
	},
	{
		q: "Do you offer annual discounts?",
		a: "Annual billing saves ~20% on both Growth and Scale. You can switch at any time from your workspace settings.",
	},
	{
		q: "Is there a plan for large enterprises?",
		a: "Yes. Enterprise plans include SSO, custom data retention, dedicated support SLAs, security review, and custom seat pricing. Book a call to discuss.",
	},
];

function FaqItem({ q, a }: { q: string; a: string }) {
	return (
		<details className="group border border-white/[0.07] rounded-md bg-white/[0.02] hover:bg-white/[0.035] transition-colors">
			<summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none">
				<span className="font-mono text-sm text-white/80 font-semibold">{q}</span>
				<ChevronDown size={14} className="text-white/30 shrink-0 transition-transform group-open:rotate-180" />
			</summary>
			<div className="px-5 pb-4">
				<p className="text-sm text-white/45 font-secondary leading-relaxed">{a}</p>
			</div>
		</details>
	);
}

export default function PricingPage() {
	const [annual, setAnnual] = useState(false);

	return (
		<PageShell>
			{/* ── HERO ── */}
			<section className="relative w-full overflow-hidden py-20 pb-12">
				<div className="subpage-hero-glow" />
				<div className="max-w-3xl mx-auto px-6 text-center relative z-10">
					<motion.div
						initial="hidden"
						animate="visible"
						custom={0}
						variants={fadeUp}
						className="badge mb-6 mx-auto w-fit"
					>
						<span className="badge-dot" />
						Simple, transparent pricing
					</motion.div>
					<motion.h1
						initial="hidden"
						animate="visible"
						custom={1}
						variants={fadeUp}
						className="hero-h1"
					>
						Start free.{" "}
						<span className="hero-highlight">Scale when ready.</span>
					</motion.h1>
					<motion.p
						initial="hidden"
						animate="visible"
						custom={2}
						variants={fadeUp}
						className="hero-sub mx-auto text-center mt-4"
					>
						No surprise charges. No per-ticket overages that catch you off-guard.
						Pick the plan that matches your team size.
					</motion.p>

					{/* ── Billing toggle ── */}
					<motion.div
						initial="hidden"
						animate="visible"
						custom={3}
						variants={fadeUp}
						className="flex items-center justify-center gap-3 mt-8"
					>
						<button
							onClick={() => setAnnual(false)}
							className={`text-xs font-mono transition-colors ${!annual ? "text-white/80" : "text-white/30 hover:text-white/50"}`}
						>
							Monthly
						</button>
						<button
							onClick={() => setAnnual((v) => !v)}
							className="relative w-10 h-5 rounded-full bg-white/10 border border-white/15 transition-colors hover:bg-white/15"
							aria-label="Toggle annual billing"
						>
							<span
								className={`absolute top-0.5 w-4 h-4 rounded-full bg-violet-400 transition-all ${annual ? "left-[22px]" : "left-0.5"}`}
							/>
						</button>
						<button
							onClick={() => setAnnual(true)}
							className={`text-xs font-mono transition-colors flex items-center gap-1.5 ${annual ? "text-white/80" : "text-white/30 hover:text-white/50"}`}
						>
							Annual
							<span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-400 border border-emerald-400/25 font-bold">
								Save 20%
							</span>
						</button>
					</motion.div>
				</div>
			</section>

			{/* ── PRICING CARDS ── */}
			<section className="pb-20 max-w-5xl mx-auto px-6 w-full">
				<div className="grid md:grid-cols-3 gap-5 items-start">
					{PLANS.map((plan, i) => (
						<motion.div
							key={plan.id}
							initial="hidden"
							animate="visible"
							custom={i}
							variants={fadeUp}
							className={`relative rounded-lg border flex flex-col transition-all ${
								plan.highlighted
									? "border-violet-400/35 bg-violet-400/[0.04] shadow-[0_0_40px_rgba(167,139,250,0.08)]"
									: "border-white/[0.07] bg-white/[0.02]"
							}`}
						>
							{plan.badge && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2">
									<span className="text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-violet-400 text-[#0a0a0a]">
										{plan.badge}
									</span>
								</div>
							)}

							<div className="p-6 pb-5">
								<p className="text-[10px] font-mono font-bold uppercase tracking-widest text-violet-400/70 mb-1">
									{plan.name}
								</p>
								<p className="text-xs text-white/40 font-secondary mb-4">{plan.tagline}</p>

								<div className="flex items-end gap-1 mb-1">
									<span className="font-mono text-4xl font-extrabold text-white/90 leading-none tracking-tight">
										{plan.price[annual ? "annual" : "monthly"] === 0
											? "Free"
											: `$${plan.price[annual ? "annual" : "monthly"]}`}
									</span>
									{plan.price.monthly > 0 && (
										<span className="text-xs text-white/30 font-secondary mb-1">/mo</span>
									)}
								</div>
								{annual && plan.price.monthly > 0 && (
									<p className="text-[10px] text-white/25 font-secondary">
										Billed annually · Save ${(plan.price.monthly - plan.price.annual) * 12}/yr
									</p>
								)}

								<p className="text-[10px] font-mono text-white/25 mt-2">{plan.limits}</p>

								<Link
									href={plan.cta.href as Route}
									className={`mt-5 w-full flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-all ${
										plan.highlighted
											? "btn-cta"
											: "bg-white/[0.04] text-white/60 border border-white/10 hover:bg-white/[0.07] hover:text-white/80 hover:border-white/20"
									}`}
								>
									{plan.cta.label}
									{plan.highlighted && <ArrowRight size={13} />}
								</Link>
							</div>

							<div className="border-t border-white/[0.05] px-6 py-5 flex-1">
								<p className="text-[9px] font-mono text-white/25 uppercase tracking-widest mb-3">
									What&apos;s included
								</p>
								<ul className="space-y-2.5">
									{plan.features.map((f) => (
										<li key={f.label} className="flex items-center gap-2.5">
											{f.included ? (
												<CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
											) : (
												<MinusCircle size={13} className="text-white/15 shrink-0" />
											)}
											<span
												className={`text-xs font-secondary ${f.included ? "text-white/65" : "text-white/25"}`}
											>
												{f.label}
											</span>
										</li>
									))}
								</ul>
							</div>
						</motion.div>
					))}
				</div>

				{/* Enterprise callout */}
				<AnimatedSection className="mt-5">
					<div className="rounded-lg border border-white/[0.07] bg-white/[0.015] p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
						<div className="flex items-center gap-4">
							<div className="w-10 h-10 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center shrink-0">
								<Building2 size={18} className="text-violet-400" />
							</div>
							<div>
								<p className="font-mono text-sm font-bold text-white/80">Enterprise</p>
								<p className="text-xs text-white/40 font-secondary mt-0.5">
									SSO · Custom SLAs · Dedicated support · Security review · Custom seat pricing
								</p>
							</div>
						</div>
						<a
							href="#"
							className="btn-ghost whitespace-nowrap shrink-0 flex items-center gap-2"
						>
							<Headphones size={13} />
							Book a call
						</a>
					</div>
				</AnimatedSection>
			</section>

			{/* ── FEATURE COMPARE TABLE ── */}
			<section className="border-t border-white/[0.06] py-20 bg-white/[0.01]">
				<div className="max-w-5xl mx-auto px-6">
					<AnimatedSection>
						<div className="section-header mb-12">
							<p className="section-eyebrow">Compare</p>
							<h2 className="section-h2">Full feature breakdown</h2>
						</div>
					</AnimatedSection>
					<AnimatedSection>
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse text-sm">
								<thead>
									<tr className="border-b border-white/[0.07]">
										<th className="py-3 pr-6 font-mono text-[10px] uppercase tracking-widest text-white/30 w-1/2">
											Feature
										</th>
										{PLANS.map((p) => (
											<th
												key={p.id}
												className={`py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-center ${
													p.highlighted ? "text-violet-400" : "text-white/30"
												}`}
											>
												{p.name}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{[
										{ icon: Mail, label: "Email inbox integration" },
										{ icon: Zap, label: "Skill-based routing" },
										{ icon: BarChart3, label: "Confidence scoring" },
										{ icon: FileText, label: "Audit log" },
										{ icon: ShieldCheck, label: "Manager review queue" },
										{ icon: FileText, label: "Custom routing rules" },
										{ icon: BarChart3, label: "Workload analytics" },
										{ icon: Zap, label: "Webhook events" },
										{ icon: FileText, label: "CSV + API export" },
										{ icon: Users, label: "Priority support" },
									].map((row, ri) => (
										<tr
											key={row.label}
											className={`border-b border-white/[0.05] ${ri % 2 === 0 ? "" : "bg-white/[0.01]"}`}
										>
											<td className="py-3 pr-6">
												<div className="flex items-center gap-2">
													<row.icon size={12} className="text-white/25 shrink-0" />
													<span className="text-xs text-white/55 font-secondary">{row.label}</span>
												</div>
											</td>
											{PLANS.map((p) => {
												const feat = p.features.find((f) => f.label.includes(row.label.split(" ")[0]) || f.label === row.label);
												const included = feat?.included ?? false;
												return (
													<td key={p.id} className="py-3 px-4 text-center">
														{included ? (
															<CheckCircle2 size={14} className="text-emerald-400 mx-auto" />
														) : (
															<MinusCircle size={14} className="text-white/15 mx-auto" />
														)}
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</AnimatedSection>
				</div>
			</section>

			{/* ── METRICS ── */}
			<section className="py-16 max-w-5xl mx-auto px-6 w-full">
				<AnimatedSection>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{[
							{ val: "14 days", label: "Free trial, no card" },
							{ val: "< 5 min", label: "Setup time" },
							{ val: "No code", label: "Required" },
							{ val: "Cancel", label: "Anytime" },
						].map((m) => (
							<div key={m.label} className="metric-card">
								<span className="metric-val">{m.val}</span>
								<span className="metric-label">{m.label}</span>
							</div>
						))}
					</div>
				</AnimatedSection>
			</section>

			{/* ── FAQ ── */}
			<section className="py-16 border-t border-white/[0.06] max-w-3xl mx-auto px-6 w-full">
				<AnimatedSection>
					<div className="section-header mb-10">
						<p className="section-eyebrow">FAQ</p>
						<h2 className="section-h2">Pricing questions answered</h2>
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
						<h2 className="cta-h2">No card needed to start</h2>
						<p className="cta-sub">
							Fourteen days on us. Route real tickets. If it sticks, pick a plan.
						</p>
						<div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
							<Link href="/sign-up" className="btn-cta btn-cta-lg group">
								Start Free Trial
								<ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
							</Link>
							<Link href="/how-it-works" className="btn-ghost btn-ghost-lg">
								How it works
							</Link>
						</div>
						<p className="mt-4 text-xs text-white/25 font-secondary">
							No credit card · Cancel anytime · Setup in &lt; 5 minutes
						</p>
					</AnimatedSection>
				</div>
			</section>
		</PageShell>
	);
}
