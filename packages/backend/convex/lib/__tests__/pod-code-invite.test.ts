import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../auth", () => ({
	authComponent: {
		getAuthUser: vi.fn(),
	},
}));

import { authComponent } from "../../auth";
import * as memberships from "../../memberships";
import * as workspaces from "../../workspaces";
import {
	buildPodCode,
	buildWorkspaceAccessState,
	normalizePodCode,
} from "../workspace_access";

type TestWorkspace = {
	_id: string;
	name: string;
	slug: string;
	createdAt: number;
	createdByUserId: string;
};

type TestMembership = {
	_id: string;
	workspaceId: string;
	userId: string;
	role: "lead" | "agent";
	createdAt: number;
};

function createDb(input?: {
	workspaces?: TestWorkspace[];
	memberships?: TestMembership[];
}) {
	const state = {
		workspaces: [...(input?.workspaces ?? [])],
		memberships: [...(input?.memberships ?? [])],
	};
	let workspaceCounter = state.workspaces.length;
	let membershipCounter = state.memberships.length;

	return {
		state,
		query(table: "workspaces" | "memberships") {
			const records = state[table];

			return {
				withIndex(_indexName: string, builder: (q: any) => any) {
					const filters: Array<{ field: string; value: unknown }> = [];
					builder({
						eq(field: string, value: unknown) {
							filters.push({ field, value });
							return this;
						},
					});

					const matches = records.filter((record) =>
						filters.every(
							(filter) =>
								record[filter.field as keyof typeof record] === filter.value,
						),
					);

					return {
						async collect() {
							return [...matches];
						},
						async unique() {
							return matches[0] ?? null;
						},
						async first() {
							return matches[0] ?? null;
						},
					};
				},
				async collect() {
					return [...records];
				},
				async first() {
					return records[0] ?? null;
				},
			};
		},
		async get(id: string) {
			return state.workspaces.find((workspace) => workspace._id === id) ?? null;
		},
		async insert(table: "workspaces" | "memberships", value: any) {
			if (table === "workspaces") {
				const _id = `ws_${++workspaceCounter}`;
				state.workspaces.push({ _id, ...value });
				return _id;
			}

			const _id = `membership_${++membershipCounter}`;
			state.memberships.push({ _id, ...value });
			return _id;
		},
	};
}

beforeEach(() => {
	vi.mocked(authComponent.getAuthUser).mockReset();
	vi.stubEnv("NODE_ENV", "test");
});

describe("pod code workspace helpers", () => {
	it("normalizes pod code input", () => {
		expect(normalizePodCode("  POD-Lead01  ")).toBe("pod-lead01");
	});

	it("builds a stable pod code from the creating user", () => {
		expect(buildPodCode("user_ABC-123")).toBe("pod-userabc1");
	});

	it("returns a member workspace state when membership exists", () => {
		expect(
			buildWorkspaceAccessState({
				workspace: {
					_id: "ws_1",
					name: "Ops Workspace",
					slug: "pod-admin01",
				},
				membership: {
					workspaceId: "ws_1",
					role: "lead",
				},
				canCreateWorkspace: false,
			}),
		).toEqual({
			isMember: true,
			canCreateWorkspace: false,
			workspace: {
				workspaceId: "ws_1",
				name: "Ops Workspace",
				podCode: "pod-admin01",
				role: "lead",
			},
		});
	});

	it("returns a create state when no workspace membership exists", () => {
		expect(
			buildWorkspaceAccessState({
				workspace: null,
				membership: null,
				canCreateWorkspace: true,
			}),
		).toEqual({
			isMember: false,
			canCreateWorkspace: true,
			workspace: null,
		});
	});

	it("returns a non-member state when a workspace exists without membership", () => {
		expect(
			buildWorkspaceAccessState({
				workspace: {
					_id: "ws_1",
					name: "Ops Workspace",
					slug: "pod-admin01",
				},
				membership: null,
				canCreateWorkspace: false,
			}),
		).toEqual({
			isMember: false,
			canCreateWorkspace: false,
			workspace: null,
		});
	});
});

