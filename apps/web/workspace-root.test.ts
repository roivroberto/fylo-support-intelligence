import { describe, expect, it } from "vitest";

import { resolveNextWorkspaceRoot } from "./workspace-root";

describe("resolveNextWorkspaceRoot", () => {
	it("uses the repository root for a standard checkout", () => {
		expect(resolveNextWorkspaceRoot("/repo/apps/web")).toBe("/repo");
	});

	it("jumps out of .worktrees for a feature worktree checkout", () => {
		expect(resolveNextWorkspaceRoot("/repo/.worktrees/feature/apps/web")).toBe(
			"/repo",
		);
	});
});
