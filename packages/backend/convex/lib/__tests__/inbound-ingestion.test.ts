import { describe, expect, it } from "vitest";
import {
	INBOUND_MESSAGE_SOURCE,
	type InboundMessageSeed,
	ingestInboundMessage,
	type MessageStore,
} from "../../messages";
import {
	INBOUND_TICKET_SOURCE,
	type InboundTicketSeed,
	ingestInboundTicket,
	type TicketStore,
} from "../../tickets";

class InMemoryMessageStore implements MessageStore<string> {
	private nextId = 1;
	private readonly messages = new Map<
		string,
		InboundMessageSeed & { _id: string }
	>();

	async getByIdempotencyKey(idempotencyKey: string) {
		for (const message of this.messages.values()) {
			if (message.idempotencyKey === idempotencyKey) {
				return message;
			}
		}

		return null;
	}

	async insert(seed: InboundMessageSeed) {
		const id = `message_${this.nextId++}`;
		this.messages.set(id, { ...seed, _id: id });
		return id;
	}
}

class InMemoryTicketStore implements TicketStore<string, string> {
	private nextId = 1;
	private readonly tickets = new Map<
		string,
		InboundTicketSeed<string> & { _id: string }
	>();

	async getByExternalId(source: string, externalId: string) {
		for (const ticket of this.tickets.values()) {
			if (ticket.source === source && ticket.externalId === externalId) {
				return ticket;
			}
		}

		return null;
	}

	async insert(seed: InboundTicketSeed<string>) {
		const id = `ticket_${this.nextId++}`;
		this.tickets.set(id, { ...seed, _id: id });
		return id;
	}
}

describe("ingestInboundMessage", () => {
	it("deduplicates inbound messages by idempotency key", async () => {
		const store = new InMemoryMessageStore();
		const seed: InboundMessageSeed = {
			source: INBOUND_MESSAGE_SOURCE,
			externalId: "email_123",
			idempotencyKey: "resend:evt_123",
			from: "agent@example.com",
			to: ["support@example.com"],
			subject: "Hello",
			text: "Plain text",
			html: null,
			receivedAt: 1,
			rawBody: "{}",
		};

		const first = await ingestInboundMessage(store, seed);
		const second = await ingestInboundMessage(store, seed);

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.messageId).toBe(first.messageId);
	});
});

describe("ingestInboundTicket", () => {
	it("deduplicates inbound tickets by source and external id", async () => {
		const store = new InMemoryTicketStore();
		const seed: InboundTicketSeed<string> = {
			source: INBOUND_TICKET_SOURCE,
			externalId: "email_123",
			messageId: "message_1",
			requesterEmail: "agent@example.com",
			subject: "Hello",
			receivedAt: 1,
		};

		const first = await ingestInboundTicket(store, seed);
		const second = await ingestInboundTicket(store, seed);

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.ticketId).toBe(first.ticketId);
	});
});
