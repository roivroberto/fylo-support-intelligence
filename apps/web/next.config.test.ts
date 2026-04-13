import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { resolveNextWorkspaceRoot } from "./workspace-root";

describe("next config", () => {
	it("pins the workspace root for Turbopack and allows the Playwright origin", async () => {
		process.env.NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:3001";
		process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
		process.env.NEXT_PUBLIC_CONVEX_SITE_URL = "https://example.convex.site";

		const { default: nextConfig } = await import("./next.config");
		const workspaceRoot = resolveNextWorkspaceRoot(import.meta.dirname);

		expect(nextConfig.allowedDevOrigins).toContain("127.0.0.1");
		expect(resolve(nextConfig.outputFileTracingRoot ?? "")).toBe(workspaceRoot);
		expect(resolve(nextConfig.turbopack?.root ?? "")).toBe(workspaceRoot);
	});
});
