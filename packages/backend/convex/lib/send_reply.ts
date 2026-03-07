import { sha256Hex } from "./hash";

export type ApprovedReplyPayload = {
	to: string;
	subject: string;
	html: string;
	idempotencyKey: string;
};

export type ApprovedReplySender = {
	send: (payload: ApprovedReplyPayload) => Promise<{ id: string }>;
};

export async function sendApprovedReply(
	resend: ApprovedReplySender,
	payload: ApprovedReplyPayload,
) {
	const response = await resend.send(payload);

	return {
		providerMessageId: response.id,
	};
}

export async function buildApprovedReplyRequest(input: {
	ticket: {
		_id?: string;
		requesterEmail?: string | null;
		subject?: string | null;
		reviewState?: string | null;
		status?: string | null;
	};
	draftReply: string;
	requestedTo?: string | null;
	requestedSubject?: string | null;
}) {
	if (
		input.ticket.reviewState !== "auto_assign_allowed" ||
		input.ticket.status !== "assigned"
	) {
		throw new Error("Ticket is not approved for sending");
	}

	const to = input.ticket.requesterEmail?.trim();
	if (!to) {
		throw new Error("Ticket requester email is required");
	}

	const subject = input.ticket.subject?.trim();
	if (!subject) {
		throw new Error("Ticket subject is required");
	}

	if (input.requestedTo && input.requestedTo !== to) {
		throw new Error("Reply destination mismatch");
	}

	if (input.requestedSubject && input.requestedSubject !== subject) {
		throw new Error("Reply subject mismatch");
	}

	const text = input.draftReply.trim();
	if (!text) {
		throw new Error("Draft reply is required");
	}

	return {
		to,
		subject,
		text,
		html: formatReplyHtml(text),
		idempotencyKey: await buildOutboundIdempotencyKey({
			ticketId: input.ticket._id ?? "ticket",
			to,
			subject,
			text,
		}),
	};
}

async function buildOutboundIdempotencyKey(input: {
	ticketId: string;
	to: string;
	subject: string;
	text: string;
}) {
	const digest = await sha256Hex(
		JSON.stringify({
			to: input.to,
			subject: input.subject,
			text: input.text,
		}),
	);

	return `resend:outbound:${input.ticketId}:${digest}`;
}

export function formatReplyHtml(reply: string) {
	return reply
		.trim()
		.split(/\n\s*\n/)
		.map(
			(paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`,
		)
		.join("");
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}
