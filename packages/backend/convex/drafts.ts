import {
	actionGeneric as action,
	makeFunctionReference,
	mutationGeneric as mutation,
	queryGeneric as query,
} from "convex/server";
import { ConvexError, v } from "convex/values";
import {
	type DraftGenerationSource,
	type GenerateDraftReplyInput,
	type GenerateDraftReplyResult,
	getDraftGeneratedLabel,
} from "./ai/generate_draft_reply";
import { authComponent } from "./auth";
import { canAccessOperationalCorePilot } from "./tickets";

export type PersistedDraftReply = {
	ticketId: string;
	summary: string;
	recommendedAction: string;
	draftReply: string;
	generationSource: DraftGenerationSource;
	usedFallback: boolean;
	fallbackReason: "generator_error" | "invalid_schema" | null;
	generatedAt: number;
};

export type TicketDraftWorkspace = PersistedDraftReply & {
	generatedAtLabel: string;
};

export type StoredDraftStore = {
	getByTicketId(ticketId: string): Promise<PersistedDraftReply | null>;
	claim(
		ticketId: string,
		claimToken: string,
		now: number,
		claimExpiresAt: number,
	): Promise<StoredDraftGenerationClaimResult>;
	complete(
		claimToken: string,
		draft: PersistedDraftReply,
	): Promise<StoredDraftGenerationCompleteResult>;
	release(ticketId: string, claimToken: string): Promise<void>;
	save(draft: PersistedDraftReply): Promise<PersistedDraftReply>;
};

export type StoredDraftGenerationClaimResult =
	| {
			status: "ready";
			draft: PersistedDraftReply;
	  }
	| {
			status: "pending";
			claimExpiresAt: number;
	  }
	| {
			status: "claimed";
			claimToken: string;
			claimExpiresAt: number;
	  };

export type StoredDraftGenerationCompleteResult =
	| {
			status: "ready";
			draft: PersistedDraftReply;
	  }
	| {
			status: "stale";
	  };

export type StoredDraftGenerationClaimStore = Pick<
	StoredDraftStore,
	"getByTicketId" | "claim" | "complete" | "release"
>;

export const getTicketDraftReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	TicketDraftWorkspace | null
>("drafts:getForTicket");

export const getDraftGenerationInputReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	GenerateDraftReplyInput | null
>("drafts:getGenerationInput");

const upsertTicketDraftReference = makeFunctionReference<
	"mutation",
	PersistedDraftReply,
	TicketDraftWorkspace
>("drafts:upsertForTicket");

const claimTicketDraftGenerationReference = makeFunctionReference<
	"mutation",
	{
		ticketId: string;
		claimToken: string;
		now: number;
		claimTtlMs: number;
	},
	StoredDraftGenerationClaimResult
>("drafts:claimGenerationForTicket");

const completeTicketDraftGenerationReference = makeFunctionReference<
	"mutation",
	{
		claimToken: string;
		ticketId: string;
		summary: string;
		recommendedAction: string;
		draftReply: string;
		generationSource: DraftGenerationSource;
		usedFallback: boolean;
		fallbackReason: "generator_error" | "invalid_schema" | null;
		generatedAt: number;
	},
	StoredDraftGenerationCompleteResult
>("drafts:completeGenerationForTicket");

const releaseTicketDraftGenerationReference = makeFunctionReference<
	"mutation",
	{ ticketId: string; claimToken: string },
	null
>("drafts:releaseGenerationForTicket");

const generateDraftReplyReference = makeFunctionReference<
	"action",
	GenerateDraftReplyInput,
	GenerateDraftReplyResult
>("ai/generate_draft_reply:generateDraftReply");

export const ensureTicketDraftReference = makeFunctionReference<
	"action",
	{ ticketId: string },
	TicketDraftWorkspace
>("drafts:ensureForTicket");

export const regenerateTicketDraftReference = makeFunctionReference<
	"action",
	{ ticketId: string },
	TicketDraftWorkspace
>("drafts:regenerateForTicket");

const DRAFT_GENERATION_CLAIM_TTL_MS = 30_000;
const DRAFT_GENERATION_POLL_MS = 25;
const DRAFT_GENERATION_WAIT_TIMEOUT_MS = 35_000;

async function sleep(ms: number) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildTicketDraftWorkspace(
	draft: PersistedDraftReply,
): TicketDraftWorkspace {
	return {
		...draft,
		generatedAtLabel: getDraftGeneratedLabel({
			generationSource: draft.generationSource,
			usedFallback: draft.usedFallback,
		}),
	};
}

