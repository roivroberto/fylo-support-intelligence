import { describe, expect, it, vi } from "vitest";

import {
	claimStoredDraftGeneration,
	completeStoredDraftGeneration,
	ensureStoredDraft,
	ensureDraftHandler,
	getDraftGenerationInputReference,
	getTicketDraftReference,
	releaseStoredDraftGeneration,
	regenerateStoredDraft,
	type PersistedDraftReply,
	type StoredDraftGenerationClaimStore,
	type StoredDraftStore,
} from "../../drafts";
import type { GenerateDraftReplyResult } from "../../ai/generate_draft_reply";

class InMemoryDraftClaimStore implements StoredDraftGenerationClaimStore {
	protected readonly records = new Map<
		string,
		| PersistedDraftReply
		| {
				status: "pending";
				ticketId: string;
				claimToken: string;
				claimExpiresAt: number;
		  }
	>();

	async getByTicketId(ticketId: string) {
		const record = this.records.get(ticketId) ?? null;
		return record && "status" in record ? null : record;
	}

	async claim(ticketId: string, claimToken: string, now: number, claimExpiresAt: number) {
		const existing = this.records.get(ticketId);

		if (existing && !("status" in existing)) {
			return { status: "ready" as const, draft: existing };
		}

		if (
			existing &&
			"status" in existing &&
			existing.claimExpiresAt > now
		) {
			return {
				status: "pending" as const,
				claimExpiresAt: existing.claimExpiresAt,
			};
		}

		this.records.set(ticketId, {
			status: "pending",
			ticketId,
			claimToken,
			claimExpiresAt,
		});

		return { status: "claimed" as const, claimToken, claimExpiresAt };
	}

	async complete(claimToken: string, draft: PersistedDraftReply) {
		const existing = this.records.get(draft.ticketId);

		if (!existing || !("status" in existing) || existing.claimToken !== claimToken) {
			const ready = this.records.get(draft.ticketId);
			return ready && !("status" in ready)
				? { status: "ready" as const, draft: ready }
				: { status: "stale" as const };
		}

		this.records.set(draft.ticketId, draft);
		return { status: "ready" as const, draft };
	}

	async release(ticketId: string, claimToken: string) {
		const existing = this.records.get(ticketId);
		if (existing && "status" in existing && existing.claimToken === claimToken) {
			this.records.delete(ticketId);
		}
	}
}

class InMemoryDraftStore
	extends InMemoryDraftClaimStore
	implements StoredDraftStore
{
	async save(draft: PersistedDraftReply) {
		this.records.set(draft.ticketId, draft);
		return draft;
	}
}

const seedTicket = {
	ticketId: "ticket_1",
	subject: "Refund request",
	requesterEmail: "customer@example.com",
	messageText: "I was charged twice and need a refund.",
};

async function flushAsyncWork() {
	await new Promise((resolve) => setTimeout(resolve, 0));
}

function buildGeneratedDraft(
	input: Partial<GenerateDraftReplyResult> & {
		summary: string;
		recommendedAction: string;
		draftReply: string;
	},
): GenerateDraftReplyResult {
	return {
		draft: {
			summary: input.summary,
			recommended_action: input.recommendedAction,
			draft_reply: input.draftReply,
		},
		generationSource: input.generationSource ?? "provider",
		usedFallback: input.usedFallback ?? false,
		fallbackReason: input.fallbackReason ?? null,
	};
}

