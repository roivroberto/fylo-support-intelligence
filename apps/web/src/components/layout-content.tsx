"use client";

import { usePathname } from "next/navigation";

import Header from "./header";

export default function LayoutContent({
	children,
}: { children: React.ReactNode }) {
	const pathname = usePathname();
	const isLanding = pathname === "/";
	const isAuth = pathname === "/sign-in" || pathname === "/sign-up";

	if (isLanding) {
		return <>{children}</>;
	}

	if (isAuth) {
		return <>{children}</>;
	}

	return (
		<div className="grid grid-rows-[auto_1fr] h-svh">
			<Header />
			{children}
		</div>
	);
}
