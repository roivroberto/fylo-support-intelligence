import { describe, expect, it, vi } from "vitest";
import {
	INBOUND_MESSAGE_SOURCE,
	type InboundMessageSeed,
	ingestInboundMessage,
	type MessageStore,
} from "../../messages";
import {
	backfillLegacyTicketWorkspaceIds,
	classifyAndRouteForWorkspaceAction,
	classifyAndRouteForWorkspaceInternal,
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
			workspaceId: "workspace_1",
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

describe("classifyAndRouteForWorkspaceInternal", () => {
	it("routes a ticket with the provided workspace without requiring auth", async () => {
		const ctx = {
			db: {
				get: vi
					.fn()
					.mockResolvedValueOnce({
						_id: "ticket_1",
						workspaceId: "workspace_1",
						messageId: "message_1",
						requesterEmail: "customer@example.com",
						subject: "Need billing help",
					})
					.mockResolvedValueOnce({
						_id: "message_1",
						text: "Please help with billing.",
					}),
				query: vi.fn((table: string) => {
					if (table === "policies") {
						return {
							withIndex: () => ({
								unique: async () => null,
							}),
						};
					}

					if (table === "memberships" || table === "agentProfiles" || table === "tickets") {
						return {
							withIndex: () => ({
								collect: async () => [],
							}),
							collect: async () => [],
						};
					}

					throw new Error(`Unexpected table query: ${table}`);
				}),
				patch: vi.fn(),
			},
		};

		const handler = (classifyAndRouteForWorkspaceInternal as any)._handler;
		expect(handler).toBeTypeOf("function");

		const result = await handler(ctx, {
			ticketId: "ticket_1",
			workspaceId: "workspace_1",
			classification: {
				request_type: "billing_issue",
				priority: "high",
				classification_confidence: 0.4,
			},
			generationSource: "deterministic",
			fallbackReason: null,
		});

		expect(ctx.db.patch).toHaveBeenCalledWith(
			"ticket_1",
			expect.objectContaining({
				requestType: "billing_issue",
				priority: "high",
				reviewState: "manual_triage",
				status: "reviewed",
			}),
		);
		expect(result.routingDecision.reviewState).toBe("manual_triage");
	});

	it("supports routing from an action context that lacks runAction on mutations", async () => {
		const ctx = {
			runQuery: vi.fn().mockResolvedValue({
				subject: "Need billing help",
				requesterEmail: "customer@example.com",
				messageText: "Please help with billing.",
			}),
			runAction: vi.fn().mockResolvedValue({
				classification: {
					request_type: "billing_issue",
					priority: "high",
					classification_confidence: 0.4,
				},
				generationSource: "deterministic",
				usedFallback: true,
				fallbackReason: null,
			}),
			runMutation: vi.fn().mockResolvedValue({
				classification: {
					request_type: "billing_issue",
					priority: "high",
					classification_confidence: 0.4,
				},
				classificationSource: "fallback",
				fallbackReason: null,
				routingDecision: {
					assignedWorkerId: null,
					reviewState: "manual_triage",
					routingReason: "Review required (manual_triage). No workers available for deterministic routing.",
					scoredCandidates: [],
				},
			}),
		};

		const handler = (classifyAndRouteForWorkspaceAction as any)._handler;
		expect(handler).toBeTypeOf("function");

		const result = await handler(ctx, {
			ticketId: "ticket_1",
			workspaceId: "workspace_1",
		});

		expect(ctx.runMutation).toHaveBeenCalledWith(expect.anything(), {
			ticketId: "ticket_1",
			workspaceId: "workspace_1",
			classification: {
				request_type: "billing_issue",
				priority: "high",
				classification_confidence: 0.4,
			},
			generationSource: "deterministic",
			fallbackReason: null,
		});
		expect(result.routingDecision.reviewState).toBe("manual_triage");
	});
});

describe("backfillLegacyTicketWorkspaceIds", () => {
	it("patches only tickets missing a workspace id", async () => {
		const ctx = {
			db: {
				query: vi.fn(() => ({
					collect: async () => [
						{ _id: "ticket_1", workspaceId: null },
						{ _id: "ticket_2" },
						{ _id: "ticket_3", workspaceId: "workspace_existing" },
					],
				})),
				patch: vi.fn(),
			},
		};

		const handler = (backfillLegacyTicketWorkspaceIds as any)._handler;
		expect(handler).toBeTypeOf("function");

		const result = await handler(ctx, { workspaceId: "workspace_1" });

		expect(ctx.db.patch).toHaveBeenCalledTimes(2);
		expect(ctx.db.patch).toHaveBeenNthCalledWith(1, "ticket_1", {
			workspaceId: "workspace_1",
		});
		expect(ctx.db.patch).toHaveBeenNthCalledWith(2, "ticket_2", {
			workspaceId: "workspace_1",
		});
		expect(result).toEqual({ patchedCount: 2 });
	});
});
