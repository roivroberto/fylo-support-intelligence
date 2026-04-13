import {
	actionGeneric as action,
	makeFunctionReference,
	mutationGeneric as mutation,
	queryGeneric as query,
} from "convex/server";
import { ConvexError, v } from "convex/values";

import { authComponent } from "./auth";
import { parseAgentResumeReference } from "./agent_profiles_reference";
import { canManageWorkspaceMemberships } from "./lib/authz";
import { requireSinglePilotWorkspaceMembership } from "./lib/pilot_workspace";

export type AgentProfileSnapshot = {
	resumeFileName?: string;
	resumeMimeType?: string;
	resumeUploadedAt?: number;
	parseStatus: "idle" | "processing" | "ready" | "failed";
	primarySkills: string[];
	secondarySkills: string[];
	languages: string[];
	summary?: string;
	parseSource?: "provider" | "fallback";
	parseFallbackReason?: "parser_error" | "invalid_schema" | null;
	parseError?: string;
	lastParsedAt?: number;
};

export type CurrentAgentProfileWorkspace = {
	workspaceId: string;
	userId: string;
	profile: AgentProfileSnapshot | null;
};

export type TeamProfileDirectoryMember = {
	userId: string;
	role: "lead" | "agent";
	profile: AgentProfileSnapshot | null;
};

export type TeamProfileDirectorySummary = {
	totalMembers: number;
	readyCount: number;
	processingCount: number;
	failedCount: number;
	missingCount: number;
};

export type TeamProfileDirectoryWorkspace = {
	workspaceId: string;
	summary: TeamProfileDirectorySummary;
	members: TeamProfileDirectoryMember[];
};

type CurrentProfileContext = {
	workspaceId: any;
	userId: string;
};

type CurrentWorkspaceMembership = {
	_id: string;
	workspaceId: any;
	userId: string;
	role: "lead" | "agent";
	createdAt?: number;
};

type StoredAgentProfile = {
	_id: string;
	workspaceId: any;
	userId: string;
	resumeStorageId?: any;
	resumeFileName?: string;
	resumeMimeType?: string;
	resumeUploadedAt?: number;
	parseStatus: "idle" | "processing" | "ready" | "failed";
	primarySkills: string[];
	secondarySkills: string[];
	languages: string[];
	summary?: string;
	parseSource?: "provider" | "fallback";
	parseFallbackReason?: "parser_error" | "invalid_schema" | null;
	parseError?: string;
	lastParsedAt?: number;
	createdAt: number;
	updatedAt: number;
};

export const getCurrentAgentProfileReference = makeFunctionReference<
	"query",
	Record<string, never>,
	CurrentAgentProfileWorkspace
>("agent_profiles:getCurrent");

export const getCurrentAgentProfileForParseReference = makeFunctionReference<
	"query",
	Record<string, never>,
	{
		workspaceId: string;
		userId: string;
		resumeStorageId: string;
		resumeFileName: string | null;
		resumeMimeType: string | null;
	} | null
>("agent_profiles:getCurrentForParse");

export const getTeamProfileDirectoryReference = makeFunctionReference<
	"query",
	Record<string, never>,
	TeamProfileDirectoryWorkspace
>("agent_profiles:getTeamProfileDirectory");

export const generateCurrentResumeUploadUrlReference = makeFunctionReference<
	"mutation",
	Record<string, never>,
	string
>("agent_profiles:generateResumeUploadUrl");

export const saveCurrentResumeUploadReference = makeFunctionReference<
	"mutation",
	{
		storageId: string;
		resumeFileName: string;
		resumeMimeType: string;
	},
	AgentProfileSnapshot
>("agent_profiles:saveCurrentResumeUpload");

export const saveCurrentResumeParseSuccessReference = makeFunctionReference<
	"mutation",
	{
		primarySkills: string[];
		secondarySkills: string[];
		languages: string[];
		summary: string;
		parseSource: "provider" | "fallback";
		parseFallbackReason: "parser_error" | "invalid_schema" | null;
	},
	AgentProfileSnapshot
>("agent_profiles:saveCurrentResumeParseSuccess");

export const saveCurrentResumeParseFailureReference = makeFunctionReference<
	"mutation",
	{
		parseSource: "provider" | "fallback";
		parseFallbackReason: "parser_error" | "invalid_schema" | null;
		parseError?: string;
	},
	AgentProfileSnapshot
>("agent_profiles:saveCurrentResumeParseFailure");

async function requireCurrentUser(ctx: any) {
	const user = await authComponent.getAuthUser(ctx);

	if (!user) {
		throw new ConvexError("Unauthenticated");
	}

	return user;
}

async function requireCurrentWorkspaceMembership(
	ctx: any,
): Promise<CurrentWorkspaceMembership> {
	const user = await requireCurrentUser(ctx);
	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_userId", (q: any) => q.eq("userId", String(user._id)))
		.collect();

	return requireSinglePilotWorkspaceMembership(memberships) as CurrentWorkspaceMembership;
}

