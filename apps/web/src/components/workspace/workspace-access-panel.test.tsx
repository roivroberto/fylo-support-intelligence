import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useMutation, useQuery } = vi.hoisted(() => ({
	useMutation: vi.fn(),
	useQuery: vi.fn(),
}));

const { useSession } = vi.hoisted(() => ({
	useSession: vi.fn(),
}));

const joinWithPodCode = vi.fn();
const ensureOnboardingWorkspace = vi.fn();
const persistWorkspaceAccessState = vi.fn();
const clearPersistedWorkspaceAccessState = vi.fn();
const readPersistedWorkspaceAccessState = vi.fn();
const clearPendingWorkspaceAction = vi.fn();
const readPendingWorkspaceAction = vi.fn();

vi.mock("next/link", () => ({
	default: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("convex/react", () => ({
	useMutation,
	useQuery,
}));

vi.mock("../../lib/auth-client", () => ({
	authClient: {
		useSession,
	},
}));

vi.mock("../../lib/workspace-access-state", () => ({
	persistWorkspaceAccessState,
	clearPersistedWorkspaceAccessState,
	readPersistedWorkspaceAccessState,
	clearPendingWorkspaceAction,
	readPendingWorkspaceAction,
}));

vi.mock("@Fylo/backend/convex/workspaces_reference", () => ({
	getCurrentWorkspaceReference: { name: "getCurrentWorkspaceReference" },
	ensureOnboardingWorkspaceReference: { name: "ensureOnboardingWorkspaceReference" },
}));

vi.mock("@Fylo/backend/convex/memberships_reference", () => ({
	joinWithPodCodeReference: { name: "joinWithPodCodeReference" },
}));

describe("WorkspaceAccessPanel", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		useSession.mockReturnValue({
			data: {
				user: {
					email: "pilot@fylo.local",
					name: "Pilot User",
					role: "agent",
				},
			},
			isPending: false,
		});
		readPersistedWorkspaceAccessState.mockReturnValue(null);
		readPendingWorkspaceAction.mockReturnValue(null);
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

	it("shows sign-up and sign-in links when signed out", async () => {
		useSession.mockReturnValue({
			data: null,
			isPending: false,
		});

		const { WorkspaceAccessPanel } = await import("./workspace-access-panel");
		render(<WorkspaceAccessPanel />);

		expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
			"href",
			"/sign-up",
		);
		expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
			"href",
			"/sign-in",
		);
		expect(useQuery).toHaveBeenCalledWith(
			expect.objectContaining({ name: "getCurrentWorkspaceReference" }),
			"skip",
		);
	});

	it("shows workspace details for members", async () => {
		useQuery.mockReturnValue({
			isMember: true,
			canCreateWorkspace: false,
			workspace: {
				workspaceId: "ws_1",
				name: "Ops Workspace",
				podCode: "pod-admin01",
				role: "lead",
			},
		});

		const { WorkspaceAccessPanel } = await import("./workspace-access-panel");
		render(<WorkspaceAccessPanel />);

		expect(screen.getByText("Ops Workspace")).toBeInTheDocument();
		expect(screen.getByText("lead")).toBeInTheDocument();
		expect(screen.getByText("pod-admin01")).toBeInTheDocument();
	});

	it("creates an onboarding workspace for eligible non-members", async () => {
		useQuery.mockReturnValue({
			isMember: false,
			canCreateWorkspace: true,
			workspace: null,
		});
		ensureOnboardingWorkspace.mockResolvedValue({
			isMember: true,
			canCreateWorkspace: false,
			workspace: {
				workspaceId: "ws_1",
				name: "My workspace",
				podCode: "pod-userabc1",
				role: "lead",
			},
		});

		const { WorkspaceAccessPanel } = await import("./workspace-access-panel");
		render(<WorkspaceAccessPanel />);

		fireEvent.click(screen.getByRole("button", { name: /create workspace/i }));

		await waitFor(() => {
			expect(ensureOnboardingWorkspace).toHaveBeenCalledWith({});
			expect(screen.getByText("My workspace")).toBeInTheDocument();
		});
	});

	it("joins a workspace with a trimmed pod code and shows success feedback", async () => {
		useQuery.mockReturnValue({
			isMember: false,
			canCreateWorkspace: true,
			workspace: null,
		});
		joinWithPodCode.mockResolvedValue({
			isMember: true,
			canCreateWorkspace: false,
			workspace: {
				workspaceId: "ws_1",
				name: "Ops Workspace",
				podCode: "pod-admin01",
				role: "agent",
			},
		});

		const { WorkspaceAccessPanel } = await import("./workspace-access-panel");
		render(<WorkspaceAccessPanel />);

		fireEvent.change(screen.getByLabelText(/pod code/i), {
			target: { value: "  POD-ADMIN01  " },
		});
		fireEvent.click(screen.getByRole("button", { name: /join workspace/i }));

		await waitFor(() => {
			expect(joinWithPodCode).toHaveBeenCalledWith({ podCode: "POD-ADMIN01" });
			expect(screen.getByText("Joined workspace.")).toBeInTheDocument();
		});
	});

	it("shows inline join errors", async () => {
		useQuery.mockReturnValue({
			isMember: false,
			canCreateWorkspace: true,
			workspace: null,
		});
		joinWithPodCode.mockRejectedValue(new Error("Invalid pod code"));

		const { WorkspaceAccessPanel } = await import("./workspace-access-panel");
		render(<WorkspaceAccessPanel />);

		fireEvent.change(screen.getByLabelText(/pod code/i), {
			target: { value: "missing" },
		});
		fireEvent.click(screen.getByRole("button", { name: /join workspace/i }));

		await waitFor(() => {
			expect(screen.getByText("Invalid pod code")).toBeInTheDocument();
		});
	});

	it("clears optimistic workspace state when the session user changes", async () => {
		useQuery.mockReturnValue({
			isMember: false,
			canCreateWorkspace: true,
			workspace: null,
		});
		joinWithPodCode.mockResolvedValue({
			isMember: true,
			canCreateWorkspace: false,
			workspace: {
				workspaceId: "ws_1",
				name: "Ops Workspace",
				podCode: "pod-admin01",
				role: "agent",
			},
		});

		const { WorkspaceAccessPanel } = await import("./workspace-access-panel");
		const view = render(<WorkspaceAccessPanel />);

		fireEvent.change(screen.getByLabelText(/pod code/i), {
			target: { value: "pod-admin01" },
		});
		fireEvent.click(screen.getByRole("button", { name: /join workspace/i }));

		await waitFor(() => {
			expect(screen.getByText("Ops Workspace")).toBeInTheDocument();
		});

		useSession.mockReturnValue({
			data: {
				user: {
					email: "next-user@fylo.local",
					name: "Next User",
					role: "agent",
				},
			},
			isPending: false,
		});
		view.rerender(<WorkspaceAccessPanel />);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /create or join a workspace/i }),
			).toBeInTheDocument();
		});
	});
});
