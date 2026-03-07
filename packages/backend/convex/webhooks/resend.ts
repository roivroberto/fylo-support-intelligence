import { httpActionGeneric, makeFunctionReference } from "convex/server";
import { createPayloadDigest, recordIngestFailure } from "../ingest_failures";
import {
	createResendIdempotencyKey,
	type ResendSignatureHeaders,
	verifyResendSignature,
} from "../lib/resend_signature";
import { INBOUND_MESSAGE_SOURCE, type InboundMessageSeed } from "../messages";
import { INBOUND_TICKET_SOURCE } from "../tickets";

type ResendInboundPayload = {
	type?: unknown;
	created_at?: unknown;
	data?: {
		email_id?: unknown;
		id?: unknown;
		from?: unknown;
		to?: unknown;
		subject?: unknown;
		text?: unknown;
		html?: unknown;
	};
};

const httpAction = httpActionGeneric;
const ingestInboundMessageReference = makeFunctionReference<
	"mutation",
	InboundMessageSeed,
	{ messageId: string; created: boolean }
>("messages:ingestInbound");
const ingestInboundTicketReference = makeFunctionReference<
	"mutation",
	{
		source: typeof INBOUND_TICKET_SOURCE;
		externalId: string;
		messageId: string;
		requesterEmail: string | null;
		subject: string | null;
		receivedAt: number;
	},
	{ ticketId: string; created: boolean }
>("tickets:ingestInbound");

function json(body: unknown, status: number) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
		},
	});
}

function readString(value: unknown) {
	return typeof value === "string" && value.length > 0 ? value : null;
}

function readStringArray(value: unknown) {
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === "string");
	}

	const single = readString(value);
	return single ? [single] : [];
}

function getSignatureHeaders(request: Request): ResendSignatureHeaders {
	return {
		svixId: request.headers.get("svix-id") ?? "",
		svixTimestamp: request.headers.get("svix-timestamp") ?? "",
		svixSignature: request.headers.get("svix-signature") ?? "",
	};
}

function getExternalId(payload: ResendInboundPayload) {
	return readString(payload.data?.email_id) ?? "";
}

type ParsedResendInboundPayload = {
	ok: true;
	externalId: string;
	from: string | null;
	to: string[];
	subject: string | null;
	text: string | null;
	html: string | null;
};

type InvalidResendInboundPayload = {
	ok: false;
	error: string;
};

export function parseResendInboundPayload(
	payload: ResendInboundPayload,
): ParsedResendInboundPayload | InvalidResendInboundPayload {
	if (payload.type !== "email.received") {
		return { ok: false, error: "Unsupported event type" };
	}

	const externalId = getExternalId(payload);
	if (!externalId) {
		return { ok: false, error: "Missing external email id" };
	}

	return {
		ok: true,
		externalId,
		from: readString(payload.data?.from),
		to: readStringArray(payload.data?.to),
		subject: readString(payload.data?.subject),
		text: readString(payload.data?.text),
		html: readString(payload.data?.html),
	};
}

export const resendInboundWebhook = httpAction(async (ctx, request) => {
	const rawBody = await request.text();
	const payloadDigest = await createPayloadDigest(rawBody);
	const signatureHeaders = getSignatureHeaders(request);
	const secret = process.env.RESEND_WEBHOOK_SECRET ?? "";
	const isValid = await verifyResendSignature(
		signatureHeaders,
		rawBody,
		secret,
	);

	if (!isValid) {
		return json({ ok: false, error: "Invalid signature" }, 401);
	}

	let payload: ResendInboundPayload;

	try {
		payload = JSON.parse(rawBody) as ResendInboundPayload;
	} catch {
		return json(
			{
				ok: false,
				error: "Invalid JSON",
				failure: await recordIngestFailure("invalid_json", payloadDigest),
			},
			400,
		);
	}

	const parsedPayload = parseResendInboundPayload(payload);
	if (parsedPayload.ok === false) {
		return json(
			{
				ok: false,
				error: parsedPayload.error,
				failure: await recordIngestFailure("invalid_payload", payloadDigest),
			},
			400,
		);
	}

	const idempotencyKey = await createResendIdempotencyKey(
		signatureHeaders.svixId,
		parsedPayload.externalId,
		rawBody,
	);
	const receivedAt = Date.now();
	const message: InboundMessageSeed = {
		source: INBOUND_MESSAGE_SOURCE,
		externalId: parsedPayload.externalId,
		idempotencyKey,
		from: parsedPayload.from,
		to: parsedPayload.to,
		subject: parsedPayload.subject,
		text: parsedPayload.text,
		html: parsedPayload.html,
		receivedAt,
		rawBody,
	};
	try {
		const messageResult = await ctx.runMutation(
			ingestInboundMessageReference,
			message,
		);
		const ticketResult = await ctx.runMutation(ingestInboundTicketReference, {
			source: INBOUND_TICKET_SOURCE,
			externalId: parsedPayload.externalId,
			messageId: messageResult.messageId,
			requesterEmail: parsedPayload.from,
			subject: parsedPayload.subject,
			receivedAt,
		});

		return json(
			{
				ok: true,
				accepted: messageResult.created || ticketResult.created,
				duplicate: !messageResult.created && !ticketResult.created,
				idempotencyKey,
				messageId: messageResult.messageId,
				ticketId: ticketResult.ticketId,
			},
			200,
		);
	} catch {
		return json(
			{
				ok: false,
				error: "Failed to ingest inbound email",
				failure: await recordIngestFailure(
					"ingest_mutation_failed",
					payloadDigest,
				),
			},
			500,
		);
	}
});
