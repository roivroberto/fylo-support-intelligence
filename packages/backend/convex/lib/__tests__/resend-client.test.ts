import { describe, expect, it, vi } from "vitest";

import {
	createResendClient,
	createResendClientFromEnv,
} from "../resend_client";

describe("createResendClient", () => {
	it("posts the resend email payload with auth and idempotency headers", async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ id: "msg_123" }),
		});

		const client = createResendClient({
			apiKey: "re_test",
			from: "ops@example.com",
			fetchImpl,
		});

		await expect(
			client.send({
				to: "customer@example.com",
				subject: "Refund request",
				html: "<p>Hello</p>",
				idempotencyKey: "resend:outbound:ticket_1:abc",
			}),
		).resolves.toEqual({ id: "msg_123" });

		expect(fetchImpl).toHaveBeenCalledWith("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: "Bearer re_test",
				"Content-Type": "application/json",
				"Idempotency-Key": "resend:outbound:ticket_1:abc",
			},
			body: JSON.stringify({
				from: "ops@example.com",
				to: ["customer@example.com"],
				subject: "Refund request",
				html: "<p>Hello</p>",
			}),
		});
	});

	it("throws when resend returns a non-ok response", async () => {
		const client = createResendClient({
			apiKey: "re_test",
			from: "ops@example.com",
			fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 429 }),
		});

		await expect(
			client.send({
				to: "customer@example.com",
				subject: "Refund request",
				html: "<p>Hello</p>",
				idempotencyKey: "resend:outbound:ticket_1:abc",
			}),
		).rejects.toThrow("Resend send failed with status 429");
	});

	it("throws when resend omits the provider message id", async () => {
		const client = createResendClient({
			apiKey: "re_test",
			from: "ops@example.com",
			fetchImpl: vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({ id: "" }),
			}),
		});

		await expect(
			client.send({
				to: "customer@example.com",
				subject: "Refund request",
				html: "<p>Hello</p>",
				idempotencyKey: "resend:outbound:ticket_1:abc",
			}),
		).rejects.toThrow("Resend response missing message id");
	});
});

describe("createResendClientFromEnv", () => {
	it("falls back from RESEND_FROM_EMAIL to RESEND_FROM", () => {
		const client = createResendClientFromEnv({
			RESEND_API_KEY: "re_test",
			RESEND_FROM: "fallback@example.com",
		});

		expect(client.from).toBe("fallback@example.com");
	});

	it("throws when the api key is missing", () => {
		expect(() =>
			createResendClientFromEnv({
				RESEND_FROM_EMAIL: "ops@example.com",
			}),
		).toThrow("RESEND_API_KEY is required to send approved replies");
	});

	it("throws when both from env vars are missing", () => {
		expect(() =>
			createResendClientFromEnv({
				RESEND_API_KEY: "re_test",
			}),
		).toThrow("RESEND_FROM_EMAIL or RESEND_FROM is required");
	});
});
