"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import "@/app/landing.css";

const NAV_LINKS = [
	{ label: "How it Works", href: "/how-it-works" },
	{ label: "Pricing", href: "/pricing" },
	{ label: "Resources", href: "/resources" },
];

export function PageShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

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
						<Link href="/" className="flex items-center gap-2">
							<Image
								src="/white_fylo.svg"
								alt="Fylo"
								width={0}
								height={0}
								sizes="100vw"
								style={{ width: "auto", height: "28px" }}
								priority
							/>
							<p className="text-white text-2xl font-bold">Fylo</p>
						</Link>
						<nav className="hidden md:flex items-center gap-6">
							{NAV_LINKS.map((item) => (
								<Link
									key={item.href}
								href={item.href as Route}
									className={`nav-link ${pathname === item.href ? "!text-white/80" : ""}`}
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

			{/* ── PAGE CONTENT ── */}
			{children}

			{/* ── FOOTER ── */}
			<footer className="border-t border-white/[0.06] py-8 mt-auto">
				<div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
					<Image src="/white_fylo.svg" alt="Fylo" width={60} height={24} />
					<p className="text-xs text-white/20 font-secondary">
						© 2026 Fylo. Explainable routing for small support teams.
					</p>
					<div className="flex gap-4">
						{["Privacy", "Terms", "Status"].map((l) => (
							<a
								key={l}
								href="#"
								className="text-xs text-white/25 hover:text-white/60 transition-colors font-secondary"
							>
								{l}
							</a>
						))}
					</div>
				</div>
			</footer>
		</div>
	);
}
