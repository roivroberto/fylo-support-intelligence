import { describe, expect, it } from "vitest";

import {
	finalizeOutboundMessage,
	type OutboundMessageRecord,
	type OutboundMessageReservationStore,
	reserveOutboundMessage,
} from "../../messages";

class InMemoryOutboundStore
	implements OutboundMessageReservationStore<string, string>
{
	private nextId = 1;
	private readonly messages = new Map<
		string,
		OutboundMessageRecord<string, string>
	>();

	async getByIdempotencyKey(idempotencyKey: string) {
		for (const message of this.messages.values()) {
			if (message.idempotencyKey === idempotencyKey) {
				return message;
			}
		}

		return null;
	}

	async insertReservation(
		seed: Omit<OutboundMessageRecord<string, string>, "_id">,
	) {
		const id = `message_${this.nextId++}`;
		this.messages.set(id, { ...seed, _id: id });
		return id;
	}

	async finalize(
		messageId: string,
		patch: Pick<
			OutboundMessageRecord<string, string>,
			| "deliveryStatus"
			| "externalId"
			| "providerMessageId"
			| "sentAt"
			| "rawBody"
		>,
	) {
		const current = this.messages.get(messageId);
		if (!current) {
			throw new Error("Message not found");
		}

		this.messages.set(messageId, { ...current, ...patch });
	}
	async get(messageId: string) {
		return this.messages.get(messageId) ?? null;
	}
}

describe("reserveOutboundMessage", () => {
	it("reuses an existing reservation by idempotency key", async () => {
		const store = new InMemoryOutboundStore();
		const seed = {
			source: "resend" as const,
			idempotencyKey: "outbound:t1",
			ticketId: "ticket_1",
			from: "ops@example.com",
			to: ["customer@example.com"],
			subject: "Refund request",
			text: "hello",
			html: "<p>hello</p>",
			rawBody: "{}",
			createdAt: 10,
		};

		const first = await reserveOutboundMessage(store, seed);
		const second = await reserveOutboundMessage(store, seed);
 		const stored = await store.get(first.messageId);

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.messageId).toBe(first.messageId);
		expect(second.deliveryStatus).toBe("pending");
		expect(stored?.sentAt).toBeUndefined();
	});
});

describe("finalizeOutboundMessage", () => {
	it("marks a reservation sent with the provider message id", async () => {
		const store = new InMemoryOutboundStore();
		const reserved = await reserveOutboundMessage(store, {
			source: "resend",
			idempotencyKey: "outbound:t1",
			ticketId: "ticket_1",
			from: "ops@example.com",
			to: ["customer@example.com"],
			subject: "Refund request",
			text: "hello",
			html: "<p>hello</p>",
			rawBody: "{}",
			createdAt: 10,
		});

		const finalized = await finalizeOutboundMessage(store, {
			messageId: reserved.messageId,
			providerMessageId: "msg_123",
			sentAt: 20,
			rawBody: '{"id":"msg_123"}',
		});

		expect(finalized.deliveryStatus).toBe("sent");
		expect(finalized.providerMessageId).toBe("msg_123");

		const stored = await store.get(reserved.messageId);
		expect(stored?.externalId).toBe("msg_123");
		expect(stored?.deliveryStatus).toBe("sent");
	});
});