async function requireCurrentProfileContext(ctx: any): Promise<CurrentProfileContext> {
	const membership = await requireCurrentWorkspaceMembership(ctx);

	return {
		workspaceId: membership.workspaceId,
		userId: membership.userId,
	};
}

async function getStoredCurrentProfile(ctx: any, input: CurrentProfileContext) {
	return (await ctx.db
		.query("agentProfiles")
		.withIndex("by_workspaceId_userId", (q: any) =>
			q.eq("workspaceId", input.workspaceId).eq("userId", input.userId),
		)
		.unique()) as StoredAgentProfile | null;
}

function toProfileSnapshot(profile: StoredAgentProfile | null): AgentProfileSnapshot | null {
	if (!profile) {
		return null;
	}

	return {
		resumeFileName: profile.resumeFileName,
		resumeMimeType: profile.resumeMimeType,
		resumeUploadedAt: profile.resumeUploadedAt,
		parseStatus: profile.parseStatus,
		primarySkills: profile.primarySkills,
		secondarySkills: profile.secondarySkills,
		languages: profile.languages,
		summary: profile.summary,
		parseSource: profile.parseSource,
		parseFallbackReason: profile.parseFallbackReason,
		parseError: profile.parseError,
		lastParsedAt: profile.lastParsedAt,
	};
}

async function upsertCurrentProfile(
	ctx: any,
	input: CurrentProfileContext,
	patch: Partial<StoredAgentProfile>,
) {
	const existing = await getStoredCurrentProfile(ctx, input);
	const now = Date.now();

	if (existing) {
		await ctx.db.patch(existing._id, {
			...patch,
			updatedAt: now,
		});
		return (await getStoredCurrentProfile(ctx, input)) as StoredAgentProfile;
	}

	const profileId = await ctx.db.insert("agentProfiles", {
		workspaceId: input.workspaceId,
		userId: input.userId,
		parseStatus: "idle",
		primarySkills: [],
		secondarySkills: [],
		languages: [],
		createdAt: now,
		updatedAt: now,
		...patch,
	});

	return (await ctx.db.get(profileId)) as StoredAgentProfile;
}

export const getCurrent = query({
	args: {},
	handler: async (ctx) => {
		const current = await requireCurrentProfileContext(ctx);
		const profile = await getStoredCurrentProfile(ctx, current);

		return {
			workspaceId: String(current.workspaceId),
			userId: current.userId,
			profile: toProfileSnapshot(profile),
		};
	},
});

export const getCurrentForParse = query({
	args: {},
	handler: async (ctx) => {
		const current = await requireCurrentProfileContext(ctx);
		const profile = await getStoredCurrentProfile(ctx, current);

		if (!profile?.resumeStorageId) {
			return null;
		}

		return {
			workspaceId: String(current.workspaceId),
			userId: current.userId,
			resumeStorageId: String(profile.resumeStorageId),
			resumeFileName: profile.resumeFileName ?? null,
			resumeMimeType: profile.resumeMimeType ?? null,
		};
	},
});

export const getTeamProfileDirectory = query({
	args: {},
	handler: async (ctx) => {
		const membership = await requireCurrentWorkspaceMembership(ctx);

		if (!canManageWorkspaceMemberships(membership.role)) {
			throw new ConvexError("Forbidden");
		}

		const workspaceMemberships = (await ctx.db
			.query("memberships")
			.withIndex("by_workspaceId", (q: any) =>
				q.eq("workspaceId", membership.workspaceId),
			)
			.collect()) as CurrentWorkspaceMembership[];
		const profiles = (await ctx.db
			.query("agentProfiles")
			.withIndex("by_workspaceId", (q: any) =>
				q.eq("workspaceId", membership.workspaceId),
			)
			.collect()) as StoredAgentProfile[];

		const profileByUserId = new Map(
			profiles.map((profile) => [profile.userId, toProfileSnapshot(profile)]),
		);
		const members = [...workspaceMemberships]
			.sort((left, right) => {
				const createdAtDelta = (left.createdAt ?? 0) - (right.createdAt ?? 0);

				if (createdAtDelta !== 0) {
					return createdAtDelta;
				}

				return left.userId.localeCompare(right.userId);
			})
			.map((workspaceMembership) => ({
				userId: workspaceMembership.userId,
				role: workspaceMembership.role,
				profile: profileByUserId.get(workspaceMembership.userId) ?? null,
			}));

		return {
			workspaceId: String(membership.workspaceId),
			summary: {
				totalMembers: members.length,
				readyCount: members.filter((member) => member.profile?.parseStatus === "ready")
					.length,
				processingCount: members.filter(
					(member) => member.profile?.parseStatus === "processing",
				).length,
				failedCount: members.filter((member) => member.profile?.parseStatus === "failed")
					.length,
				missingCount: members.filter((member) => member.profile == null).length,
			},
			members,
		};
	},
});

export const generateResumeUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await requireCurrentProfileContext(ctx);
		return ctx.storage.generateUploadUrl();
	},
});

