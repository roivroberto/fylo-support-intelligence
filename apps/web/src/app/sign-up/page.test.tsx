import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSearchParam = vi.fn();
const signUpWithEmail = vi.fn();
const joinWithPodCode = vi.fn();
const ensureOnboardingWorkspace = vi.fn();
const assign = vi.fn();
const persistPendingWorkspaceAction = vi.fn();
const { useMutation } = vi.hoisted(() => ({
	useMutation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useSearchParams: () => ({
		get: getSearchParam,
	}),
}));

vi.mock("next/link", () => ({
	default: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("convex/react", () => ({
	useMutation,
}));

vi.mock("@Fylo/backend/convex/workspaces_reference", () => ({
	ensureOnboardingWorkspaceReference: {
		name: "ensureOnboardingWorkspaceReference",
	},
}));

vi.mock("@Fylo/backend/convex/memberships_reference", () => ({
	joinWithPodCodeReference: {
		name: "joinWithPodCodeReference",
	},
}));

vi.mock("../../lib/auth-client", () => ({
	authClient: {
		signUp: {
			email: signUpWithEmail,
		},
	},
	getAuthErrorMessage: (response: { error?: { message?: string | null } | null }, fallbackMessage: string) =>
		response?.error?.message ?? fallbackMessage,
}));

vi.mock("../../lib/workspace-access-state", () => ({
	persistPendingWorkspaceAction,
}));

describe("SignUpPage", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		Object.defineProperty(window, "location", {
			configurable: true,
			value: {
				...window.location,
				assign,
			},
		});
		getSearchParam.mockReturnValue("/visibility");
		signUpWithEmail.mockResolvedValue({ data: {} });
		joinWithPodCode.mockResolvedValue({ isMember: true });
		ensureOnboardingWorkspace.mockResolvedValue({ isMember: true });
		useMutation.mockImplementation((reference: { name: string }) => {
			if (reference.name === "joinWithPodCodeReference") {
				return joinWithPodCode;
			}

			if (reference.name === "ensureOnboardingWorkspaceReference") {
				return ensureOnboardingWorkspace;
			}

			return vi.fn();
		});
	});

	it("stores a create-workspace action after sign-up without a pod code and redirects home", async () => {
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
			expect(persistPendingWorkspaceAction).toHaveBeenCalledWith({
				ownerSessionKey: "pilot@fylo.local",
				type: "create",
				redirectTo: "/",
			});
			expect(ensureOnboardingWorkspace).not.toHaveBeenCalled();
			expect(joinWithPodCode).not.toHaveBeenCalled();
			expect(assign).toHaveBeenCalledWith("/");
		});
	});

	it("stores a join action after sign-up with a pod code and redirects home", async () => {
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
		fireEvent.change(screen.getByLabelText(/pod code/i), {
			target: { value: "  POD-ADMIN01  " },
		});
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(persistPendingWorkspaceAction).toHaveBeenCalledWith({
				ownerSessionKey: "pilot@fylo.local",
				type: "join",
				podCode: "POD-ADMIN01",
				redirectTo: "/visibility",
			});
			expect(joinWithPodCode).not.toHaveBeenCalled();
			expect(ensureOnboardingWorkspace).not.toHaveBeenCalled();
			expect(assign).toHaveBeenCalledWith("/");
		});
	});

	it("ignores unsafe next params and stores the default safe redirect for pod-code sign-up", async () => {
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
		fireEvent.change(screen.getByLabelText(/pod code/i), {
			target: { value: "POD-ADMIN01" },
		});
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(persistPendingWorkspaceAction).toHaveBeenCalledWith({
				ownerSessionKey: "pilot@fylo.local",
				type: "join",
				podCode: "POD-ADMIN01",
				redirectTo: "/visibility",
			});
			expect(assign).toHaveBeenCalledWith("/");
		});
	});

	it("does not run workspace mutations directly from the sign-up page", async () => {
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
		fireEvent.change(screen.getByLabelText(/pod code/i), {
			target: { value: "POD-ADMIN01" },
		});
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(joinWithPodCode).not.toHaveBeenCalled();
			expect(ensureOnboardingWorkspace).not.toHaveBeenCalled();
		});
	});

	it("shows Better Auth errors without calling workspace mutations", async () => {
		signUpWithEmail.mockResolvedValue({
			error: { message: "Unable to create account" },
		});

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
			expect(screen.getByText("Unable to create account")).toBeInTheDocument();
			expect(joinWithPodCode).not.toHaveBeenCalled();
			expect(ensureOnboardingWorkspace).not.toHaveBeenCalled();
		});
	});

	it("redirects home even when a pending join action will be needed later", async () => {
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
		fireEvent.change(screen.getByLabelText(/pod code/i), {
			target: { value: "POD-ADMIN01" },
		});
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(assign).toHaveBeenCalledWith("/");
			expect(signUpWithEmail).toHaveBeenCalledTimes(1);
		});
	});
});
