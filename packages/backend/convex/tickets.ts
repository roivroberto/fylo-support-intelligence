import {
	makeFunctionReference,
	mutationGeneric as mutation,
	queryGeneric as query,
} from "convex/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";
import type {
	ClassifyTicketInput,
	ClassifyTicketResult,
} from "./ai/classify_ticket";
import { FALLBACK_TICKET_CLASSIFICATION } from "./lib/classification_schema";
import type { ApplyLeadReviewDecisionResult } from "./lib/review_workflow";
import type { RoutingDecision } from "./lib/routing/types";
import type { ReviewState } from "./lib/routing_thresholds";

export const INBOUND_TICKET_SOURCE = "resend" as const;

export type TicketStatus = "new" | "reviewed" | "assigned";

export type TicketDetailNote = {
	id: string;
	body: string;
	authorLabel: string;
	createdAtLabel: string;
};

export type TicketDetailWorkspace = {
	id: string;
	title?: string;
	requesterEmail?: string;
	reviewState: string;
	status: string;
	routingReason?: string;
	assignedWorkerLabel: string;
	assignmentContext: string;
	notes: TicketDetailNote[];
};

export type InboundTicketSeed<MessageId = string> = {
	source: typeof INBOUND_TICKET_SOURCE;
	externalId: string;
	messageId: MessageId;
	requesterEmail: string | null;
	subject: string | null;
	receivedAt: number;
};

export type TicketStore<TicketId, MessageId> = {
	getByExternalId(
		source: InboundTicketSeed<MessageId>["source"],
		externalId: string,
	): Promise<{ _id: TicketId } | null>;
	insert(seed: InboundTicketSeed<MessageId>): Promise<TicketId>;
};

export const classifyTicketReference = makeFunctionReference<
	"action",
	ClassifyTicketInput,
	ClassifyTicketResult
>("ai/classify_ticket:classifyTicket");

export const getTicketDetailReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	TicketDetailWorkspace | null
>("tickets:getDetail");

