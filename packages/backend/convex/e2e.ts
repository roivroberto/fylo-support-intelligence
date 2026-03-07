import { mutationGeneric as mutation } from "convex/server";
import { ConvexError, v } from "convex/values";

import { authComponent } from "./auth";

const ROUTING_POLICY_SLUG = "routing-policy";
const ROUTING_POLICY_TITLE = "Routing policy";
const BUSY_AGENT_LABEL = "agent-e2e";
const WATCH_AGENT_LABEL = "agent-watch";
const CLEAR_AGENT_LABEL = "agent-clear";
const STATIC_LEAD_LABEL = "lead-e2e";

type ViewerRole = "lead" | "agent";
type TicketReviewState =
	| "auto_assign_allowed"
	| "manager_verification"
	| "manual_triage";
type TicketStatus = "new" | "reviewed" | "assigned";

type SeededTicket = {
	key: string;
	from: string | null;
	requesterEmail: string | null;
	subject: string | null;
	messageText: string | null;
	assignedWorkerId?: string | null;
	reviewState?: TicketReviewState;
	routingReason?: string;
	status?: TicketStatus;
	note?: {
		body: string;
		authorUserId: string;
		authorLabel: string;
	};
};

async function requireCurrentUser(ctx: any) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError("Unauthenticated");
	}

	return user as {
		_id: unknown;
		email?: string | null;
		name?: string | null;
	};
}

function buildPolicyBody() {
	return JSON.stringify({
		autoAssignThreshold: 0.8,
		maxAssignmentsPerWorker: 8,
		requireLeadReview: true,
		allowSecondarySkills: true,
	});
}

function buildScopedKey(prefix: string, userId: string, key: string) {
	return `${prefix}-${key}-${userId}`;
}

function buildWorkspaceSlug(userId: string) {
	return `fylo-e2e-${userId}`;
}

function buildWorkspaceUserId(userId: string, label: string) {
	return `${label}-${userId}@fylo.local`;
}

async function ensureWorkspace(db: any, userId: string, now: number) {
	const existingWorkspace = await db
		.query("workspaces")
		.withIndex("by_slug", (q: any) => q.eq("slug", buildWorkspaceSlug(userId)))
		.unique();

	if (existingWorkspace) {
		return existingWorkspace._id;
	}

	return db.insert("workspaces", {
		name: `Fylo E2E ${userId.slice(0, 8)}`,
		slug: buildWorkspaceSlug(userId),
		createdAt: now,
		createdByUserId: userId,
	});
}

async function ensureMembership(
	db: any,
	workspaceId: any,
	userId: string,
	role: ViewerRole,
	now: number,
) {
	const existingMembership = await db
		.query("memberships")
		.withIndex("by_workspaceId_userId", (q: any) =>
			q.eq("workspaceId", workspaceId).eq("userId", userId),
		)
		.unique();

	if (existingMembership) {
		if (existingMembership.role !== role) {
			await db.patch(existingMembership._id, { role });
		}

		return existingMembership._id;
	}

	return db.insert("memberships", {
		workspaceId,
		userId,
		role,
		createdAt: now,
	});
}

async function ensurePolicy(
	db: any,
	workspaceId: any,
	createdByUserId: string,
	now: number,
) {
	const existingPolicy = await db
		.query("policies")
		.withIndex("by_workspaceId_slug", (q: any) =>
			q.eq("workspaceId", workspaceId).eq("slug", ROUTING_POLICY_SLUG),
		)
		.unique();
	const body = buildPolicyBody();

	if (existingPolicy) {
		await db.patch(existingPolicy._id, {
			title: ROUTING_POLICY_TITLE,
			body,
			updatedAt: now,
		});
		return existingPolicy._id;
	}

	return db.insert("policies", {
		workspaceId,
		title: ROUTING_POLICY_TITLE,
		slug: ROUTING_POLICY_SLUG,
		body,
		createdAt: now,
		updatedAt: now,
		createdByUserId,
	});
}

