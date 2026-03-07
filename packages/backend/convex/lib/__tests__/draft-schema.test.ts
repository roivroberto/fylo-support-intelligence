import { describe, expect, it } from "vitest";

import { draftReplySchema } from "../draft_schema";

describe("draftReplySchema", () => {
	it("requires summary and draft text", () => {
		const parsed = draftReplySchema.safeParse({ summary: "", draft_reply: "" });
		expect(parsed.success).toBe(false);
	});
});
