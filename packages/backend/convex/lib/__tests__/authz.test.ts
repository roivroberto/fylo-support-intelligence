import { describe, expect, it } from "vitest";
import {
	canManagePolicy,
	canManageWorkspaceMemberships,
	wouldLeaveWorkspaceWithoutLead,
} from "../authz";

describe("canManagePolicy", () => {
	it("allows lead role", () => {
		expect(canManagePolicy("lead")).toBe(true);
	});

	it("denies agent role", () => {
		expect(canManagePolicy("agent")).toBe(false);
	});
});

describe("canManageWorkspaceMemberships", () => {
	it("allows lead role", () => {
		expect(canManageWorkspaceMemberships("lead")).toBe(true);
	});

	it("denies agent role", () => {
		expect(canManageWorkspaceMemberships("agent")).toBe(false);
	});
});

describe("wouldLeaveWorkspaceWithoutLead", () => {
	it("blocks demoting the only lead to agent", () => {
		expect(
			wouldLeaveWorkspaceWithoutLead({
				currentRole: "lead",
				nextRole: "agent",
				leadCount: 1,
			}),
		).toBe(true);
	});

	it("allows keeping a lead role when there is one lead", () => {
		expect(
			wouldLeaveWorkspaceWithoutLead({
				currentRole: "lead",
				nextRole: "lead",
				leadCount: 1,
			}),
		).toBe(false);
	});

	it("allows demoting a lead when another lead remains", () => {
		expect(
			wouldLeaveWorkspaceWithoutLead({
				currentRole: "lead",
				nextRole: "agent",
				leadCount: 2,
			}),
		).toBe(false);
	});

	it("allows assigning agent role changes when no lead is removed", () => {
		expect(
			wouldLeaveWorkspaceWithoutLead({
				currentRole: "agent",
				nextRole: "agent",
				leadCount: 1,
			}),
		).toBe(false);
	});
});