async function ensureInboundMessage(
	db: any,
	userId: string,
	seed: SeededTicket,
	now: number,
) {
	const externalId = buildScopedKey("e2e-message", userId, seed.key);
	const idempotencyKey = buildScopedKey("e2e-idempotency", userId, seed.key);
	const existingMessage = await db
		.query("messages")
		.withIndex("by_idempotencyKey", (q: any) => q.eq("idempotencyKey", idempotencyKey))
		.unique();
	const payload = {
		direction: "inbound" as const,
		source: "resend" as const,
		externalId,
		idempotencyKey,
		from: seed.from,
		to: ["support@fyloph.com"],
		subject: seed.subject,
		text: seed.messageText,
		html: null,
		receivedAt: now,
		rawBody: `e2e bootstrap inbound message ${seed.key}`,
	};

	if (existingMessage) {
		await db.patch(existingMessage._id, payload);
		return existingMessage._id;
	}

	return db.insert("messages", payload);
}

async function ensureTicket(
	db: any,
	userId: string,
	messageId: any,
	seed: SeededTicket,
	now: number,
) {
	const externalId = buildScopedKey("e2e-ticket", userId, seed.key);
	const existingTicket = await db
		.query("tickets")
		.withIndex("by_source_externalId", (q: any) =>
			q.eq("source", "resend").eq("externalId", externalId),
		)
		.unique();
	const payload = {
		source: "resend" as const,
		externalId,
		messageId,
		requesterEmail: seed.requesterEmail,
		subject: seed.subject,
		receivedAt: now,
		...(seed.assignedWorkerId !== undefined
			? { assignedWorkerId: seed.assignedWorkerId }
			: {}),
		...(seed.reviewState !== undefined ? { reviewState: seed.reviewState } : {}),
		...(seed.routingReason !== undefined
			? { routingReason: seed.routingReason }
			: {}),
		...(seed.status !== undefined ? { status: seed.status } : {}),
		...(seed.status === "assigned" || seed.status === "reviewed"
			? { routedAt: now }
			: {}),
		...(seed.reviewState === "manager_verification" ? { reviewedAt: now } : {}),
	};

	if (existingTicket) {
		await db.patch(existingTicket._id, payload);
		return existingTicket._id;
	}

	return db.insert("tickets", payload);
}

async function ensureTicketNote(
	db: any,
	ticketId: any,
	note: NonNullable<SeededTicket["note"]>,
	now: number,
) {
	const existingNotes = await db
		.query("notes")
		.withIndex("by_ticketId", (q: any) => q.eq("ticketId", ticketId))
		.collect();

	if (existingNotes[0]) {
		await db.patch(existingNotes[0]._id, {
			body: note.body,
			authorUserId: note.authorUserId,
			authorLabel: note.authorLabel,
			createdAt: now,
		});
		return existingNotes[0]._id;
	}

	return db.insert("notes", {
		ticketId,
		body: note.body,
		authorUserId: note.authorUserId,
		authorLabel: note.authorLabel,
		createdAt: now,
	});
}