function normalizeGeneratedDraft(
	ticketId: string,
	generated: GenerateDraftReplyResult,
	generatedAt: number,
): PersistedDraftReply {
	return {
		ticketId,
		summary: generated.draft.summary,
		recommendedAction: generated.draft.recommended_action,
		draftReply: generated.draft.draft_reply,
		generationSource: generated.generationSource,
		usedFallback: generated.usedFallback,
		fallbackReason: generated.fallbackReason,
		generatedAt,
	};
}

export async function ensureStoredDraft(
	store: StoredDraftStore,
	input: GenerateDraftReplyInput,
	generateDraft: (input: GenerateDraftReplyInput) => Promise<GenerateDraftReplyResult>,
	now: () => number = Date.now,
) {
	const waitDeadline = Date.now() + DRAFT_GENERATION_WAIT_TIMEOUT_MS;

	while (Date.now() <= waitDeadline) {
		const claim = await claimStoredDraftGeneration(store, {
			ticketId: input.ticketId,
			claimToken: crypto.randomUUID(),
			now: Date.now(),
			claimTtlMs: DRAFT_GENERATION_CLAIM_TTL_MS,
		});

		if (claim.status === "ready") {
			return buildTicketDraftWorkspace(claim.draft);
		}

		if (claim.status === "claimed") {
			try {
				const completed = await completeStoredDraftGeneration(store, {
					claimToken: claim.claimToken,
					draft: normalizeGeneratedDraft(
						input.ticketId,
						await generateDraft(input),
						now(),
					),
				});

				if (completed.status === "ready") {
					return buildTicketDraftWorkspace(completed.draft);
				}
			} catch (error) {
				await releaseStoredDraftGeneration(store, {
					ticketId: input.ticketId,
					claimToken: claim.claimToken,
				});
				throw error;
			}
		} else {
			const waitMs = Math.max(
				1,
				Math.min(claim.claimExpiresAt - Date.now(), DRAFT_GENERATION_POLL_MS),
			);
			await sleep(waitMs);
		}
	}

	throw new ConvexError("Draft generation already in progress");
}

export async function regenerateStoredDraft(
	store: StoredDraftStore,
	input: GenerateDraftReplyInput,
	generateDraft: (input: GenerateDraftReplyInput) => Promise<GenerateDraftReplyResult>,
	now: () => number = Date.now,
) {
	const saved = await store.save(
		normalizeGeneratedDraft(input.ticketId, await generateDraft(input), now()),
	);

	return buildTicketDraftWorkspace(saved);
}

async function requireCurrentUser(ctx: any) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError("Unauthenticated");
	}

	return user;
}

async function requireOperationalCoreAccess(ctx: any) {
	const user = await requireCurrentUser(ctx);
	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_userId", (q: any) => q.eq("userId", String(user._id)))
		.collect();

	if (!canAccessOperationalCorePilot(memberships)) {
		throw new ConvexError("Forbidden");
	}
}

