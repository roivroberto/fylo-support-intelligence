import {
	actionGeneric as action,
	makeFunctionReference,
	mutationGeneric as mutation,
	queryGeneric as query,
} from "convex/server";
import { ConvexError, v } from "convex/values";

import type { AgentProfileSnapshot } from "./agent_profiles_reference";
import { authComponent } from "./auth";
import { INBOUND_MESSAGE_SOURCE, type InboundMessageSeed } from "./messages";
import { getCurrentWorkspaceReference } from "./workspaces_reference";
import { classifyAndRouteTicketReference } from "./tickets_reference";
import type {
	ClassifyTicketInput,
	ClassifyTicketResult,
} from "./ai/classify_ticket";
import { FALLBACK_TICKET_CLASSIFICATION } from "./lib/classification_schema";
import {
	DEFAULT_ROUTING_POLICY,
	type RoutingPolicySettings,
	sanitizePolicyInput,
} from "./lib/policy_update";
import type { ApplyLeadReviewDecisionResult } from "./lib/review_workflow";
import { routeTicket } from "./lib/routing/route_ticket";
import type { RoutingDecision, RoutingWorker } from "./lib/routing/types";
import type { ReviewState } from "./lib/routing_thresholds";

export const INBOUND_TICKET_SOURCE = "resend" as const;

export type TicketStatus = "new" | "reviewed" | "assigned";

export type TicketDetailNote = {
	id: string;
	body: string;
	authorLabel: string;
	createdAtLabel: string;
};

export type RecommendedAssigneeOption = {
	id: string;
	label: string;
	skillMatchTier: string;
	capacityRemaining: number;
	languageMatch: boolean;
};

export type TicketDetailWorkspace = {
	id: string;
	title?: string;
	requesterEmail?: string;
	requestType?: string;
	priority?: string;
	classificationConfidence?: number;
	classificationSource?: "provider" | "fallback";
	reviewState: string;
	status: string;
	routingReason?: string;
	assignedWorkerId?: string | null;
	assignedWorkerLabel: string;
	assignmentContext: string;
	notes: TicketDetailNote[];
	recommendedAssigneeOptions: RecommendedAssigneeOption[];
	/** Current viewer's user id (for hiding send panel from leads, excluding self from assignee for leads) */
	currentUserId?: string | null;
	/** Current viewer's role in the workspace: lead can only assign others; only assigned agent can send reply */
	viewerRole?: "lead" | "agent" | null;
};

export type QueueTicketRow = {
	id: string;
	title?: string;
	requester?: string;
	reason: string;
	priority: "low" | "medium" | "high";
	status: string;
	reviewState: string;
	classificationConfidence: number;
	classificationSource: "provider" | "fallback";
	assignedWorkerLabel: string;
	requestType?: string;
	decisionHref: string;
};

export type QueueWorkspace = {
	totalCount: number;
	urgentCount: number;
	fallbackCount: number;
	rows: QueueTicketRow[];
};

export type ReviewItem = {
	id: string;
	title: string;
	decisionWindow: string;
	owner: string;
	note: string;
	reviewState: string;
	decisionHref: string;
	requestType?: string;
	priority?: string;
};

export type ReviewWorkspace = {
	count: number;
	items: ReviewItem[];
};

export type InboundTicketSeed<MessageId = string> = {
	workspaceId: string;
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

type StoredTicketRecord = {
	_id: string;
	workspaceId?: string | null;
	subject?: string | null;
	requesterEmail?: string | null;
	requestType?: string | null;
	priority?: string | null;
	classificationConfidence?: number | null;
	classificationSource?: "provider" | "fallback" | null;
	assignedWorkerId?: string | null;
	reviewState?: string | null;
	status?: string | null;
	routingReason?: string | null;
	receivedAt?: number;
	messageId?: string | null;
};

const ROUTING_POLICY_SLUG = "routing-policy";

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

export const getQueueSnapshotReference = makeFunctionReference<
	"query",
	Record<string, never>,
	QueueWorkspace
>("tickets:getQueueSnapshot");

export const getReviewSnapshotReference = makeFunctionReference<
	"query",
	Record<string, never>,
	ReviewWorkspace
>("tickets:getReviewSnapshot");

export const rerouteTicketReference = makeFunctionReference<
	"mutation",
	{ ticketId: string },
	{ routingDecision: RoutingDecision }
>("tickets:reroute");

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

	return memberships;
}

