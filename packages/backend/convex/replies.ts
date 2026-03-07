import {
	actionGeneric as action,
	makeFunctionReference,
	queryGeneric as query,
} from "convex/server";
import { ConvexError, v } from "convex/values";

import { authComponent } from "./auth";
import { createResendClientFromEnv } from "./lib/resend_client";
import { buildApprovedReplyRequest, sendApprovedReply } from "./lib/send_reply";
import {
	finalizeOutboundMessageReference,
	OUTBOUND_MESSAGE_SENT,
	OUTBOUND_MESSAGE_SOURCE,
	reserveOutboundMessageReference,
} from "./messages";
import { canAccessOperationalCorePilot } from "./tickets";

type ApprovedReplyTicket = {
	_id: string;
	requesterEmail: string | null;
	subject: string | null;
	reviewState?: string | null;
	status?: string | null;
};

type SendApprovedDeps = {
	createResendClientFromEnv?: typeof createResendClientFromEnv;
	buildApprovedReplyRequest?: typeof buildApprovedReplyRequest;
	sendApprovedReply?: typeof sendApprovedReply;
	now?: () => number;
};

async function requireCurrentUser(ctx: any) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError("Unauthenticated");
	}

	return user;
}

async function requireOperationalCoreSendAccess(ctx: any) {
	const user = await requireCurrentUser(ctx);
	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_userId", (q: any) => q.eq("userId", String(user._id)))
		.collect();

	if (!canAccessOperationalCorePilot(memberships)) {
		throw new ConvexError("Forbidden");
	}
}

export const getApprovedReplyTicketReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	ApprovedReplyTicket | null
>("replies:getApprovedReplyTicket");

export const sendApprovedReplyReference = makeFunctionReference<
	"action",
	{
		ticketId: string;
		to?: string;
		subject?: string;
		draftReply: string;
	},
	{ messageId: string; providerMessageId: string }
>("replies:sendApproved");

export const getApprovedReplyTicket = query({
	args: {
		ticketId: v.id("tickets"),
	},
	handler: async (ctx, args) => {
		await requireOperationalCoreSendAccess(ctx);

		const ticket = await ctx.db.get(args.ticketId);
		if (!ticket) {
			return null;
		}

		return {
			_id: String(ticket._id),
			requesterEmail: ticket.requesterEmail,
			subject: ticket.subject,
			reviewState: ticket.reviewState,
			status: ticket.status,
		};
	},
});

export async function sendApprovedHandler(
	ctx: any,
	args: {
		ticketId: string;
		to?: string;
		subject?: string;
		draftReply: string;
	},
	deps: SendApprovedDeps = {},
) {
	const createResendClientFromEnvImpl =
		deps.createResendClientFromEnv ?? createResendClientFromEnv;
	const buildApprovedReplyRequestImpl =
		deps.buildApprovedReplyRequest ?? buildApprovedReplyRequest;
	const sendApprovedReplyImpl = deps.sendApprovedReply ?? sendApprovedReply;
	const now = deps.now ?? Date.now;
	const resend = createResendClientFromEnvImpl();
	const ticket = await ctx.runQuery(getApprovedReplyTicketReference, {
		ticketId: args.ticketId,
	});

	if (!ticket) {
		throw new ConvexError("Ticket not found");
	}

	const reply = await buildApprovedReplyRequestImpl({
		ticket,
		draftReply: args.draftReply,
		requestedTo: args.to,
		requestedSubject: args.subject,
	});
	const reservation = await ctx.runMutation(reserveOutboundMessageReference, {
		source: OUTBOUND_MESSAGE_SOURCE,
		idempotencyKey: reply.idempotencyKey,
		ticketId: args.ticketId,
		from: resend.from,
		to: [reply.to],
		subject: reply.subject,
		text: reply.text,
		html: reply.html,
		rawBody: JSON.stringify({ state: "pending" }),
		createdAt: now(),
	});

	if (
		reservation.deliveryStatus === OUTBOUND_MESSAGE_SENT &&
		reservation.providerMessageId
	) {
		return {
			messageId: reservation.messageId,
			providerMessageId: reservation.providerMessageId,
		};
	}

	const result = await sendApprovedReplyImpl(resend, {
		to: reply.to,
		subject: reply.subject,
		html: reply.html,
		idempotencyKey: reply.idempotencyKey,
	});
	const sentAt = now();
	let finalized;
	try {
		finalized = await ctx.runMutation(finalizeOutboundMessageReference, {
			messageId: reservation.messageId,
			providerMessageId: result.providerMessageId,
			sentAt,
			rawBody: JSON.stringify({
				state: "sent",
				providerMessageId: result.providerMessageId,
				sentAt,
			}),
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : String(error);
		throw new Error(
			`Failed to finalize approved reply send for messageId=${reservation.messageId} providerMessageId=${result.providerMessageId}: ${message}`,
		);
	}

	return {
		messageId: finalized.messageId,
		providerMessageId: finalized.providerMessageId,
	};
}

export const sendApproved = action({
	args: {
		ticketId: v.id("tickets"),
		to: v.optional(v.string()),
		subject: v.optional(v.string()),
		draftReply: v.string(),
	},
	handler: async (ctx, args) => sendApprovedHandler(ctx, args),
});