export function canAccessOperationalCorePilot(memberships: unknown[]) {
	return memberships.length > 0;
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

function formatRelativeTimeLabel(createdAt: number, now: number) {
	const elapsedMs = Math.max(0, now - createdAt);
	const elapsedMinutes = Math.floor(elapsedMs / 60000);

	if (elapsedMinutes < 1) {
		return "just now";
	}

	if (elapsedMinutes < 60) {
		return `${elapsedMinutes}m ago`;
	}

	const elapsedHours = Math.floor(elapsedMinutes / 60);

	if (elapsedHours < 24) {
		return `${elapsedHours}h ago`;
	}

	return `${Math.floor(elapsedHours / 24)}d ago`;
}

function buildAssignmentContext(ticket: {
	assignedWorkerId?: string | null;
	reviewState?: string | null;
	status?: string | null;
	routingReason?: string | null;
}) {
	if (ticket.assignedWorkerId) {
		return `Assigned to ${ticket.assignedWorkerId} based on the current routing decision.`;
	}

	if (ticket.reviewState === "manager_verification") {
		return "Pending manager verification before final ownership is confirmed.";
	}

	if (ticket.reviewState === "manual_triage") {
		return "Manual triage is still needed to choose the right owner.";
	}

	if (ticket.status === "assigned") {
		return "Assignment is recorded, but the worker label is still unavailable.";
	}

	return "Ready for routing once ownership is confirmed.";
}

export function buildTicketDetailWorkspace(input: {
	ticket: {
		_id: string;
		subject?: string | null;
		requesterEmail?: string | null;
		reviewState?: string | null;
		status?: string | null;
		routingReason?: string | null;
		assignedWorkerId?: string | null;
	};
	notes: Array<{
		_id: string;
		body: string;
		authorLabel: string;
		createdAt: number;
	}>;
	now: number;
}): TicketDetailWorkspace {
	return {
		id: input.ticket._id,
		title: input.ticket.subject ?? undefined,
		requesterEmail: input.ticket.requesterEmail ?? undefined,
		reviewState: input.ticket.reviewState ?? "manual_triage",
		status: input.ticket.status ?? "new",
		routingReason: input.ticket.routingReason ?? undefined,
		assignedWorkerLabel: input.ticket.assignedWorkerId ?? "Unassigned",
		assignmentContext: buildAssignmentContext(input.ticket),
		notes: input.notes.map((note) => ({
			id: note._id,
			body: note.body,
			authorLabel: note.authorLabel,
			createdAtLabel: formatRelativeTimeLabel(note.createdAt, input.now),
		})),
	};
}

export function buildTicketClassificationInput<MessageId>(
	ticketId: string,
	seed: InboundTicketSeed<MessageId>,
): ClassifyTicketInput {
	return {
		ticketId,
		subject: seed.subject,
		requesterEmail: seed.requesterEmail,
		fallbackClassification: FALLBACK_TICKET_CLASSIFICATION,
	};
}

export type TicketRoutingPatch = {
	assignedWorkerId: string | null;
	reviewState: ReviewState;
	routingReason: string;
	status: Exclude<TicketStatus, "new">;
	routedAt: number;
};

export function buildTicketRoutingPatch(
	decision: RoutingDecision,
	routedAt: number,
): TicketRoutingPatch {
	return {
		assignedWorkerId: decision.assignedWorkerId,
		reviewState: decision.reviewState,
		routingReason: decision.routingReason,
		status: decision.assignedWorkerId === null ? "reviewed" : "assigned",
		routedAt,
	};
}

export type TicketLeadReviewPatch = {
	assignedWorkerId: string | null;
	reviewState: ReviewState;
	status: ApplyLeadReviewDecisionResult["status"];
	reviewedAt: number;
};

export function buildLeadReviewPatch(input: {
	decision: ApplyLeadReviewDecisionResult;
	assignedWorkerId?: string | null;
	reviewedAt: number;
}): TicketLeadReviewPatch {
	if (input.decision.status === "assigned" && input.assignedWorkerId == null) {
		throw new Error("Assigned worker required for approval");
	}

	return {
		assignedWorkerId:
			input.decision.status === "assigned"
				? (input.assignedWorkerId ?? null)
				: null,
		reviewState: input.decision.reviewState,
		status: input.decision.status,
		reviewedAt: input.reviewedAt,
	};
}

export async function ingestInboundTicket<TicketId, MessageId>(
	store: TicketStore<TicketId, MessageId>,
	seed: InboundTicketSeed<MessageId>,
) {
	const existing = await store.getByExternalId(seed.source, seed.externalId);

	if (existing) {
		return {
			ticketId: existing._id,
			created: false,
		};
	}

	const ticketId = await store.insert(seed);
	return {
		ticketId,
		created: true,
	};
}

function createTicketStore(db: any): TicketStore<any, any> {
	return {
		getByExternalId: (source, externalId) =>
			db
				.query("tickets")
				.withIndex("by_source_externalId", (q: any) =>
					q.eq("source", source).eq("externalId", externalId),
				)
				.unique(),
		insert: (seed) => db.insert("tickets", seed),
	};
}

export const ingestInbound = mutation({
	args: {
		source: v.literal(INBOUND_TICKET_SOURCE),
		externalId: v.string(),
		messageId: v.id("messages"),
		requesterEmail: v.union(v.string(), v.null()),
		subject: v.union(v.string(), v.null()),
		receivedAt: v.number(),
	},
	handler: async (ctx, args) => {
		return ingestInboundTicket(createTicketStore(ctx.db), args);
	},
});

export const getDetail = query({
	args: {
		ticketId: v.id("tickets"),
	},
	handler: async (ctx, args) => {
		await requireOperationalCoreAccess(ctx);

		const ticket = await ctx.db.get(args.ticketId);

		if (!ticket) {
			return null;
		}

		const notes = await ctx.db
			.query("notes")
			.withIndex("by_ticketId", (q: any) => q.eq("ticketId", args.ticketId))
			.collect();

		return buildTicketDetailWorkspace({
			ticket: {
				_id: String(ticket._id),
				subject: ticket.subject,
				requesterEmail: ticket.requesterEmail,
				reviewState: ticket.reviewState,
				status: ticket.status,
				routingReason: ticket.routingReason,
				assignedWorkerId: ticket.assignedWorkerId,
			},
			notes: notes.map((note) => ({
				_id: String(note._id),
				body: note.body,
				authorLabel: note.authorLabel,
				createdAt: note.createdAt,
			})),
			now: Date.now(),
		});
	},
});