async function requireOperationalCoreWorkspace(ctx: any) {
	const memberships = await requireOperationalCoreAccess(ctx);
	const workspaceId = await getPilotWorkspaceId(ctx, memberships);

	return {
		memberships,
		workspaceId,
	};
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

function resolveUserDisplayName(
	user: { name?: string | null; email?: string | null } | null,
	userId: string,
): string {
	if (!user) return userId;
	return (user.name && user.name.trim()) || user.email || userId;
}

async function getUserLabelsForWorkspace(
	ctx: any,
	workspaceId: any,
): Promise<Record<string, string>> {
	const memberships = await listWorkspaceMemberships(ctx, workspaceId);
	const labels: Record<string, string> = {};
	for (const m of memberships) {
		try {
			const user = await authComponent.getAnyUserById(ctx, m.userId);
			labels[m.userId] = resolveUserDisplayName(user, m.userId);
		} catch {
			labels[m.userId] = m.userId;
		}
	}
	return labels;
}

/** Turn technical routing reason into a short, human-readable sentence. */
function formatRoutingReasonForDisplay(
	reason: string | null | undefined,
	userLabels: Record<string, string>,
): string {
	if (!reason || !reason.trim()) return "";
	let out = reason
		.replace(/\bskill:primary\b/gi, "primary skill match")
		.replace(/\bskill:secondary\b/gi, "secondary skill match")
		.replace(/\bskill:none\b/gi, "no skill match")
		.replace(/\blanguage:(\w+)\b/gi, (_, lang) => `language ${lang}`)
		.replace(/\blanguage_mismatch:(\w+)\b/gi, (_, lang) => `language mismatch (${lang})`)
		.replace(/\bavailability:ready\b/gi, "available")
		.replace(/\bavailability:at_capacity\b/gi, "at capacity")
		.replace(/\bcapacity_remaining:(\d+)\b/gi, (_, n) => `${n} open slots`);
	Object.entries(userLabels).forEach(([id, name]) => {
		out = out.replace(new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), name);
	});
	out = out.replace(/\bRecommended\s+/i, "Recommended ");
	out = out.replace(/\bbeat\s+/gi, "chosen over ");
	out = out.replace(/\bon total_score\s*\([^)]+\)/gi, "on overall score");
	out = out.replace(/\bon capacity_remaining\s*\([^)]+\)/gi, "on available capacity");
	out = out.replace(/\bon worker_id tie-breaker/gi, "on tie-breaker");
	out = out.replace(/\bis the only eligible recommendation/gi, "is the only eligible agent");
	out = out.replace(/\bReview required\s*\([^)]+\)\.?\s*/gi, "Review required. ");
	return out.trim();
}

function buildAssignmentContext(
	ticket: {
		assignedWorkerId?: string | null;
		reviewState?: string | null;
		status?: string | null;
		routingReason?: string | null;
	},
	assignedWorkerLabel?: string | null,
) {
	if (ticket.assignedWorkerId && assignedWorkerLabel) {
		return `Assigned to ${assignedWorkerLabel} based on the current routing decision.`;
	}
	if (ticket.assignedWorkerId) {
		return "Assigned based on the current routing decision.";
	}

	if (ticket.reviewState === "manager_verification") {
		return "Pending manager verification before final ownership is confirmed.";
	}

	if (ticket.reviewState === "manual_triage") {
		return "Manual triage is still needed to choose the right owner.";
	}

	if (ticket.status === "assigned") {
		return "Assignment is recorded.";
	}

	return "Ready for routing once ownership is confirmed.";
}

function resolveTicketLanguage(requesterEmail: string | null | undefined) {
	if (!requesterEmail) {
		return "en";
	}

	return requesterEmail.endsWith(".ph") ? "fil" : "en";
}

function mapPriorityForQueue(priority?: string | null): "low" | "medium" | "high" {
	if (priority === "low") {
		return "low";
	}

	if (
		priority === "high" ||
		priority === "urgent" ||
		priority === "critical"
	) {
		return "high";
	}

	return "medium";
}

