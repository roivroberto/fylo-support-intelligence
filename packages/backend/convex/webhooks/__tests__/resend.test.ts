import { describe, expect, it } from "vitest";
import { parseResendInboundPayload } from "../resend";

describe("parseResendInboundPayload", () => {
	it("rejects payloads without a usable external email id", () => {
		const result = parseResendInboundPayload({
			type: "email.received",
			data: {
				from: "sender@example.com",
				to: ["support@example.com"],
				subject: "Hello",
			},
		});

		expect(result.ok).toBe(false);
		if (result.ok) {
			throw new Error("expected invalid payload");
		}
		expect(result.error).toBe("Missing external email id");
	});

	it("accepts payloads with an email id", () => {
		const result = parseResendInboundPayload({
			type: "email.received",
			data: {
				email_id: "email_123",
				from: "sender@example.com",
				to: ["support@example.com"],
				subject: "Hello",
			},
		});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("expected valid payload");
		}
		expect(result.externalId).toBe("email_123");
	});

	it("rejects unsupported webhook event types", () => {
		const result = parseResendInboundPayload({
			type: "email.delivered",
			data: {
				email_id: "email_123",
			},
		});

		expect(result.ok).toBe(false);
		if (result.ok) {
			throw new Error("expected invalid payload");
		}
		expect(result.error).toBe("Unsupported event type");
	});
});
