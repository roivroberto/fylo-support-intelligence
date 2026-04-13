import { Webhook } from "svix";
import { sha256Hex } from "./hash";

export type ResendSignatureHeaders = {
	svixId: string;
	svixTimestamp: string;
	svixSignature: string;
};

export async function verifyResendSignature(
	headers: ResendSignatureHeaders,
	rawBody: string,
	secret: string,
) {
	if (
		!secret ||
		!headers.svixId ||
		!headers.svixTimestamp ||
		!headers.svixSignature
	) {
		return false;
	}

	try {
		new Webhook(secret).verify(rawBody, {
			"svix-id": headers.svixId,
			"svix-timestamp": headers.svixTimestamp,
			"svix-signature": headers.svixSignature,
		});
		return true;
	} catch {
		return false;
	}
}

export async function createResendIdempotencyKey(
	deliveryId: string,
	eventId: string,
	rawBody: string,
) {
	if (deliveryId) {
		return `resend:delivery:${deliveryId}`;
	}

	if (eventId) {
		return `resend:event:${eventId}`;
	}

	const digest = await sha256Hex(rawBody);
	return `resend:body:${digest}`;
}