function buildDecisionWindow(reviewState?: string | null) {
	if (reviewState === "manual_triage") {
		return "Manual triage needed now";
	}

	return "Decision due soon";
}

function buildWorkerProfile(
	userId: string,
	role: string,
	load: number,
	capacity: number,
	profile?: Pick<
		AgentProfileSnapshot,
		"parseStatus" | "primarySkills" | "secondarySkills" | "languages"
	> | null,
): RoutingWorker {
	const isLead = role === "lead";
	const usesParsedProfile =
		profile?.parseStatus === "ready" && profile.primarySkills.length > 0;

	return {
		id: userId,
		primary: usesParsedProfile
			? profile.primarySkills
			: isLead
				? [
					"billing_issue",
					"complaint",
					"account_access",
					"general_inquiry",
				]
				: [
					"technical_problem",
					"refund_request",
					"feature_request",
					"general_inquiry",
				],
		secondary: usesParsedProfile
			? profile.secondarySkills
			: isLead
				? ["refund_request", "feature_request", "technical_problem"]
				: ["billing_issue", "account_access", "complaint"],
		load,
		capacity,
		languages:
			usesParsedProfile && profile.languages.length > 0
				? profile.languages
				: userId.includes(".ph")
					? ["en", "fil"]
					: ["en"],
	};
}

async function listAgentProfilesForWorkspace(ctx: any, workspaceId: any) {
	if (!workspaceId) {
		return [];
	}

	return ctx.db
		.query("agentProfiles")
		.withIndex("by_workspaceId", (q: any) => q.eq("workspaceId", workspaceId))
		.collect();
}

async function getPilotWorkspaceId(ctx: any, memberships?: any[]) {
	if (memberships && memberships[0]) {
		return memberships[0].workspaceId;
	}

	const workspace = await ctx.db.query("workspaces").first();
	return workspace?._id ?? null;
}

async function readRoutingPolicyForWorkspace(
	ctx: any,
	workspaceId: any,
): Promise<RoutingPolicySettings> {
	if (!workspaceId) {
		return DEFAULT_ROUTING_POLICY;
	}

	const policy = await ctx.db
		.query("policies")
		.withIndex("by_workspaceId_slug", (q: any) =>
			q.eq("workspaceId", workspaceId).eq("slug", ROUTING_POLICY_SLUG),
		)
		.unique();

	if (!policy) {
		return DEFAULT_ROUTING_POLICY;
	}

	try {
		return sanitizePolicyInput(JSON.parse(policy.body) as RoutingPolicySettings);
	} catch {
		return DEFAULT_ROUTING_POLICY;
	}
}

async function listWorkspaceMemberships(ctx: any, workspaceId: any) {
	if (!workspaceId) {
		return [];
	}

	return ctx.db
		.query("memberships")
		.withIndex("by_workspaceId", (q: any) => q.eq("workspaceId", workspaceId))
		.collect();
}

async function buildRoutingWorkers(
	ctx: any,
	workspaceId: any,
	policy: RoutingPolicySettings,
) {
	const memberships = await listWorkspaceMemberships(ctx, workspaceId);
	const profiles = await listAgentProfilesForWorkspace(ctx, workspaceId);
	const tickets = ((await ctx.db.query("tickets").collect()) as any[]).filter(
		(ticket) => ticket.workspaceId === workspaceId,
	);
	const profileByUserId = new Map<
		string,
		Pick<
			AgentProfileSnapshot,
			"parseStatus" | "primarySkills" | "secondarySkills" | "languages"
		>
	>(
		profiles.map((profile: any) => [
			profile.userId,
			profile as Pick<
				AgentProfileSnapshot,
				"parseStatus" | "primarySkills" | "secondarySkills" | "languages"
			>,
		]),
	);

	return memberships
		.filter((membership: any) => membership.role !== "lead")
		.map((membership: any) => {
			const load = tickets.filter(
				(ticket: any) => ticket.assignedWorkerId === membership.userId,
			).length;

			return buildWorkerProfile(
				membership.userId,
				membership.role,
				load,
				policy.maxAssignmentsPerWorker,
				profileByUserId.get(membership.userId) ?? null,
			);
		});
}

