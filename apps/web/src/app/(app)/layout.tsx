import type React from "react";

import { AppSidebar } from "../../components/app-sidebar";
import "./app.css";

export default function AppLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="app-shell" suppressHydrationWarning>
			<div className="grain" suppressHydrationWarning />
			<div className="app-layout">
				<AppSidebar />
				<main className="app-main">
					<div className="app-content">{children}</div>
				</main>
			</div>
		</div>
	);
}
