import { basename, resolve } from "node:path";

export function resolveNextWorkspaceRoot(appDir: string) {
	const standardRoot = resolve(appDir, "../..");
	const worktreesDir = resolve(appDir, "../../..");

	if (basename(worktreesDir) === ".worktrees") {
		return resolve(appDir, "../../../..");
	}

	return standardRoot;
}
