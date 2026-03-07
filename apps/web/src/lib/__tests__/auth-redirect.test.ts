import { describe, expect, it } from "vitest";

import { DEFAULT_NEXT_PATH, getSafeNextPath } from "../auth-redirect";

describe("auth redirect helpers", () => {
	it("allows internal paths", () => {
		expect(getSafeNextPath("/visibility")).toBe("/visibility");
		expect(getSafeNextPath("/tickets/123?tab=notes")).toBe(
			"/tickets/123?tab=notes",
		);
	});

	it("falls back for missing and unsafe paths", () => {
		expect(getSafeNextPath(null)).toBe(DEFAULT_NEXT_PATH);
		expect(getSafeNextPath(undefined)).toBe(DEFAULT_NEXT_PATH);
		expect(getSafeNextPath("")).toBe(DEFAULT_NEXT_PATH);
		expect(getSafeNextPath("visibility")).toBe(DEFAULT_NEXT_PATH);
		expect(getSafeNextPath("//evil.example/hijack")).toBe(DEFAULT_NEXT_PATH);
		expect(getSafeNextPath("https://evil.example/hijack")).toBe(
			DEFAULT_NEXT_PATH,
		);
		expect(getSafeNextPath("javascript:alert(1)")).toBe(DEFAULT_NEXT_PATH);
	});
});