function createStoredDraftStore(db: any): StoredDraftStore {
	return {
		getByTicketId: async (ticketId) => {
			const stored = await db
				.query("draftReplies")
				.withIndex("by_ticketId", (q: any) => q.eq("ticketId", ticketId))
				.unique();

			if (!stored || stored.generationStatus === "pending") {
				return null;
			}

			return {
				ticketId: String(stored.ticketId),
				summary: stored.summary,
				recommendedAction: stored.recommendedAction,
				draftReply: stored.draftReply,
				generationSource: stored.generationSource,
				usedFallback: stored.usedFallback,
				fallbackReason: stored.fallbackReason,
				generatedAt: stored.generatedAt,
			};
		},
		claim: async (ticketId, claimToken, now, claimExpiresAt) => {
			const existing = await db
				.query("draftReplies")
				.withIndex("by_ticketId", (q: any) => q.eq("ticketId", ticketId))
				.unique();

			if (existing && existing.generationStatus !== "pending") {
				return {
					status: "ready" as const,
					draft: {
						ticketId: String(existing.ticketId),
						summary: existing.summary,
						recommendedAction: existing.recommendedAction,
						draftReply: existing.draftReply,
						generationSource: existing.generationSource,
						usedFallback: existing.usedFallback,
						fallbackReason: existing.fallbackReason,
						generatedAt: existing.generatedAt,
					},
				};
			}

			if (
				existing &&
				existing.generationStatus === "pending" &&
				typeof existing.claimExpiresAt === "number" &&
				existing.claimExpiresAt > now
			) {
				return {
					status: "pending" as const,
					claimExpiresAt: existing.claimExpiresAt,
				};
			}

			if (existing) {
				await db.patch(existing._id, {
					generationStatus: "pending",
					claimToken,
					claimExpiresAt,
				});
			} else {
				await db.insert("draftReplies", {
					ticketId,
					summary: "",
					recommendedAction: "",
					draftReply: "",
					generationSource: "deterministic",
					usedFallback: false,
					fallbackReason: null,
					generatedAt: now,
					generationStatus: "pending",
					claimToken,
					claimExpiresAt,
				});
			}

			return {
				status: "claimed" as const,
				claimToken,
				claimExpiresAt,
			};
		},
		complete: async (claimToken, draft) => {
			const existing = await db
				.query("draftReplies")
				.withIndex("by_ticketId", (q: any) => q.eq("ticketId", draft.ticketId))
				.unique();

			if (!existing) {
				return { status: "stale" as const };
			}

			if (existing.generationStatus !== "pending") {
				return {
					status: "ready" as const,
					draft: {
						ticketId: String(existing.ticketId),
						summary: existing.summary,
						recommendedAction: existing.recommendedAction,
						draftReply: existing.draftReply,
						generationSource: existing.generationSource,
						usedFallback: existing.usedFallback,
						fallbackReason: existing.fallbackReason,
						generatedAt: existing.generatedAt,
					},
				};
			}

			if (existing.claimToken !== claimToken) {
				return { status: "stale" as const };
			}

			await db.replace(existing._id, {
				...draft,
				generationStatus: "ready",
			});

			return {
				status: "ready" as const,
				draft,
			};
		},
		release: async (ticketId, claimToken) => {
			const existing = await db
				.query("draftReplies")
				.withIndex("by_ticketId", (q: any) => q.eq("ticketId", ticketId))
				.unique();

			if (
				existing &&
				existing.generationStatus === "pending" &&
				existing.claimToken === claimToken
			) {
				await db.delete(existing._id);
			}
		},
		save: async (draft) => {
			const existing = await db
				.query("draftReplies")
				.withIndex("by_ticketId", (q: any) => q.eq("ticketId", draft.ticketId))
				.unique();

			if (existing) {
				await db.replace(existing._id, {
					...draft,
					generationStatus: "ready",
				});
			} else {
				await db.insert("draftReplies", {
					...draft,
					generationStatus: "ready",
				});
			}

			return draft;
		},
	};
}

export const getForTicket = query({
	args: {
		ticketId: v.id("tickets"),
	},
	handler: async (ctx, args) => {
		await requireOperationalCoreAccess(ctx);

		const stored = await createStoredDraftStore(ctx.db).getByTicketId(
			String(args.ticketId),
		);

		return stored ? buildTicketDraftWorkspace(stored) : null;
	},
});

export const getGenerationInput = query({
	args: {
		ticketId: v.id("tickets"),
	},
	handler: async (ctx, args) => {
		await requireOperationalCoreAccess(ctx);

		const ticket = await ctx.db.get(args.ticketId);

		if (!ticket) {
			return null;
		}

		const message = await ctx.db.get(ticket.messageId);

		return {
			ticketId: String(ticket._id),
			subject: ticket.subject,
			requesterEmail: ticket.requesterEmail,
			messageText: message?.text ?? null,
		};
	},
});

export const upsertForTicket = mutation({
	args: {
		ticketId: v.id("tickets"),
		summary: v.string(),
		recommendedAction: v.string(),
		draftReply: v.string(),
		generationSource: v.union(v.literal("provider"), v.literal("deterministic")),
		usedFallback: v.boolean(),
		fallbackReason: v.union(
			v.literal("generator_error"),
			v.literal("invalid_schema"),
			v.null(),
		),
		generatedAt: v.number(),
	},
	handler: async (ctx, args) => {
		await requireOperationalCoreAccess(ctx);
		const saved = await createStoredDraftStore(ctx.db).save({
			...args,
			ticketId: String(args.ticketId),
		});

		return buildTicketDraftWorkspace(saved);
	},
});

export async function claimStoredDraftGeneration(
	store: StoredDraftGenerationClaimStore,
	input: {
		ticketId: string;
		claimToken: string;
		now: number;
		claimTtlMs: number;
	},
) {
	const ready = await store.getByTicketId(input.ticketId);

	if (ready) {
		return {
			status: "ready" as const,
			draft: ready,
		};
	}

	return store.claim(
		input.ticketId,
		input.claimToken,
		input.now,
		input.now + input.claimTtlMs,
	);
}

