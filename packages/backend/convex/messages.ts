import {
	makeFunctionReference,
	mutationGeneric as mutation,
} from "convex/server";
import { v } from "convex/values";

export const INBOUND_MESSAGE_SOURCE = "resend" as const;
export const OUTBOUND_MESSAGE_SOURCE = "resend" as const;
export const MESSAGE_DIRECTION_INBOUND = "inbound" as const;
export const MESSAGE_DIRECTION_OUTBOUND = "outbound" as const;
export const OUTBOUND_MESSAGE_PENDING = "pending" as const;
export const OUTBOUND_MESSAGE_SENT = "sent" as const;

export type InboundMessageSeed = {
	source: typeof INBOUND_MESSAGE_SOURCE;
	externalId: string;
	idempotencyKey: string;
	from: string | null;
	to: string[];
	subject: string | null;
	text: string | null;
	html: string | null;
	receivedAt: number;
	rawBody: string;
};

export type OutboundDeliveryStatus =
	| typeof OUTBOUND_MESSAGE_PENDING
	| typeof OUTBOUND_MESSAGE_SENT;

export type OutboundMessageRecord<MessageId, TicketId> = {
	_id: MessageId;
	source: typeof OUTBOUND_MESSAGE_SOURCE;
	idempotencyKey: string;
	ticketId: TicketId;
	externalId: string | null;
	providerMessageId: string | null;
	from: string | null;
	to: string[];
	subject: string | null;
	text: string | null;
	html: string | null;
	createdAt: number;
	sentAt?: number;
	rawBody: string;
	deliveryStatus: OutboundDeliveryStatus;
};

export type OutboundMessageReservationSeed<TicketId> = Omit<
	OutboundMessageRecord<never, TicketId>,
	"_id" | "externalId" | "providerMessageId" | "sentAt" | "deliveryStatus"
>;

export type MessageStore<MessageId> = {
	getByIdempotencyKey(
		idempotencyKey: string,
	): Promise<{ _id: MessageId } | null>;
	insert(seed: InboundMessageSeed): Promise<MessageId>;
};

export type OutboundMessageReservationStore<MessageId, TicketId> = {
	getByIdempotencyKey(
		idempotencyKey: string,
	): Promise<OutboundMessageRecord<MessageId, TicketId> | null>;
	insertReservation(
		seed: Omit<OutboundMessageRecord<MessageId, TicketId>, "_id">,
	): Promise<MessageId>;
	finalize(
		messageId: MessageId,
		patch: Pick<
			OutboundMessageRecord<MessageId, TicketId>,
			| "deliveryStatus"
			| "externalId"
			| "providerMessageId"
			| "sentAt"
			| "rawBody"
		>,
	): Promise<void>;
};

export async function ingestInboundMessage<MessageId>(
	store: MessageStore<MessageId>,
	seed: InboundMessageSeed,
) {
	const existing = await store.getByIdempotencyKey(seed.idempotencyKey);

	if (existing) {
		return {
			messageId: existing._id,
			created: false,
		};
	}

	const messageId = await store.insert(seed);
	return {
		messageId,
		created: true,
	};
}

export async function reserveOutboundMessage<MessageId, TicketId>(
	store: OutboundMessageReservationStore<MessageId, TicketId>,
	seed: OutboundMessageReservationSeed<TicketId>,
) {
	const existing = await store.getByIdempotencyKey(seed.idempotencyKey);

	if (existing) {
		return {
			messageId: existing._id,
			created: false,
			deliveryStatus: existing.deliveryStatus,
			providerMessageId: existing.providerMessageId,
		};
	}

	const messageId = await store.insertReservation({
		...seed,
		externalId: null,
		providerMessageId: null,
		deliveryStatus: OUTBOUND_MESSAGE_PENDING,
	});

	return {
		messageId,
		created: true,
		deliveryStatus: OUTBOUND_MESSAGE_PENDING,
		providerMessageId: null,
	};
}

