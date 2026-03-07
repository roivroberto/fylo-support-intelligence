import { describe, expect, it } from "vitest";

import { AUTH_SESSION_HEADER } from "./lib/auth-session";
import { config, proxy } from "./proxy";

describe("proxy", () => {
	it("marks requests with an auth-session header when a session cookie is present", () => {
		const response = proxy({
			url: "https://example.com/visibility",
			nextUrl: new URL("https://example.com/visibility"),
			headers: new Headers({
				cookie: "better-auth.session_token=abc123",
			}),
		} as never);

		expect(response.headers.get("x-middleware-override-headers")).toContain(
			AUTH_SESSION_HEADER,
		);
		expect(
			response.headers.get(`x-middleware-request-${AUTH_SESSION_HEADER}`),
		).toBe("1");
	});

	it("marks requests unauthenticated when no session cookie is present", () => {
		const response = proxy({
			url: "https://example.com/",
			nextUrl: new URL("https://example.com/"),
			headers: new Headers(),
		} as never);

		expect(
			response.headers.get(`x-middleware-request-${AUTH_SESSION_HEADER}`),
		).toBe("0");
	});

	it("redirects unauthenticated users on protected routes", () => {
		const response = proxy({
			url: "https://example.com/visibility",
			nextUrl: new URL("https://example.com/visibility"),
			headers: new Headers(),
		} as never);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe(
			"https://example.com/sign-in?next=%2Fvisibility",
		);
	});

	it("preserves the requested path and query in redirect next param", () => {
		const response = proxy({
			url: "https://example.com/tickets/abc123?tab=notes",
			nextUrl: new URL("https://example.com/tickets/abc123?tab=notes"),
			headers: new Headers(),
		} as never);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe(
			"https://example.com/sign-in?next=%2Ftickets%2Fabc123%3Ftab%3Dnotes",
		);
	});

	it("keeps the existing app matcher", () => {
		expect(config.matcher).toEqual([
			"/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
		]);
	});
});
