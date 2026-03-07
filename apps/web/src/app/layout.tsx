import type { Metadata } from "next";

import "../index.css";
import { DM_Sans, JetBrains_Mono } from "next/font/google";

import LayoutContent from "@/components/layout-content";
import Providers from "@/components/providers";
import { getInitialAuthToken } from "@/lib/auth-server";

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Fylo",
	description: "Workspace and pod management for dynamic teams",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const initialToken = await getInitialAuthToken();

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${jetbrainsMono.variable} ${dmSans.variable} font-sans antialiased`}
			>
				<Providers initialToken={initialToken}>
					<LayoutContent>{children}</LayoutContent>
				</Providers>
			</body>
		</html>
	);
}
