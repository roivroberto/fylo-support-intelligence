import { describe, expect, it } from "vitest";

import { AUTH_SESSION_HEADER, hasAuthSessionCookie } from "../auth-session";

describe("auth session flow", () => {
	it("detects a Better Auth session cookie", () => {
		expect(
			hasAuthSessionCookie("foo=bar; better-auth.session_token=abc123"),
		).toBe(true);
	});

	it("skips the initial token fetch when middleware marked the request unauthenticated", async () => {
		process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
		process.env.NEXT_PUBLIC_CONVEX_SITE_URL = "https://example.convex.site";
		process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";

		const { shouldAttemptInitialAuthToken } = await import("../auth-server");

		expect(
			shouldAttemptInitialAuthToken(new Headers([[AUTH_SESSION_HEADER, "0"]])),
		).toBe(false);
	});
});