export const saveCurrentResumeUpload = mutation({
	args: {
		storageId: v.id("_storage"),
		resumeFileName: v.string(),
		resumeMimeType: v.string(),
	},
	handler: async (ctx, args) => {
		const current = await requireCurrentProfileContext(ctx);
		const metadata = await ctx.db.system.get("_storage", args.storageId);

		if (!metadata) {
			throw new ConvexError("Uploaded resume file not found");
		}

		if (metadata.contentType !== "application/pdf") {
			throw new ConvexError("Resume upload must be a PDF");
		}

		if (metadata.size > 5_000_000) {
			throw new ConvexError("Resume upload must be 5 MB or smaller");
		}

		const profile = await upsertCurrentProfile(ctx, current, {
			resumeStorageId: args.storageId,
			resumeFileName: args.resumeFileName.trim(),
			resumeMimeType: args.resumeMimeType.trim() || metadata.contentType,
			resumeUploadedAt: Date.now(),
			parseStatus: "processing",
			primarySkills: [],
			secondarySkills: [],
			languages: [],
			summary: undefined,
			parseSource: undefined,
			parseFallbackReason: null,
			parseError: undefined,
			lastParsedAt: undefined,
		});

		return toProfileSnapshot(profile) as AgentProfileSnapshot;
	},
});

export const saveCurrentResumeParseSuccess = mutation({
	args: {
		primarySkills: v.array(v.string()),
		secondarySkills: v.array(v.string()),
		languages: v.array(v.string()),
		summary: v.string(),
		parseSource: v.union(v.literal("provider"), v.literal("fallback")),
		parseFallbackReason: v.union(
			v.literal("parser_error"),
			v.literal("invalid_schema"),
			v.null(),
		),
	},
	handler: async (ctx, args) => {
		const current = await requireCurrentProfileContext(ctx);
		const profile = await upsertCurrentProfile(ctx, current, {
			parseStatus: "ready",
			primarySkills: args.primarySkills,
			secondarySkills: args.secondarySkills,
			languages: args.languages,
			summary: args.summary,
			parseSource: args.parseSource,
			parseFallbackReason: args.parseFallbackReason,
			parseError: undefined,
			lastParsedAt: Date.now(),
		});

		return toProfileSnapshot(profile) as AgentProfileSnapshot;
	},
});

export const saveCurrentResumeParseFailure = mutation({
	args: {
		parseSource: v.union(v.literal("provider"), v.literal("fallback")),
		parseFallbackReason: v.union(
			v.literal("parser_error"),
			v.literal("invalid_schema"),
			v.null(),
		),
		parseError: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const current = await requireCurrentProfileContext(ctx);
		const profile = await upsertCurrentProfile(ctx, current, {
			parseStatus: "failed",
			primarySkills: [],
			secondarySkills: [],
			languages: [],
			summary: undefined,
			parseSource: args.parseSource,
			parseFallbackReason: args.parseFallbackReason,
			parseError: args.parseError,
			lastParsedAt: Date.now(),
		});

		return toProfileSnapshot(profile) as AgentProfileSnapshot;
	},
});

export async function parseCurrentResumeHandler(ctx: any) {
	const current = await ctx.runQuery(getCurrentAgentProfileForParseReference, {});

	if (!current?.resumeStorageId) {
		throw new ConvexError("Upload a resume before parsing");
	}

	const blob = await ctx.storage.get(current.resumeStorageId);

	if (!blob) {
		return ctx.runMutation(saveCurrentResumeParseFailureReference, {
			parseSource: "fallback",
			parseFallbackReason: "parser_error",
			parseError: "Uploaded resume file is no longer available",
		});
	}

	const arrayBuffer = await blob.arrayBuffer();
	const bytes = new Uint8Array(arrayBuffer);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]!);
	}
	const resumeBase64 = btoa(binary);
	const parsed = await ctx.runAction(parseAgentResumeReference, {
		resumeFileName: current.resumeFileName,
		resumeMimeType: current.resumeMimeType,
		resumeBase64,
	});

	if (parsed.profile) {
		return ctx.runMutation(saveCurrentResumeParseSuccessReference, {
			primarySkills: parsed.profile.primary_skills,
			secondarySkills: parsed.profile.secondary_skills,
			languages: parsed.profile.languages,
			summary: parsed.profile.summary,
			parseSource: parsed.generationSource,
			parseFallbackReason: parsed.fallbackReason,
		});
	}

	return ctx.runMutation(saveCurrentResumeParseFailureReference, {
		parseSource: parsed.generationSource,
		parseFallbackReason: parsed.fallbackReason,
		parseError:
			parsed.parseErrorMessage ??
			(parsed.fallbackReason === "invalid_schema"
				? "Resume parsing returned invalid structured data"
				: "Resume parsing failed"),
	});
}

export const parseCurrentResume = action({
	args: {},
	handler: async (ctx) => parseCurrentResumeHandler(ctx),
});
