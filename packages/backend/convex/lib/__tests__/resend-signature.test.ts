import { Webhook } from "svix";
import { describe, expect, it } from "vitest";
import {
	createResendIdempotencyKey,
	verifyResendSignature,
} from "../resend_signature";

describe("verifyResendSignature", () => {
	const secret = "whsec_dGVzdF9zZWNyZXQ=";

	it("returns false when signature header is missing", async () => {
		const ok = await verifyResendSignature(
			{
				svixId: "",
				svixTimestamp: "",
				svixSignature: "",
			},
			"{}",
			"secret",
		);
		expect(ok).toBe(false);
	});

	it("returns true for a matching svix signature", async () => {
		const rawBody = JSON.stringify({ type: "email.received" });
		const wh = new Webhook(secret);
		const svixId = "msg_123";
		const svixTimestamp = String(Math.floor(Date.now() / 1000));
		const svixSignature = wh.sign(
			svixId,
			new Date(Number(svixTimestamp) * 1000),
			rawBody,
		);

		const ok = await verifyResendSignature(
			{
				svixId,
				svixTimestamp,
				svixSignature,
			},
			rawBody,
			secret,
		);

		expect(ok).toBe(true);
	});

	it("returns false for a malformed same-length svix signature", async () => {
		const ok = await verifyResendSignature(
			{
				svixId: "msg_123",
				svixTimestamp: String(Date.now()),
				svixSignature: "v1,!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
			},
			"{}",
			secret,
		);
		expect(ok).toBe(false);
	});
});

describe("createResendIdempotencyKey", () => {
	it("prefers the delivery id when present", async () => {
		expect(await createResendIdempotencyKey("msg_123", "evt_123", "{}")).toBe(
			"resend:delivery:msg_123",
		);
	});

	it("falls back to the webhook event id when delivery id is missing", async () => {
		expect(await createResendIdempotencyKey("", "evt_123", "{}")).toBe(
			"resend:event:evt_123",
		);
	});

	it("falls back to a stable hash of the raw body", async () => {
		const one = await createResendIdempotencyKey("", "", '{"hello":"world"}');
		const two = await createResendIdempotencyKey("", "", '{"hello":"world"}');

		expect(one).toBe(two);
		expect(one.startsWith("resend:body:")).toBe(true);
	});
});
