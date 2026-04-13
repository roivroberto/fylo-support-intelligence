import { describe, expect, it } from "vitest";

import { normalizeSessionUser, roleFromSession } from "../current-user";

describe("roleFromSession", () => {
	it("defaults to agent when session role is missing", () => {
		expect(roleFromSession(undefined)).toBe("agent");
	});

	it("normalizes a loose session user shape", () => {
		expect(
			normalizeSessionUser({
				email: "agent@example.com",
				name: 42,
				role: "lead",
			}),
		).toEqual({
			email: "agent@example.com",
			name: null,
			role: "lead",
		});
	});

	it("returns null fields for an unknown session user", () => {
		expect(normalizeSessionUser(null)).toEqual({
			email: null,
			name: null,
			role: "agent",
		});
	});
});
