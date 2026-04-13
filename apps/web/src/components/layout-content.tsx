"use client";

// Each layout segment (landing, auth, app) handles its own chrome.
// This wrapper is intentionally transparent.
export default function LayoutContent({
	children,
}: { children: React.ReactNode }) {
	return <>{children}</>;
}