describe("pod code invite convex handlers", () => {
	it("creates the first workspace and returns a pod code for the lead", async () => {
		vi.mocked(authComponent.getAuthUser).mockResolvedValue({
			_id: "user_ABC-123",
		} as any);
		const db = createDb();

		const handler = (workspaces as any).ensureOnboardingWorkspace?._handler;
		expect(handler).toBeTypeOf("function");

		const result = await handler({ db }, {});

		expect(result).toEqual({
			isMember: true,
			canCreateWorkspace: false,
			workspace: {
				workspaceId: "ws_1",
				name: "My workspace",
				podCode: "pod-userabc1",
				role: "lead",
			},
		});
		expect(db.state.workspaces).toHaveLength(1);
		expect(db.state.memberships).toHaveLength(1);
	});

	it("joins an existing workspace by pod code as an agent", async () => {
		vi.mocked(authComponent.getAuthUser).mockResolvedValue({ _id: "user_agent" } as any);
		const db = createDb({
			workspaces: [
				{
					_id: "ws_1",
					name: "Ops Workspace",
					slug: "pod-admin01",
					createdAt: 1,
					createdByUserId: "user_lead",
				},
			],
		});

		const handler = (memberships as any).joinWithPodCode?._handler;
		expect(handler).toBeTypeOf("function");

		const result = await handler({ db }, { podCode: "  POD-ADMIN01  " });

		expect(result).toEqual({
			isMember: true,
			canCreateWorkspace: false,
			workspace: {
				workspaceId: "ws_1",
				name: "Ops Workspace",
				podCode: "pod-admin01",
				role: "agent",
			},
		});
		expect(db.state.memberships).toContainEqual(
			expect.objectContaining({
				workspaceId: "ws_1",
				userId: "user_agent",
				role: "agent",
			}),
		);
	});

	it("returns current workspace details for a member and create state for a non-member", async () => {
		const db = createDb({
			workspaces: [
				{
					_id: "ws_1",
					name: "Ops Workspace",
					slug: "pod-admin01",
					createdAt: 1,
					createdByUserId: "user_lead",
				},
			],
			memberships: [
				{
					_id: "membership_1",
					workspaceId: "ws_1",
					userId: "user_lead",
					role: "lead",
					createdAt: 1,
				},
			],
		});

		const handler = (workspaces as any).getCurrentWorkspace?._handler;
		expect(handler).toBeTypeOf("function");

		vi.mocked(authComponent.getAuthUser).mockResolvedValueOnce({
			_id: "user_lead",
		} as any);
		await expect(handler({ db }, {})).resolves.toEqual({
			isMember: true,
			canCreateWorkspace: false,
			workspace: {
				workspaceId: "ws_1",
				name: "Ops Workspace",
				podCode: "pod-admin01",
				role: "lead",
			},
		});

		vi.mocked(authComponent.getAuthUser).mockResolvedValueOnce({
			_id: "user_guest",
		} as any);
		await expect(handler({ db }, {})).resolves.toEqual({
			isMember: false,
			canCreateWorkspace: true,
			workspace: null,
		});
	});

	it("rejects an invalid pod code", async () => {
		vi.mocked(authComponent.getAuthUser).mockResolvedValue({ _id: "user_agent" } as any);
		const db = createDb();
		const handler = (memberships as any).joinWithPodCode?._handler;

		await expect(handler({ db }, { podCode: "missing" })).rejects.toEqual(
			expect.objectContaining({
				message: "Invalid pod code",
			}),
		);
	});

	it("returns the existing workspace state when onboarding is called by a member", async () => {
		vi.mocked(authComponent.getAuthUser).mockResolvedValue({ _id: "user_lead" } as any);
		const db = createDb({
			workspaces: [
				{
					_id: "ws_1",
					name: "Ops Workspace",
					slug: "pod-admin01",
					createdAt: 1,
					createdByUserId: "user_lead",
				},
			],
			memberships: [
				{
					_id: "membership_1",
					workspaceId: "ws_1",
					userId: "user_lead",
					role: "lead",
					createdAt: 1,
				},
			],
		});

		const handler = (workspaces as any).ensureOnboardingWorkspace?._handler;

		await expect(handler({ db }, {})).resolves.toEqual({
			isMember: true,
			canCreateWorkspace: false,
			workspace: {
				workspaceId: "ws_1",
				name: "Ops Workspace",
				podCode: "pod-admin01",
				role: "lead",
			},
		});
		expect(db.state.workspaces).toHaveLength(1);
		expect(db.state.memberships).toHaveLength(1);
	});

	it("creates a new workspace for a team lead when other workspaces exist", async () => {
		vi.mocked(authComponent.getAuthUser).mockResolvedValue({ _id: "user_guest" } as any);
		const db = createDb({
			workspaces: [
				{
					_id: "ws_1",
					name: "Ops Workspace",
					slug: "pod-admin01",
					createdAt: 1,
					createdByUserId: "user_lead",
				},
			],
		});

		const handler = (workspaces as any).ensureOnboardingWorkspace?._handler;

		const result = await handler({ db }, {});

		expect(result.isMember).toBe(true);
		expect(result.workspace).not.toBeNull();
		expect(result.workspace?.role).toBe("lead");
		expect(result.workspace?.podCode).toBe("pod-usergues"); // buildPodCode("user_guest") -> "pod-usergues"
		expect(db.state.workspaces).toHaveLength(2);
		expect(db.state.memberships).toHaveLength(1);
		expect(db.state.memberships[0]).toMatchObject({
			workspaceId: expect.any(String),
			userId: "user_guest",
			role: "lead",
		});
	});

	it("rejects joining a second workspace during the pilot", async () => {
		vi.mocked(authComponent.getAuthUser).mockResolvedValue({ _id: "user_agent" } as any);
		const db = createDb({
			workspaces: [
				{
					_id: "ws_1",
					name: "Current Workspace",
					slug: "pod-current01",
					createdAt: 1,
					createdByUserId: "user_lead",
				},
				{
					_id: "ws_2",
					name: "Other Workspace",
					slug: "pod-other01",
					createdAt: 2,
					createdByUserId: "user_other_lead",
				},
			],
			memberships: [
				{
					_id: "membership_1",
					workspaceId: "ws_1",
					userId: "user_agent",
					role: "agent",
					createdAt: 1,
				},
			],
		});

		const handler = (memberships as any).joinWithPodCode?._handler;

		await expect(handler({ db }, { podCode: "pod-other01" })).rejects.toEqual(
			expect.objectContaining({
				message: "Multiple workspaces are not supported in the pilot yet",
			}),
		);
	});

	it("rejects memberships.save when adding a user to a second workspace", async () => {
		vi.mocked(authComponent.getAuthUser).mockResolvedValue({ _id: "lead_user" } as any);
		const db = createDb({
			workspaces: [
				{
					_id: "ws_1",
					name: "Lead Workspace",
					slug: "pod-lead01",
					createdAt: 1,
					createdByUserId: "lead_user",
				},
				{
					_id: "ws_2",
					name: "Other Workspace",
					slug: "pod-other01",
					createdAt: 2,
					createdByUserId: "other_lead",
				},
			],
			memberships: [
				{
					_id: "membership_1",
					workspaceId: "ws_1",
					userId: "lead_user",
					role: "lead",
					createdAt: 1,
				},
				{
					_id: "membership_2",
					workspaceId: "ws_2",
					userId: "agent_user",
					role: "agent",
					createdAt: 2,
				},
			],
		});

		const handler = (memberships as any).save?._handler;

		await expect(
			handler(
				{ db },
				{ workspaceId: "ws_1", userId: "agent_user", role: "agent" },
			),
		).rejects.toEqual(
			expect.objectContaining({
				message: "Multiple workspaces are not supported in the pilot yet",
			}),
		);
	});

	it("rejects e2e helpers in production", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.mocked(authComponent.getAuthUser).mockResolvedValue({ _id: "user_lead" } as any);
		const db = createDb();

		const e2eModule = (await import("../../e2e")) as any;
		const seedHandler = e2eModule.seedData._handler;
		const outboundHandler = e2eModule.getLatestOutboundForTicket._handler;

		await expect(seedHandler({ db }, {})).rejects.toEqual(
			expect.objectContaining({ message: "Forbidden" }),
		);
		await expect(
			outboundHandler({ db }, { ticketId: "ticket_1" }),
		).rejects.toEqual(expect.objectContaining({ message: "Forbidden" }));
	});
});
