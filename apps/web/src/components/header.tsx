"use client";

import Link from "next/link";

import { authClient } from "../lib/auth-client";
import { normalizeSessionUser } from "../lib/current-user";

export default function Header() {
	const { data: session, isPending } = authClient.useSession();
	const user = normalizeSessionUser(session?.user);
	const identity = user.name ?? user.email ?? "Guest";

	return (
		<header>
			<div className="flex flex-row items-center justify-between px-4 py-2">
				<nav className="flex gap-4 text-lg">
					<Link href="/" className="font-semibold">
						Fylo
					</Link>
				</nav>
				<div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
					<span>
						{isPending
							? "Checking session"
							: session
								? user.role
								: "signed out"}
					</span>
					<span className="max-w-40 truncate text-right normal-case tracking-normal text-foreground">
						{identity}
					</span>
					{session ? (
						<button
							className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
							onClick={() => {
								void authClient.signOut();
							}}
							type="button"
						>
							Sign out
						</button>
					) : (
						<>
							<Link
								href="/sign-in"
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								Sign in
							</Link>
							<Link
								href="/sign-up"
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								Sign up
							</Link>
						</>
					)}
				</div>
			</div>
			<hr />
		</header>
	);
}
