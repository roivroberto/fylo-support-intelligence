import { describe, expect, it } from "vitest";

import {
	createPayloadDigest,
	recordIngestFailure,
} from "../../ingest_failures";

describe("ingest failure helpers", () => {
	it("builds a stable payload digest", async () => {
		const digest = await createPayloadDigest('{"id":"evt_123"}');

		expect(digest).toMatch(/^[a-f0-9]{16}$/);
		expect(await createPayloadDigest('{"id":"evt_123"}')).toBe(digest);
	});

	it("returns a recorded failure payload", async () => {
		await expect(
			recordIngestFailure("invalid_json", "abc123def4567890"),
		).resolves.toMatchObject({
			status: "recorded",
			reason: "invalid_json",
			payloadDigest: "abc123def4567890",
		});
	});
});
