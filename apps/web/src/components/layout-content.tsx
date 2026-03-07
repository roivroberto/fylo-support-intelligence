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
		return <div className="h-svh overflow-hidden">{children}</div>;
	}

	return (
		<div className="grid grid-rows-[auto_1fr] h-svh">
			<Header />
			{children}
		</div>
	);
}
