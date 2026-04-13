import { describe, expect, it } from "vitest";

import {
	assertPilotWorkspaceCanBeCreated,
	requireSinglePilotWorkspaceMembership,
} from "../pilot_workspace";

describe("requireSinglePilotWorkspaceMembership", () => {
	it("returns the only workspace membership in single-workspace mode", () => {
		const membership = requireSinglePilotWorkspaceMembership([
			{ _id: "m1", workspaceId: "ws_1", userId: "u1", role: "lead" },
		]);

		expect(membership.workspaceId).toBe("ws_1");
	});

	it("throws when no workspace membership exists", () => {
		expect(() => requireSinglePilotWorkspaceMembership([])).toThrow(
			"Forbidden",
		);
	});

	it("throws when multiple workspaces are present", () => {
		expect(() =>
			requireSinglePilotWorkspaceMembership([
				{ _id: "m1", workspaceId: "ws_1", userId: "u1", role: "lead" },
				{ _id: "m2", workspaceId: "ws_2", userId: "u1", role: "agent" },
			]),
		).toThrow("Multiple workspaces are not supported in the pilot yet");
	});
});

describe("assertPilotWorkspaceCanBeCreated", () => {
	it("allows creating the first pilot workspace", () => {
		expect(() => assertPilotWorkspaceCanBeCreated(0)).not.toThrow();
	});

	it("rejects creating a second pilot workspace", () => {
		expect(() => assertPilotWorkspaceCanBeCreated(1)).toThrow(
			"A pilot workspace already exists",
		);
	});
});
