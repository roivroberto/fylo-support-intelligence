import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const getSearchParam = vi.fn();
const signInWithEmail = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push,
	}),
	useSearchParams: () => ({
		get: getSearchParam,
	}),
}));

vi.mock("next/link", () => ({
	default: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("../../lib/auth-client", () => ({
	authClient: {
		signIn: {
			email: signInWithEmail,
		},
	},
}));

describe("SignInPage", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		getSearchParam.mockReturnValue("/visibility");
		signInWithEmail.mockResolvedValue({ data: {} });
	});

	it("calls Better Auth sign-in and redirects to the safe next path", async () => {
		const { default: SignInPage } = await import("./page");
		render(<SignInPage />);

		fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
			target: { value: "pilot@fylo.local" },
		});
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "Fylo-E2E-password-123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(signInWithEmail).toHaveBeenCalledWith({
				email: "pilot@fylo.local",
				password: "Fylo-E2E-password-123!",
			});
			expect(push).toHaveBeenCalledWith("/visibility");
		});
	});

	it("ignores unsafe next params and uses default path", async () => {
		getSearchParam.mockReturnValue("https://evil.example");

		const { default: SignInPage } = await import("./page");
		render(<SignInPage />);

		fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
			target: { value: "pilot@fylo.local" },
		});
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "Fylo-E2E-password-123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(push).toHaveBeenCalledWith("/visibility");
		});
	});
});
