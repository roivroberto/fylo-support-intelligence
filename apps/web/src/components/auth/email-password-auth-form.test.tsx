import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmailPasswordAuthForm } from "./email-password-auth-form";

describe("EmailPasswordAuthForm", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("submits email and password in sign-in mode", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);

		render(
			<EmailPasswordAuthForm
				mode="sign-in"
				submitLabel="Sign in"
				onSubmit={onSubmit}
			/>,
		);

		fireEvent.change(screen.getByLabelText(/email/i), {
			target: { value: "pilot@fylo.local" },
		});
		fireEvent.change(screen.getByLabelText(/password/i), {
			target: { value: "Fylo-E2E-password-123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith({
				email: "pilot@fylo.local",
				password: "Fylo-E2E-password-123!",
			});
		});
	});

	it("includes name in sign-up mode", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);

		render(
			<EmailPasswordAuthForm
				mode="sign-up"
				submitLabel="Create account"
				onSubmit={onSubmit}
			/>,
		);

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
			expect(onSubmit).toHaveBeenCalledWith({
				name: "Pilot User",
				email: "pilot@fylo.local",
				password: "Fylo-E2E-password-123!",
			});
		});
	});

	it("shows an error when submit fails", async () => {
		const onSubmit = vi.fn().mockRejectedValue(new Error("Invalid credentials"));

		render(
			<EmailPasswordAuthForm
				mode="sign-in"
				submitLabel="Sign in"
				onSubmit={onSubmit}
			/>,
		);

		fireEvent.change(screen.getByLabelText(/email/i), {
			target: { value: "pilot@fylo.local" },
		});
		fireEvent.change(screen.getByLabelText(/password/i), {
			target: { value: "bad-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

		await screen.findByText("Invalid credentials");
	});
});