function buildRecommendedAssigneeOptions(input: {
	ticket: StoredTicketRecord;
	workers: RoutingWorker[];
	policy: RoutingPolicySettings;
}) {
	if (!input.ticket.requestType || input.ticket.classificationConfidence == null) {
		return [...input.workers]
			.sort(
				(left: RoutingWorker, right: RoutingWorker) => left.load - right.load,
			)
			.map((worker) => ({
				id: worker.id,
				label: worker.id,
				skillMatchTier: "unknown",
				capacityRemaining: Math.max(worker.capacity - worker.load, 0),
				languageMatch: worker.languages.includes(
					resolveTicketLanguage(input.ticket.requesterEmail),
				),
			}));
	}

	const decision = routeTicket({
		ticket: {
			request_type: input.ticket.requestType,
			language: resolveTicketLanguage(input.ticket.requesterEmail),
			classification_confidence: input.ticket.classificationConfidence,
		},
		workers: input.workers,
		policy: {
			autoAssignThreshold: input.policy.autoAssignThreshold,
			manualTriageThreshold: 0.5,
			allowSecondarySkills: input.policy.allowSecondarySkills,
			requireLeadReview: input.policy.requireLeadReview,
		},
	});

	return decision.scoredCandidates.map((candidate) => ({
		id: candidate.workerId,
		label: candidate.workerId,
		skillMatchTier: candidate.skillMatchTier,
		capacityRemaining: candidate.capacityRemaining,
		languageMatch: candidate.languageMatch,
	}));
}

