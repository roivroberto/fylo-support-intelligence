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
const signUpWithEmail = vi.fn();

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
		signUp: {
			email: signUpWithEmail,
		},
	},
}));

describe("SignUpPage", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		getSearchParam.mockReturnValue("/visibility");
		signUpWithEmail.mockResolvedValue({ data: {} });
	});

	it("calls Better Auth sign-up and redirects to the safe next path", async () => {
		const { default: SignUpPage } = await import("./page");
		render(<SignUpPage />);

		fireEvent.change(screen.getByLabelText(/name/i), {
			target: { value: "Pilot User" },
		});
		fireEvent.change(screen.getByLabelText(/email/i), {
			target: { value: "pilot@fylo.local" },
		});
		fireEvent.change(screen.getByLabelText(/password/i), {
			target: { value: "Fylo-E2E-password-123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(signUpWithEmail).toHaveBeenCalledWith({
				name: "Pilot User",
				email: "pilot@fylo.local",
				password: "Fylo-E2E-password-123!",
			});
			expect(push).toHaveBeenCalledWith("/visibility");
		});
	});

	it("ignores unsafe next params and uses default path", async () => {
		getSearchParam.mockReturnValue("//evil.example");

		const { default: SignUpPage } = await import("./page");
		render(<SignUpPage />);

		fireEvent.change(screen.getByLabelText(/name/i), {
			target: { value: "Pilot User" },
		});
		fireEvent.change(screen.getByLabelText(/email/i), {
			target: { value: "pilot@fylo.local" },
		});
		fireEvent.change(screen.getByLabelText(/password/i), {
			target: { value: "Fylo-E2E-password-123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(push).toHaveBeenCalledWith("/visibility");
		});
	});
});