describe("draft persistence helpers", () => {
	it("returns the stored draft on subsequent ensure calls", async () => {
		const store = new InMemoryDraftStore();
		const generateA = vi.fn(async () =>
			buildGeneratedDraft({
				summary: "First stored summary for the refund request.",
				recommendedAction:
					"Confirm the duplicate charge and send the approved refund update.",
				draftReply:
					"Hi customer@example.com,\n\nWe confirmed the duplicate charge and are processing the refund now.\n\nBest,\nOperations",
			}),
		);
		const generateB = vi.fn(async () =>
			buildGeneratedDraft({
				summary: "Second summary that should never be persisted.",
				recommendedAction: "Do not use this replacement recommendation.",
				draftReply: "This regenerated text should never be returned.",
			}),
		);

		const first = await ensureStoredDraft(store, seedTicket, generateA, () => 1000);
		const second = await ensureStoredDraft(store, seedTicket, generateB, () => 2000);

		expect(generateA).toHaveBeenCalledOnce();
		expect(generateB).not.toHaveBeenCalled();
		expect(second).toEqual(first);
		expect(second).toMatchObject({
			summary: "First stored summary for the refund request.",
			recommendedAction:
				"Confirm the duplicate charge and send the approved refund update.",
			draftReply:
				"Hi customer@example.com,\n\nWe confirmed the duplicate charge and are processing the refund now.\n\nBest,\nOperations",
			generationSource: "provider",
			usedFallback: false,
			fallbackReason: null,
			generatedAt: 1000,
			generatedAtLabel: "AI generated draft",
		});
	});

	it("coalesces concurrent ensure calls into a single generation", async () => {
		const store = new InMemoryDraftStore();
		let finishGeneration!: (value: GenerateDraftReplyResult) => void;
		const generationPromise = new Promise<GenerateDraftReplyResult>((resolve) => {
			finishGeneration = resolve;
		});
		const generate = vi.fn(() => generationPromise);

		const first = ensureStoredDraft(store, seedTicket, generate, () => 1000);
		const second = ensureStoredDraft(store, seedTicket, generate, () => 2000);
		await flushAsyncWork();

		expect(generate).toHaveBeenCalledTimes(1);

		finishGeneration(
			buildGeneratedDraft({
				summary: "Shared summary for concurrent ensure requests.",
				recommendedAction:
					"Confirm the duplicate charge and send one shared update.",
				draftReply:
					"Hi customer@example.com,\n\nWe confirmed the duplicate charge and are sending one shared update now.\n\nBest,\nOperations",
			}),
		);

		const [firstResult, secondResult] = await Promise.all([first, second]);

		expect(firstResult).toEqual(secondResult);
		expect(firstResult.generatedAt).toBe(1000);
	});

	it("prevents a stale claim from overwriting a newer finalized draft", async () => {
		const store = new InMemoryDraftClaimStore();

		const firstClaim = await claimStoredDraftGeneration(store, {
			ticketId: seedTicket.ticketId,
			claimToken: "claim-1",
			now: 100,
			claimTtlMs: 25,
		});
		const secondClaim = await claimStoredDraftGeneration(store, {
			ticketId: seedTicket.ticketId,
			claimToken: "claim-2",
			now: 200,
			claimTtlMs: 25,
		});

		expect(firstClaim.status).toBe("claimed");
		expect(secondClaim.status).toBe("claimed");

		const finalized = await completeStoredDraftGeneration(store, {
			claimToken: "claim-2",
			draft: {
				ticketId: seedTicket.ticketId,
				summary: "Fresh finalized draft",
				recommendedAction: "Use the newer completed draft.",
				draftReply: "Use the newer completed draft.",
				generationSource: "provider",
				usedFallback: false,
				fallbackReason: null,
				generatedAt: 220,
			},
		});
		const staleResult = await completeStoredDraftGeneration(store, {
			claimToken: "claim-1",
			draft: {
				ticketId: seedTicket.ticketId,
				summary: "Stale draft",
				recommendedAction: "Do not use this stale draft.",
				draftReply: "Do not use this stale draft.",
				generationSource: "provider",
				usedFallback: false,
				fallbackReason: null,
				generatedAt: 230,
			},
		});

		expect(finalized.status).toBe("ready");
		expect(staleResult).toEqual(finalized);
	});

	it("releases an active claim after generation failure", async () => {
		const store = new InMemoryDraftClaimStore();

		await claimStoredDraftGeneration(store, {
			ticketId: seedTicket.ticketId,
			claimToken: "claim-1",
			now: 100,
			claimTtlMs: 25,
		});
		await releaseStoredDraftGeneration(store, {
			ticketId: seedTicket.ticketId,
			claimToken: "claim-1",
		});

		const reclaimed = await claimStoredDraftGeneration(store, {
			ticketId: seedTicket.ticketId,
			claimToken: "claim-2",
			now: 110,
			claimTtlMs: 25,
		});

		expect(reclaimed.status).toBe("claimed");
	});

	it("replaces the stored draft when regenerate is requested", async () => {
		const store = new InMemoryDraftStore();
		const generateInitial = vi.fn(async () =>
			buildGeneratedDraft({
				summary: "Initial stored summary for the refund request.",
				recommendedAction:
					"Confirm the duplicate charge before sending the update.",
				draftReply:
					"Hi customer@example.com,\n\nWe are reviewing the duplicate charge now.\n\nBest,\nOperations",
				generationSource: "deterministic",
				usedFallback: true,
				fallbackReason: "generator_error",
			}),
		);
		const generateReplacement = vi.fn(async () =>
			buildGeneratedDraft({
				summary: "Replacement summary after the agent requested regeneration.",
				recommendedAction:
					"Send the updated refund timeline and confirm the reversal window.",
				draftReply:
					"Hi customer@example.com,\n\nI regenerated the reply with the latest refund timeline and will confirm once the reversal completes.\n\nBest,\nOperations",
			}),
		);

		await ensureStoredDraft(store, seedTicket, generateInitial, () => 1000);
		const regenerated = await regenerateStoredDraft(
			store,
			seedTicket,
			generateReplacement,
			() => 2000,
		);

		expect(generateInitial).toHaveBeenCalledOnce();
		expect(generateReplacement).toHaveBeenCalledOnce();
		expect(regenerated).toMatchObject({
			summary: "Replacement summary after the agent requested regeneration.",
			recommendedAction:
				"Send the updated refund timeline and confirm the reversal window.",
			draftReply:
				"Hi customer@example.com,\n\nI regenerated the reply with the latest refund timeline and will confirm once the reversal completes.\n\nBest,\nOperations",
			generationSource: "provider",
			usedFallback: false,
			fallbackReason: null,
			generatedAt: 2000,
			generatedAtLabel: "AI generated draft",
		});
	});

	it("throws when the ticket is missing during ensure", async () => {
		await expect(
			ensureDraftHandler(
				{
					runQuery: vi.fn(async (reference: unknown) => {
						if (reference === getTicketDraftReference) {
							return null;
						}

						if (reference === getDraftGenerationInputReference) {
							return null;
						}

						throw new Error("Unexpected query reference");
					}),
					runAction: vi.fn(),
					runMutation: vi.fn(),
				} as never,
				{ ticketId: "ticket_1" },
			),
		).rejects.toThrow("Ticket not found");
	});

	it("coalesces concurrent handler ensure calls into one generation", async () => {
		const store = new InMemoryDraftStore();
		let finishGeneration!: (value: GenerateDraftReplyResult) => void;
		const generationPromise = new Promise<GenerateDraftReplyResult>((resolve) => {
			finishGeneration = resolve;
		});

		const ctx = {
			runQuery: vi.fn(async (reference: unknown) => {
				if (reference === getTicketDraftReference) {
					const storedDraft = await store.getByTicketId(seedTicket.ticketId);
					return storedDraft
						? {
							...storedDraft,
							generatedAtLabel: "AI generated draft",
						}
						: null;
				}

				if (reference === getDraftGenerationInputReference) {
					return seedTicket;
				}

			throw new Error("Unexpected query reference");
			}),
			runAction: vi.fn(() => generationPromise),
			runMutation: vi.fn(async (_reference: unknown, args: any) => {
				if (
					typeof args?.claimToken === "string" &&
					typeof args?.claimTtlMs === "number"
				) {
					return store.claim(
						args.ticketId,
						args.claimToken,
						args.now,
						args.now + args.claimTtlMs,
					);
				}

				if (
					typeof args?.claimToken === "string" &&
					typeof args?.summary === "string"
				) {
					const completed = await store.complete(args.claimToken, args);
					return completed.status === "ready"
						? {
							...completed,
							draft: {
								...completed.draft,
								generatedAtLabel: "AI generated draft",
							},
						}
						: completed;
				}

				if (
					typeof args?.claimToken === "string" &&
					typeof args?.ticketId === "string"
				) {
					await store.release(args.ticketId, args.claimToken);
					return null;
				}

				throw new Error("Unexpected mutation payload");
			}),
		};

		const first = ensureDraftHandler(ctx as never, { ticketId: "ticket_1" });
		const second = ensureDraftHandler(ctx as never, { ticketId: "ticket_1" });
		await flushAsyncWork();

		expect(ctx.runAction).toHaveBeenCalledTimes(1);

		finishGeneration(
			buildGeneratedDraft({
				summary: "Shared generated summary from one handler invocation.",
				recommendedAction:
					"Send one consistent reply after the shared generation completes.",
				draftReply:
					"Hi customer@example.com,\n\nThis draft was generated once and reused for both requests.\n\nBest,\nOperations",
			}),
		);

		const [firstResult, secondResult] = await Promise.all([first, second]);

		expect(ctx.runAction).toHaveBeenCalledTimes(1);
		expect(ctx.runMutation).toHaveBeenCalledTimes(3);
		expect(firstResult).toEqual(secondResult);
	});
});
