import { cleanup, render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useSession, signOut } = vi.hoisted(() => ({
	useSession: vi.fn(),
	signOut: vi.fn(),
}));

vi.mock("next/link", () => ({
	default: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("../lib/auth-client", () => ({
	authClient: {
		useSession,
		signOut,
	},
}));

import Header from "./header";

describe("Header", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("shows sign-in and sign-up links when signed out", () => {
		useSession.mockReturnValue({
			data: null,
			isPending: false,
		});

		render(<Header />);

		expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
			"href",
			"/sign-in",
		);
		expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
			"href",
			"/sign-up",
		);
		expect(
			screen.queryByRole("button", { name: "Sign out" }),
		).not.toBeInTheDocument();
	});

	it("shows sign-out when authenticated", () => {
		useSession.mockReturnValue({
			data: {
				user: {
					email: "lead@fylo.local",
					name: "Lead",
					role: "lead",
				},
			},
			isPending: false,
		});

		render(<Header />);

		expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
	});
});