export async function finalizeOutboundMessage<MessageId, TicketId>(
	store: OutboundMessageReservationStore<MessageId, TicketId>,
	input: {
		messageId: MessageId;
		providerMessageId: string;
		sentAt: number;
		rawBody: string;
	},
) {
	await store.finalize(input.messageId, {
		deliveryStatus: OUTBOUND_MESSAGE_SENT,
		externalId: input.providerMessageId,
		providerMessageId: input.providerMessageId,
		sentAt: input.sentAt,
		rawBody: input.rawBody,
	});

	return {
		messageId: input.messageId,
		deliveryStatus: OUTBOUND_MESSAGE_SENT,
		providerMessageId: input.providerMessageId,
	};
}

function createMessageStore(db: any): MessageStore<any> {
	return {
		getByIdempotencyKey: (idempotencyKey) =>
			db
				.query("messages")
				.withIndex("by_idempotencyKey", (q: any) =>
					q.eq("idempotencyKey", idempotencyKey),
				)
				.unique(),
		insert: (seed) =>
			db.insert("messages", {
				...seed,
				direction: MESSAGE_DIRECTION_INBOUND,
			}),
	};
}

function createOutboundMessageStore(
	db: any,
): OutboundMessageReservationStore<any, any> {
	return {
		getByIdempotencyKey: (idempotencyKey) =>
			db
				.query("messages")
				.withIndex("by_idempotencyKey", (q: any) =>
					q.eq("idempotencyKey", idempotencyKey),
				)
				.unique(),
		insertReservation: (seed) =>
			db.insert("messages", {
				...seed,
				direction: MESSAGE_DIRECTION_OUTBOUND,
			}),
		finalize: (messageId, patch) => db.patch(messageId, patch),
	};
}

export const reserveOutboundMessageReference = makeFunctionReference<
	"mutation",
	OutboundMessageReservationSeed<string>,
	{
		messageId: string;
		created: boolean;
		deliveryStatus: OutboundDeliveryStatus;
		providerMessageId: string | null;
	}
>("messages:reserveOutbound");

export const finalizeOutboundMessageReference = makeFunctionReference<
	"mutation",
	{
		messageId: string;
		providerMessageId: string;
		sentAt: number;
		rawBody: string;
	},
	{
		messageId: string;
		deliveryStatus: typeof OUTBOUND_MESSAGE_SENT;
		providerMessageId: string;
	}
>("messages:finalizeOutbound");

export const ingestInbound = mutation({
	args: {
		source: v.literal(INBOUND_MESSAGE_SOURCE),
		externalId: v.string(),
		idempotencyKey: v.string(),
		from: v.union(v.string(), v.null()),
		to: v.array(v.string()),
		subject: v.union(v.string(), v.null()),
		text: v.union(v.string(), v.null()),
		html: v.union(v.string(), v.null()),
		receivedAt: v.number(),
		rawBody: v.string(),
	},
	handler: async (ctx, args) => {
		return ingestInboundMessage(createMessageStore(ctx.db), args);
	},
});

export const reserveOutbound = mutation({
	args: {
		source: v.literal(OUTBOUND_MESSAGE_SOURCE),
		idempotencyKey: v.string(),
		ticketId: v.id("tickets"),
		from: v.union(v.string(), v.null()),
		to: v.array(v.string()),
		subject: v.union(v.string(), v.null()),
		text: v.union(v.string(), v.null()),
		html: v.union(v.string(), v.null()),
		rawBody: v.string(),
		createdAt: v.number(),
	},
	handler: async (ctx, args) => {
		return reserveOutboundMessage(createOutboundMessageStore(ctx.db), args);
	},
});

export const finalizeOutbound = mutation({
	args: {
		messageId: v.id("messages"),
		providerMessageId: v.string(),
		sentAt: v.number(),
		rawBody: v.string(),
	},
	handler: async (ctx, args) => {
		return finalizeOutboundMessage(createOutboundMessageStore(ctx.db), args);
	},
});