export function buildTicketDetailWorkspace(input: {
	ticket: StoredTicketRecord;
	notes: Array<{
		_id: string;
		body: string;
		authorLabel: string;
		createdAt: number;
	}>;
	recommendedAssigneeOptions: RecommendedAssigneeOption[];
	now: number;
	assignedWorkerLabel?: string | null;
	assignmentContext?: string | null;
	routingReason?: string | null;
	currentUserId?: string | null;
	viewerRole?: "lead" | "agent" | null;
}): TicketDetailWorkspace {
	return {
		id: input.ticket._id,
		title: input.ticket.subject ?? undefined,
		requesterEmail: input.ticket.requesterEmail ?? undefined,
		requestType: input.ticket.requestType ?? undefined,
		priority: input.ticket.priority ?? undefined,
		classificationConfidence:
			input.ticket.classificationConfidence ?? undefined,
		classificationSource: input.ticket.classificationSource ?? undefined,
		reviewState: input.ticket.reviewState ?? "manual_triage",
		status: input.ticket.status ?? "new",
		routingReason: input.routingReason ?? input.ticket.routingReason ?? undefined,
		assignedWorkerId: input.ticket.assignedWorkerId ?? null,
		assignedWorkerLabel:
			input.assignedWorkerLabel ?? input.ticket.assignedWorkerId ?? "Unassigned",
		assignmentContext:
			input.assignmentContext ?? buildAssignmentContext(input.ticket),
		notes: input.notes.map((note) => ({
			id: note._id,
			body: note.body,
			authorLabel: note.authorLabel,
			createdAtLabel: formatRelativeTimeLabel(note.createdAt, input.now),
		})),
		recommendedAssigneeOptions: input.recommendedAssigneeOptions,
		currentUserId: input.currentUserId ?? null,
		viewerRole: input.viewerRole ?? null,
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
		messageText: null,
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

/** Query for use by classifyAndRouteAction: returns ticket + message text. */
export const getTicketAndMessageForClassification = query({
	args: { ticketId: v.id("tickets") },
	handler: async (ctx, args) => {
		const { workspaceId } = await requireOperationalCoreWorkspace(ctx);
		const ticket = await ctx.db.get(args.ticketId);
		if (!ticket || ticket.workspaceId !== workspaceId) {
			return null;
		}
		const message = ticket.messageId
			? await ctx.db.get(ticket.messageId)
			: null;
		return {
			subject: ticket.subject,
			requesterEmail: ticket.requesterEmail,
			messageText: message?.text ?? null,
		};
	},
});

/** Applies classification result and routing (no AI). Used by classifyAndRouteAction. */
export const applyClassificationAndRouting = mutation({
	args: {
		ticketId: v.id("tickets"),
		classification: v.object({
			request_type: v.string(),
			priority: v.string(),
			classification_confidence: v.number(),
		}),
		classificationSource: v.union(
			v.literal("provider"),
			v.literal("fallback"),
		),
		fallbackReason: v.union(
			v.literal("classifier_error"),
			v.literal("invalid_schema"),
			v.null(),
		),
	},
	handler: async (ctx, args) => {
		const ticket = await ctx.db.get(args.ticketId);
		if (!ticket) {
			throw new ConvexError("Ticket not found");
		}
		const { workspaceId } = await requireOperationalCoreWorkspace(ctx);
		if (ticket.workspaceId !== workspaceId) {
			throw new ConvexError("Forbidden");
		}
		const policy = await readRoutingPolicyForWorkspace(ctx, workspaceId);
		const workers = await buildRoutingWorkers(ctx, workspaceId, policy);
		const routingDecision = routeTicket({
			ticket: {
				request_type: args.classification.request_type,
				language: resolveTicketLanguage(ticket.requesterEmail),
				classification_confidence: args.classification.classification_confidence,
			},
			workers,
			policy: {
				autoAssignThreshold: policy.autoAssignThreshold,
				manualTriageThreshold: 0.5,
				allowSecondarySkills: policy.allowSecondarySkills,
				requireLeadReview: policy.requireLeadReview,
			},
		});
		const routingPatch = buildTicketRoutingPatch(routingDecision, Date.now());
		await ctx.db.patch(args.ticketId, {
			requestType: args.classification.request_type,
			priority: args.classification.priority,
			classificationConfidence: args.classification.classification_confidence,
			classificationSource: args.classificationSource,
			classificationFallbackReason: args.fallbackReason,
			language: resolveTicketLanguage(ticket.requesterEmail),
			...routingPatch,
		});
		return { routingDecision };
	},
});

async function rerouteTicketWithoutClassification(ctx: any, ticketId: string) {
	const ticket = await ctx.db.get(ticketId);

	if (!ticket) {
		throw new ConvexError("Ticket not found");
	}

	const { workspaceId } = await requireOperationalCoreWorkspace(ctx);

	if (ticket.workspaceId !== workspaceId) {
		throw new ConvexError("Forbidden");
	}

	const requestType = ticket.requestType ?? FALLBACK_TICKET_CLASSIFICATION.request_type;
	const confidence =
		ticket.classificationConfidence ??
		FALLBACK_TICKET_CLASSIFICATION.classification_confidence;
	const policy = await readRoutingPolicyForWorkspace(ctx, workspaceId);
	const workers = await buildRoutingWorkers(ctx, workspaceId, policy);
	const routingDecision = routeTicket({
		ticket: {
			request_type: requestType,
			language:
				ticket.language ?? resolveTicketLanguage(ticket.requesterEmail),
			classification_confidence: confidence,
		},
		workers,
		policy: {
			autoAssignThreshold: policy.autoAssignThreshold,
			manualTriageThreshold: 0.5,
			allowSecondarySkills: policy.allowSecondarySkills,
			requireLeadReview: policy.requireLeadReview,
		},
	});

	await ctx.db.patch(ticket._id, {
		...buildTicketRoutingPatch(routingDecision, Date.now()),
	});

	return { routingDecision };
}

export const ingestInbound = mutation({
	args: {
		workspaceId: v.id("workspaces"),
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

/** @deprecated Use classifyAndRouteAction (action) instead; mutations cannot call AI actions. */
export const classifyAndRoute = mutation({
	args: {
		ticketId: v.id("tickets"),
	},
	handler: async () => {
		throw new ConvexError(
			"Use classifyAndRouteAction (action) instead of this mutation.",
		);
	},
});

export const reroute = mutation({
	args: {
		ticketId: v.id("tickets"),
	},
	handler: async (ctx, args) =>
		rerouteTicketWithoutClassification(ctx, String(args.ticketId)),
});

export const getQueueSnapshot = query({
	args: {},
	handler: async (ctx) => {
		const { memberships: viewerMemberships, workspaceId } =
			await requireOperationalCoreWorkspace(ctx);
		const viewer = viewerMemberships[0] as { userId: string; role: string } | undefined;
		const isLead = viewer?.role === "lead";
		const viewerUserId = viewer?.userId;

		const tickets = ((await ctx.db.query("tickets").collect()) as any[]).filter(
			(ticket) => ticket.workspaceId === workspaceId,
		);
		const visibleTickets = isLead
			? tickets
			: tickets.filter(
				(ticket: any) => ticket.assignedWorkerId === viewerUserId,
			);
		const userLabels = await getUserLabelsForWorkspace(ctx, workspaceId);
		const rows = [...visibleTickets]
			.sort(
				(left: any, right: any) =>
					(right.receivedAt ?? 0) - (left.receivedAt ?? 0),
			)
			.map(
				(ticket: any): QueueTicketRow => {
					const rawReason =
						ticket.routingReason ??
						"Classification and routing are still being prepared.";
					const reasonHumanized = formatRoutingReasonForDisplay(
						ticket.routingReason,
						userLabels,
					);
					return {
						id: String(ticket._id),
						title: ticket.subject ?? undefined,
						requester: ticket.requesterEmail ?? undefined,
						reason: reasonHumanized || rawReason,
						priority: mapPriorityForQueue(ticket.priority),
						status: ticket.status ?? "new",
						reviewState: ticket.reviewState ?? "manual_triage",
						classificationConfidence: ticket.classificationConfidence ?? 0,
						classificationSource: ticket.classificationSource ?? "fallback",
						assignedWorkerLabel:
							ticket.assignedWorkerId != null
								? userLabels[ticket.assignedWorkerId] ?? ticket.assignedWorkerId
								: "Unassigned",
						requestType: ticket.requestType ?? undefined,
						decisionHref: `/tickets/${String(ticket._id)}`,
					};
				},
			);

		return {
			totalCount: rows.length,
			urgentCount: rows.filter((row: QueueTicketRow) => row.priority === "high")
				.length,
			fallbackCount: rows.filter(
				(row: QueueTicketRow) => row.classificationSource === "fallback",
			).length,
			rows,
		};
	},
});

export const getReviewSnapshot = query({
	args: {},
	handler: async (ctx) => {
		const { memberships: viewerMemberships, workspaceId } =
			await requireOperationalCoreWorkspace(ctx);
		const workspaceMemberships = await listWorkspaceMemberships(ctx, workspaceId);
		const memberIds = new Set(
			workspaceMemberships.map((membership: any) => membership.userId),
		);
		const tickets = ((await ctx.db.query("tickets").collect()) as any[]).filter(
			(ticket) => ticket.workspaceId === workspaceId,
		);
		const items = [...tickets]
			.filter(
				(ticket: any) =>
					(ticket.reviewState === "manager_verification" ||
						ticket.reviewState === "manual_triage") &&
					(ticket.assignedWorkerId == null || memberIds.has(ticket.assignedWorkerId)),
			)
			.sort(
				(left: any, right: any) =>
					(right.receivedAt ?? 0) - (left.receivedAt ?? 0),
			)
			.map(
				(ticket: any): ReviewItem => ({
					id: String(ticket._id),
					title: ticket.subject ?? String(ticket._id),
					decisionWindow: buildDecisionWindow(ticket.reviewState),
					owner: ticket.assignedWorkerId ?? "Unassigned",
					note:
						ticket.routingReason ??
						"This ticket still needs a human routing decision.",
					reviewState: ticket.reviewState ?? "manual_triage",
					decisionHref: `/tickets/${String(ticket._id)}`,
					requestType: ticket.requestType ?? undefined,
					priority: ticket.priority ?? undefined,
				}),
			);

		return {
			count: items.length,
			items,
		};
	},
});

export const getDetail = query({
	args: {
		ticketId: v.id("tickets"),
	},
	handler: async (ctx, args) => {
		const { memberships: viewerMemberships, workspaceId } =
			await requireOperationalCoreWorkspace(ctx);
		const ticket = await ctx.db.get(args.ticketId);

		if (!ticket) {
			return null;
		}

		if (ticket.workspaceId !== workspaceId) {
			throw new ConvexError("Forbidden");
		}

		const notes = await ctx.db
			.query("notes")
			.withIndex("by_ticketId", (q: any) => q.eq("ticketId", args.ticketId))
			.collect();
		const policy = await readRoutingPolicyForWorkspace(ctx, workspaceId);
		const workers = await buildRoutingWorkers(ctx, workspaceId, policy);
		const userLabels = await getUserLabelsForWorkspace(ctx, workspaceId);

		const recommendedOptions = buildRecommendedAssigneeOptions({
			ticket: {
				_id: String(ticket._id),
				subject: ticket.subject,
				requesterEmail: ticket.requesterEmail,
				requestType: ticket.requestType,
				priority: ticket.priority,
				classificationConfidence: ticket.classificationConfidence,
				classificationSource: ticket.classificationSource,
				assignedWorkerId: ticket.assignedWorkerId,
				reviewState: ticket.reviewState,
				status: ticket.status,
				routingReason: ticket.routingReason,
				receivedAt: ticket.receivedAt,
				messageId: String(ticket.messageId),
			},
			workers,
			policy,
		}).map((opt) => ({
			...opt,
			label: userLabels[opt.id] ?? opt.label,
		}));

		const assignedWorkerLabel =
			ticket.assignedWorkerId != null
				? userLabels[ticket.assignedWorkerId] ?? ticket.assignedWorkerId
				: "Unassigned";
		const assignmentContext = buildAssignmentContext(
			{
				assignedWorkerId: ticket.assignedWorkerId,
				reviewState: ticket.reviewState,
				status: ticket.status,
				routingReason: ticket.routingReason,
			},
			assignedWorkerLabel,
		);
		const routingReasonHumanized = formatRoutingReasonForDisplay(
			ticket.routingReason,
			userLabels,
		);

		const viewerMembership = viewerMemberships.find(
			(m: { workspaceId: string }) => String(m.workspaceId) === String(workspaceId),
		);
		const currentUserId = viewerMembership?.userId ?? null;
		const viewerRole =
			viewerMembership?.role === "lead" || viewerMembership?.role === "agent"
				? viewerMembership.role
				: null;

		return buildTicketDetailWorkspace({
			ticket: {
				_id: String(ticket._id),
				subject: ticket.subject,
				requesterEmail: ticket.requesterEmail,
				requestType: ticket.requestType,
				priority: ticket.priority,
				classificationConfidence: ticket.classificationConfidence,
				classificationSource: ticket.classificationSource,
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
			recommendedAssigneeOptions: recommendedOptions,
			now: Date.now(),
			assignedWorkerLabel,
			assignmentContext,
			routingReason: (routingReasonHumanized || ticket.routingReason) ?? undefined,
			currentUserId,
			viewerRole,
		});
	},
});

const getTicketAndMessageForClassificationReference = makeFunctionReference<
	"query",
	{ ticketId: string },
	{ subject: string | null; requesterEmail: string | null; messageText: string | null } | null
>("tickets:getTicketAndMessageForClassification");

const applyClassificationAndRoutingReference = makeFunctionReference<
	"mutation",
	{
		ticketId: string;
		classification: {
			request_type: string;
			priority: string;
			classification_confidence: number;
		};
		classificationSource: "provider" | "fallback";
		fallbackReason: "classifier_error" | "invalid_schema" | null;
	},
	{ routingDecision: RoutingDecision }
>("tickets:applyClassificationAndRouting");

export const classifyAndRouteAction = action({
	args: { ticketId: v.id("tickets") },
	handler: async (ctx, args) => {
		const ticketId = String(args.ticketId);
		const data = await ctx.runQuery(
			getTicketAndMessageForClassificationReference,
			{ ticketId },
		);
		if (!data) {
			throw new ConvexError("Ticket not found or access denied");
		}
		const classificationResult = (await ctx.runAction(classifyTicketReference, {
			ticketId,
			subject: data.subject,
			requesterEmail: data.requesterEmail,
			messageText: data.messageText,
			fallbackClassification: FALLBACK_TICKET_CLASSIFICATION,
		})) as ClassifyTicketResult;
		const routingPatchDecision = await ctx.runMutation(applyClassificationAndRoutingReference, {
			ticketId: args.ticketId,
			classification: classificationResult.classification,
			classificationSource:
				classificationResult.generationSource === "provider"
					? "provider"
					: "fallback",
			fallbackReason: classificationResult.fallbackReason,
		}) as { routingDecision: RoutingDecision };

		const assignedOrRecommendedWorkerId = routingPatchDecision.routingDecision.assignedWorkerId
			|| routingPatchDecision.routingDecision.scoredCandidates?.find(c => c.isAvailable)?.workerId;

		if (assignedOrRecommendedWorkerId) {
			const reasonResult = (await ctx.runAction(generateRoutingReasonReference, {
				ticketId: args.ticketId,
				deterministicReason: routingPatchDecision.routingDecision.routingReason,
				workerId: assignedOrRecommendedWorkerId,
			})) as { aiReason: string };

			await ctx.runMutation(updateRoutingReasonReference, {
				ticketId: args.ticketId,
				routingReason: reasonResult.aiReason,
			});
		}

		return { ok: true };
	},
});

const generateRoutingReasonReference = makeFunctionReference<
	"action",
	{ ticketId: string; deterministicReason: string; workerId?: string },
	{ aiReason: string }
>("ai/generate_routing_reason:generateRoutingReason");

export const updateRoutingReason = mutation({
	args: { ticketId: v.id("tickets"), routingReason: v.string() },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.ticketId, { routingReason: args.routingReason });
	},
});

const updateRoutingReasonReference = makeFunctionReference<
	"mutation",
	{ ticketId: string; routingReason: string },
	null
>("tickets:updateRoutingReason");

const classifyAndRouteActionReference = makeFunctionReference<
	"action",
	{ ticketId: string },
	{ ok: true }
>("tickets:classifyAndRouteAction");

const ingestInboundMessageReference = makeFunctionReference<
	"mutation",
	InboundMessageSeed,
	{ messageId: string; created: boolean }
>("messages:ingestInbound");

const ingestInboundTicketReference = makeFunctionReference<
	"mutation",
	{
		workspaceId: any;
		source: typeof INBOUND_TICKET_SOURCE;
		externalId: string;
		messageId: string;
		requesterEmail: string | null;
		subject: string | null;
		receivedAt: number;
	},
	{ ticketId: string; created: boolean }
>("tickets:ingestInbound");

export const createTicketFromForm = action({
	args: {
		requesterEmail: v.union(v.string(), v.null()),
		subject: v.union(v.string(), v.null()),
		body: v.optional(v.union(v.string(), v.null())),
	},
	handler: async (ctx, args) => {
		const workspaceState = await ctx.runQuery(getCurrentWorkspaceReference, {});
		const workspaceId = workspaceState?.workspace?.workspaceId;
		if (!workspaceId) {
			throw new ConvexError("No workspace. Join or create a workspace first.");
		}
		const idempotencyKey = crypto.randomUUID();
		const externalId = crypto.randomUUID();
		const receivedAt = Date.now();
		const bodyText = args.body ?? args.subject ?? "";
		const messageSeed: InboundMessageSeed = {
			source: INBOUND_MESSAGE_SOURCE,
			externalId,
			idempotencyKey,
			from: args.requesterEmail ?? null,
			to: [],
			subject: args.subject ?? null,
			text: bodyText || null,
			html: null,
			receivedAt,
			rawBody: bodyText,
		};
		const messageResult = (await ctx.runMutation(
			ingestInboundMessageReference,
			messageSeed,
		)) as { messageId: string; created: boolean };
		const ticketResult = (await ctx.runMutation(ingestInboundTicketReference, {
			workspaceId,
			source: INBOUND_TICKET_SOURCE,
			externalId,
			messageId: messageResult.messageId,
			requesterEmail: args.requesterEmail ?? null,
			subject: args.subject ?? null,
			receivedAt,
		})) as { ticketId: string; created: boolean };
		await ctx.runAction(classifyAndRouteActionReference, {
			ticketId: ticketResult.ticketId,
		});
		return { ticketId: ticketResult.ticketId };
	},
});