function buildSeededTickets(input: {
	viewerId: string;
	viewerLabel: string;
	busyAgentUserId: string;
	watchAgentUserId: string;
}) {
	return [
		{
			key: "vip-review",
			from: "vip@northstar.example",
			requesterEmail: "vip@northstar.example",
			subject: "VIP onboarding escalation",
			messageText:
				"VIP onboarding needs lead confirmation. Please confirm owner and next step.",
			assignedWorkerId: input.busyAgentUserId,
			reviewState: "manager_verification" as const,
			routingReason: "Escalated by policy rule for lead confirmation.",
			status: "reviewed" as const,
			note: {
				body: "VIP onboarding needs lead confirmation.",
				authorUserId: input.viewerId,
				authorLabel: input.viewerLabel,
			},
		},
		{
			key: "billing-followup",
			from: "ops@northstar.example",
			requesterEmail: "ops@northstar.example",
			subject: "Billing exception needs manual routing",
			messageText:
				"The exception still needs a specialist owner, but the queue should keep moving.",
			assignedWorkerId: input.busyAgentUserId,
			reviewState: "auto_assign_allowed" as const,
			routingReason: "Secondary-skill coverage kept the queue moving.",
			status: "assigned" as const,
		},
		{
			key: "retention-question",
			from: "support@northstar.example",
			requesterEmail: "support@northstar.example",
			subject: "Data retention routing question",
			messageText:
				"Need a confirmed owner for the retention workflow follow-up before the SLA window closes.",
			assignedWorkerId: input.busyAgentUserId,
			reviewState: "auto_assign_allowed" as const,
			routingReason: "Backlog relief routed to the current specialist.",
			status: "assigned" as const,
		},
		{
			key: "ops-confirmation",
			from: "ops2@northstar.example",
			requesterEmail: "ops2@northstar.example",
			subject: "Account ownership confirmation",
			messageText:
				"Please confirm the current owner and the next update we should send back to the customer.",
			assignedWorkerId: input.busyAgentUserId,
			reviewState: "auto_assign_allowed" as const,
			routingReason: "Existing owner retained after deterministic routing.",
			status: "assigned" as const,
		},
		{
			key: "watch-review",
			from: "success@northstar.example",
			requesterEmail: "success@northstar.example",
			subject: "VIP checklist variance",
			messageText:
				"The checklist gap is small, but we still need human confirmation before rerouting.",
			assignedWorkerId: input.watchAgentUserId,
			reviewState: "manager_verification" as const,
			routingReason: "Confidence stayed below the auto-assign threshold.",
			status: "reviewed" as const,
		},
		{
			key: "watch-assigned",
			from: "finance@northstar.example",
			requesterEmail: "finance@northstar.example",
			subject: "Refund policy question",
			messageText:
				"The backup coverage lane picked this up, but one more review could crowd the queue.",
			assignedWorkerId: input.watchAgentUserId,
			reviewState: "auto_assign_allowed" as const,
			routingReason: "Matched the backup skill coverage lane.",
			status: "assigned" as const,
		},
		{
			key: "missing-info",
			from: null,
			requesterEmail: null,
			subject: null,
			messageText:
				"Following up on a request that omitted the sender details, but still needs a human handoff.",
			assignedWorkerId: null,
			reviewState: "manual_triage" as const,
			status: "new" as const,
		},
	] satisfies SeededTicket[];
}

export const seedData = mutation({
	args: {
		viewerRole: v.optional(v.union(v.literal("lead"), v.literal("agent"))),
	},
	handler: async (ctx, args) => {
		const user = await requireCurrentUser(ctx);
		const userId = String(user._id);
		const userEmail = user.email ?? `${userId}@fylo.local`;
		const userName = user.name ?? userEmail;
		const viewerRole = args.viewerRole ?? "lead";
		const busyAgentUserId = buildWorkspaceUserId(userId, BUSY_AGENT_LABEL);
		const watchAgentUserId = buildWorkspaceUserId(userId, WATCH_AGENT_LABEL);
		const clearAgentUserId = buildWorkspaceUserId(userId, CLEAR_AGENT_LABEL);
		const staticLeadUserId = buildWorkspaceUserId(userId, STATIC_LEAD_LABEL);
		const now = Date.now();
		const workspaceId = await ensureWorkspace(ctx.db, userId, now);

		await ensureMembership(ctx.db, workspaceId, userId, viewerRole, now);
		if (viewerRole === "agent") {
			await ensureMembership(ctx.db, workspaceId, staticLeadUserId, "lead", now);
		}
		await ensureMembership(ctx.db, workspaceId, busyAgentUserId, "agent", now);
		await ensureMembership(ctx.db, workspaceId, watchAgentUserId, "agent", now);
		await ensureMembership(ctx.db, workspaceId, clearAgentUserId, "agent", now);
		await ensurePolicy(ctx.db, workspaceId, userId, now);

		const tickets = buildSeededTickets({
			viewerId: userId,
			viewerLabel: userName,
			busyAgentUserId,
			watchAgentUserId,
		});
		const ids = new Map<string, string>();

		for (const ticket of tickets) {
			const messageId = await ensureInboundMessage(ctx.db, userId, ticket, now);
			const ticketId = await ensureTicket(ctx.db, userId, messageId, ticket, now);
			ids.set(ticket.key, String(ticketId));

			if (ticket.note) {
				await ensureTicketNote(ctx.db, ticketId, ticket.note, now);
			}
		}

		return {
			viewerEmail: userEmail,
			viewerRole,
			busyAgentUserId,
			watchAgentUserId,
			clearAgentUserId,
			ticketId: ids.get("vip-review") ?? "",
			missingInfoTicketId: ids.get("missing-info") ?? "",
		};
	},
});
