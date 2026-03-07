import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const workspaceRole = v.union(v.literal("lead"), v.literal("agent"));
const agentProfileParseStatus = v.union(
	v.literal("idle"),
	v.literal("processing"),
	v.literal("ready"),
	v.literal("failed"),
);
const ticketReviewState = v.union(
	v.literal("auto_assign_allowed"),
	v.literal("manager_verification"),
	v.literal("manual_triage"),
);
const ticketStatus = v.union(
	v.literal("new"),
	v.literal("reviewed"),
	v.literal("assigned"),
);
const messageDirection = v.union(v.literal("inbound"), v.literal("outbound"));
const outboundDeliveryStatus = v.union(v.literal("pending"), v.literal("sent"));

export default defineSchema({
	workspaces: defineTable({
		name: v.string(),
		slug: v.string(),
		createdAt: v.number(),
		createdByUserId: v.string(),
	})
		.index("by_slug", ["slug"])
		.index("by_createdByUserId", ["createdByUserId"]),
	memberships: defineTable({
		workspaceId: v.id("workspaces"),
		userId: v.string(),
		role: workspaceRole,
		createdAt: v.number(),
	})
		.index("by_workspaceId", ["workspaceId"])
		.index("by_userId", ["userId"])
		.index("by_workspaceId_userId", ["workspaceId", "userId"]),
	agentProfiles: defineTable({
		workspaceId: v.id("workspaces"),
		userId: v.string(),
		resumeStorageId: v.optional(v.id("_storage")),
		resumeFileName: v.optional(v.string()),
		resumeMimeType: v.optional(v.string()),
		resumeUploadedAt: v.optional(v.number()),
		parseStatus: agentProfileParseStatus,
		primarySkills: v.array(v.string()),
		secondarySkills: v.array(v.string()),
		languages: v.array(v.string()),
		summary: v.optional(v.string()),
		parseSource: v.optional(v.union(v.literal("provider"), v.literal("fallback"))),
		parseFallbackReason: v.optional(
			v.union(v.literal("parser_error"), v.literal("invalid_schema"), v.null()),
		),
		parseError: v.optional(v.string()),
		lastParsedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_workspaceId", ["workspaceId"])
		.index("by_userId", ["userId"])
		.index("by_workspaceId_userId", ["workspaceId", "userId"]),
	policies: defineTable({
		workspaceId: v.id("workspaces"),
		title: v.string(),
		slug: v.string(),
		body: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
		createdByUserId: v.string(),
	})
		.index("by_workspaceId", ["workspaceId"])
		.index("by_workspaceId_slug", ["workspaceId", "slug"]),
	messages: defineTable({
		direction: messageDirection,
		source: v.literal("resend"),
		externalId: v.union(v.string(), v.null()),
		idempotencyKey: v.string(),
		ticketId: v.optional(v.id("tickets")),
		providerMessageId: v.optional(v.union(v.string(), v.null())),
		from: v.union(v.string(), v.null()),
		to: v.array(v.string()),
		subject: v.union(v.string(), v.null()),
		text: v.union(v.string(), v.null()),
		html: v.union(v.string(), v.null()),
		createdAt: v.optional(v.number()),
		receivedAt: v.optional(v.number()),
		sentAt: v.optional(v.number()),
		deliveryStatus: v.optional(outboundDeliveryStatus),
		rawBody: v.string(),
	})
		.index("by_idempotencyKey", ["idempotencyKey"])
		.index("by_ticketId", ["ticketId"])
		.index("by_source_externalId", ["source", "externalId"]),
	notes: defineTable({
		ticketId: v.id("tickets"),
		body: v.string(),
		authorUserId: v.string(),
		authorLabel: v.string(),
		createdAt: v.number(),
	}).index("by_ticketId", ["ticketId"]),
	draftReplies: defineTable({
		ticketId: v.id("tickets"),
		summary: v.string(),
		recommendedAction: v.string(),
		draftReply: v.string(),
		generationStatus: v.optional(
			v.union(v.literal("pending"), v.literal("ready")),
		),
		claimToken: v.optional(v.string()),
		claimExpiresAt: v.optional(v.number()),
		generationSource: v.union(v.literal("provider"), v.literal("deterministic")),
		usedFallback: v.boolean(),
		fallbackReason: v.union(
			v.literal("generator_error"),
			v.literal("invalid_schema"),
			v.null(),
		),
		generatedAt: v.number(),
	}).index("by_ticketId", ["ticketId"]),
	tickets: defineTable({
		workspaceId: v.id("workspaces"),
		source: v.literal("resend"),
		externalId: v.string(),
		messageId: v.id("messages"),
		requesterEmail: v.union(v.string(), v.null()),
		subject: v.union(v.string(), v.null()),
		requestType: v.optional(v.string()),
		priority: v.optional(
			v.union(
				v.literal("low"),
				v.literal("medium"),
				v.literal("high"),
				v.literal("urgent"),
				v.literal("critical"),
			),
		),
		classificationConfidence: v.optional(v.number()),
		classificationSource: v.optional(
			v.union(v.literal("provider"), v.literal("fallback")),
		),
		classificationFallbackReason: v.optional(
			v.union(
				v.literal("classifier_error"),
				v.literal("invalid_schema"),
				v.null(),
			),
		),
		language: v.optional(v.string()),
		assignedWorkerId: v.optional(v.union(v.string(), v.null())),
		reviewState: v.optional(ticketReviewState),
		routingReason: v.optional(v.string()),
		status: v.optional(ticketStatus),
		routedAt: v.optional(v.number()),
		reviewedAt: v.optional(v.number()),
		receivedAt: v.number(),
	})
		.index("by_workspaceId", ["workspaceId"])
		.index("by_source_externalId", ["source", "externalId"])
		.index("by_messageId", ["messageId"]),
});
