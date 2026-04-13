import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../auth", () => ({
	authComponent: {
		getAuthUser: vi.fn(),
	},
}));

import { authComponent } from "../../auth";
import * as agentProfiles from "../../agent_profiles";

type TestMembership = {
	_id: string;
	workspaceId: string;
	userId: string;
	role: "lead" | "agent";
	createdAt: number;
};

type TestAgentProfile = {
	_id: string;
	workspaceId: string;
	userId: string;
	resumeFileName?: string;
	resumeMimeType?: string;
	resumeUploadedAt?: number;
	parseStatus: "idle" | "processing" | "ready" | "failed";
	primarySkills: string[];
	secondarySkills: string[];
	languages: string[];
	summary?: string;
	parseSource?: "provider" | "fallback";
	parseFallbackReason?: "parser_error" | "invalid_schema" | null;
	parseError?: string;
	lastParsedAt?: number;
	createdAt: number;
	updatedAt: number;
};

function createDb(input?: {
	memberships?: TestMembership[];
	agentProfiles?: TestAgentProfile[];
}) {
	const state = {
		memberships: [...(input?.memberships ?? [])],
		agentProfiles: [...(input?.agentProfiles ?? [])],
	};

	return {
		state,
		query(table: "memberships" | "agentProfiles") {
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
					};
				},
			};
		},
	};
}

beforeEach(() => {
	vi.mocked(authComponent.getAuthUser).mockReset();
});

describe("getTeamProfileDirectory", () => {
	it("a lead can read all workspace members with mixed ready and missing profile states", async () => {
		vi.mocked(authComponent.getAuthUser).mockResolvedValue({ _id: "user_lead" } as any);
		const db = createDb({
			memberships: [
				{
					_id: "membership_1",
					workspaceId: "ws_1",
					userId: "user_lead",
					role: "lead",
					createdAt: 1,
				},
				{
					_id: "membership_2",
					workspaceId: "ws_1",
					userId: "user_agent_ready",
					role: "agent",
					createdAt: 2,
				},
				{
					_id: "membership_3",
					workspaceId: "ws_1",
					userId: "user_agent_missing",
					role: "agent",
					createdAt: 3,
				},
			],
			agentProfiles: [
				{
					_id: "profile_1",
					workspaceId: "ws_1",
					userId: "user_agent_ready",
					resumeFileName: "ready-agent.pdf",
					resumeMimeType: "application/pdf",
					resumeUploadedAt: 100,
					parseStatus: "ready",
					primarySkills: ["technical_problem"],
					secondarySkills: ["billing_issue"],
					languages: ["en"],
					summary: "Handles technical support queues.",
					parseSource: "provider",
					parseFallbackReason: null,
					lastParsedAt: 120,
					createdAt: 100,
					updatedAt: 120,
				},
			],
		});

		const handler = (agentProfiles as any).getTeamProfileDirectory?._handler;
		expect(handler).toBeTypeOf("function");

		const result = await handler({ db }, {});

		expect(result).toEqual({
			workspaceId: "ws_1",
			summary: {
				totalMembers: 3,
				readyCount: 1,
				processingCount: 0,
				failedCount: 0,
				missingCount: 2,
			},
			members: [
				{
					userId: "user_lead",
					role: "lead",
					profile: null,
				},
				{
					userId: "user_agent_ready",
					role: "agent",
					profile: {
						resumeFileName: "ready-agent.pdf",
						resumeMimeType: "application/pdf",
						resumeUploadedAt: 100,
						parseStatus: "ready",
						primarySkills: ["technical_problem"],
						secondarySkills: ["billing_issue"],
						languages: ["en"],
						summary: "Handles technical support queues.",
						parseSource: "provider",
						parseFallbackReason: null,
						parseError: undefined,
						lastParsedAt: 120,
					},
				},
				{
					userId: "user_agent_missing",
					role: "agent",
					profile: null,
				},
			],
		});
	});

	it("an agent gets Forbidden", async () => {
		vi.mocked(authComponent.getAuthUser).mockResolvedValue({
			_id: "user_agent",
		} as any);
		const db = createDb({
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

		const handler = (agentProfiles as any).getTeamProfileDirectory?._handler;
		expect(handler).toBeTypeOf("function");

		await expect(handler({ db }, {})).rejects.toEqual(
			expect.objectContaining({ message: "Forbidden" }),
		);
	});
});