export async function completeStoredDraftGeneration(
	store: StoredDraftGenerationClaimStore,
	input: {
		claimToken: string;
		draft: PersistedDraftReply;
	},
) {
	return store.complete(input.claimToken, input.draft);
}

export async function releaseStoredDraftGeneration(
	store: StoredDraftGenerationClaimStore,
	input: { ticketId: string; claimToken: string },
) {
	await store.release(input.ticketId, input.claimToken);
}

async function loadGenerationInputOrThrow(ctx: any, ticketId: string) {
	const input = await ctx.runQuery(getDraftGenerationInputReference, { ticketId });

	if (!input) {
		throw new ConvexError("Ticket not found");
	}

	return input;
}

export async function ensureDraftHandler(ctx: any, args: { ticketId: string }) {
	return ensureStoredDraft(
		{
			getByTicketId: async (ticketId) =>
				(await ctx.runQuery(getTicketDraftReference, { ticketId })) ?? null,
			claim: (ticketId, claimToken, now, claimExpiresAt) =>
				ctx.runMutation(claimTicketDraftGenerationReference, {
					ticketId,
					claimToken,
					now,
					claimTtlMs: claimExpiresAt - now,
				}),
			complete: (claimToken, draft) =>
				ctx.runMutation(completeTicketDraftGenerationReference, {
					claimToken,
					...draft,
				}),
			release: (ticketId, claimToken) =>
				ctx.runMutation(releaseTicketDraftGenerationReference, {
					ticketId,
					claimToken,
				}),
			save: (draft) => ctx.runMutation(upsertTicketDraftReference, draft),
		},
		await loadGenerationInputOrThrow(ctx, args.ticketId),
		(generationInput) => ctx.runAction(generateDraftReplyReference, generationInput),
		() => Date.now(),
	);
}

export async function regenerateDraftHandler(
	ctx: any,
	args: { ticketId: string },
) {
	const generated = await ctx.runAction(
		generateDraftReplyReference,
		await loadGenerationInputOrThrow(ctx, args.ticketId),
	);

	return ctx.runMutation(
		upsertTicketDraftReference,
		normalizeGeneratedDraft(args.ticketId, generated, Date.now()),
	);
}

export const ensureForTicket = action({
	args: {
		ticketId: v.id("tickets"),
	},
	handler: async (ctx, args) => ensureDraftHandler(ctx, { ticketId: String(args.ticketId) }),
});

export const claimGenerationForTicket = mutation({
	args: {
		ticketId: v.id("tickets"),
		claimToken: v.string(),
		now: v.number(),
		claimTtlMs: v.number(),
	},
	handler: async (ctx, args) => {
		await requireOperationalCoreAccess(ctx);
		return createStoredDraftStore(ctx.db).claim(
			String(args.ticketId),
			args.claimToken,
			args.now,
			args.now + args.claimTtlMs,
		);
	},
});

export const completeGenerationForTicket = mutation({
	args: {
		claimToken: v.string(),
		ticketId: v.id("tickets"),
		summary: v.string(),
		recommendedAction: v.string(),
		draftReply: v.string(),
		generationSource: v.union(v.literal("provider"), v.literal("deterministic")),
		usedFallback: v.boolean(),
		fallbackReason: v.union(
			v.literal("generator_error"),
			v.literal("invalid_schema"),
			v.null(),
		),
		generatedAt: v.number(),
	},
	handler: async (ctx, args) => {
		await requireOperationalCoreAccess(ctx);
		return createStoredDraftStore(ctx.db).complete(args.claimToken, {
			ticketId: String(args.ticketId),
			summary: args.summary,
			recommendedAction: args.recommendedAction,
			draftReply: args.draftReply,
			generationSource: args.generationSource,
			usedFallback: args.usedFallback,
			fallbackReason: args.fallbackReason,
			generatedAt: args.generatedAt,
		});
	},
});

export const releaseGenerationForTicket = mutation({
	args: {
		ticketId: v.id("tickets"),
		claimToken: v.string(),
	},
	handler: async (ctx, args) => {
		await requireOperationalCoreAccess(ctx);
		await createStoredDraftStore(ctx.db).release(
			String(args.ticketId),
			args.claimToken,
		);
		return null;
	},
});

export const regenerateForTicket = action({
	args: {
		ticketId: v.id("tickets"),
	},
	handler: async (ctx, args) =>
		regenerateDraftHandler(ctx, { ticketId: String(args.ticketId) }),
});
