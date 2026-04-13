"use client";

import { getCurrentWorkspaceReference } from "@Fylo/backend/convex/workspaces_reference";
import { useQuery } from "convex/react";
import { BarChart3, Inbox, LogOut, Settings2, ShieldAlert, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { authClient } from "../lib/auth-client";
import { normalizeSessionUser } from "../lib/current-user";

type NavItem = {
	href: string;
	label: string;
	icon: React.ElementType;
};

const LEAD_NAV: NavItem[] = [
	{ href: "/queue",            label: "Queue",      icon: Inbox       },
	{ href: "/review",           label: "Review",     icon: ShieldAlert },
	{ href: "/visibility",       label: "Team management", icon: BarChart3 },
	{ href: "/settings/policy",  label: "Policy",     icon: Settings2   },
];

const AGENT_NAV: NavItem[] = [
	{ href: "/queue",            label: "Queue",   icon: Inbox },
	{ href: "/settings/profile", label: "Profile", icon: User  },
];

export function AppSidebar() {
	const { data: session, isPending } = authClient.useSession();
	const user = normalizeSessionUser(session?.user);
	const workspaceState = useQuery(getCurrentWorkspaceReference, session ? {} : "skip");
	const pathname = usePathname();
	const router = useRouter();

	// Use workspace membership role (source of truth), not session.user.role
	const role = workspaceState?.workspace?.role ?? user.role;
	const isLead = role === "lead";
	const navItems = isLead ? LEAD_NAV : AGENT_NAV;
	const roleBadgeClass = isLead ? "role-badge role-badge--lead" : "role-badge role-badge--agent";
	const identity = user.name ?? user.email ?? "—";

	return (
		<aside className="app-sidebar">
			{/* Brand — when logged in, logo is not a link so we stay in app */}
			<div className="app-sidebar-brand">
				{session ? (
					<Image
						src="/white_fylo.svg"
						alt="Fylo"
						width={0}
						height={0}
						sizes="100vw"
						style={{ width: "auto", height: "20px" }}
						priority
					/>
				) : (
					<Link href="/">
						<Image
							src="/white_fylo.svg"
							alt="Fylo"
							width={0}
							height={0}
							sizes="100vw"
							style={{ width: "auto", height: "20px" }}
							priority
						/>
					</Link>
				)}
			</div>

			{/* Nav */}
			<nav className="app-sidebar-nav" aria-label="Main navigation">
				{session && (
					<>
						<span className="app-sidebar-section">
							{isLead ? "Lead" : "Agent"}
						</span>
						{navItems.map((item) => {
							const isActive =
								pathname === item.href ||
								(item.href !== "/queue" && pathname.startsWith(item.href));
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`app-sidebar-link${isActive ? " active" : ""}`}
								>
									<item.icon size={13} strokeWidth={isActive ? 2.2 : 1.8} />
									{item.label}
								</Link>
							);
						})}
					</>
				)}

				{!session && !isPending && (
					<>
						<Link href="/sign-in" className="app-sidebar-link">Sign in</Link>
						<Link href="/sign-up" className="app-sidebar-link">Sign up</Link>
					</>
				)}
			</nav>

			{/* Footer: user info + sign out */}
			{session && (
				<div className="app-sidebar-footer">
					<div className="app-sidebar-user">
						<div className="app-sidebar-identity">
							<div className="flex items-center gap-1.5">
								<span className={roleBadgeClass}>{role === "lead" ? "Lead" : role === "agent" ? "Agent" : "User"}</span>
							</div>
							<span className="app-sidebar-name">{identity}</span>
						</div>
					</div>
					<button
						type="button"
						className="app-sidebar-signout"
						onClick={() => {
							router.replace("/");
							void authClient.signOut();
						}}
					>
						<LogOut size={11} />
						Sign out
					</button>
				</div>
			)}
		</aside>
	);
}
