import { actionGeneric as action, queryGeneric as query, makeFunctionReference } from "convex/server";
import { v } from "convex/values";
import { createGeminiReasoningProviderFromEnv } from "../lib/gemini_reasoning_provider";
import type { AgentProfileSnapshot } from "../agent_profiles_reference";
import { authComponent } from "../auth";

export type GenerateRoutingReasonInput = {
    ticketId: string;
    deterministicReason: string;
};

export const generateRoutingReason = action({
    args: {
        ticketId: v.id("tickets"),
        deterministicReason: v.string(),
        workerId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // First, get the ticket and agent details
        const data = await ctx.runQuery(getReasoningContextReference, {
            ticketId: args.ticketId,
            workerId: args.workerId,
        });

        if (!data || !data.agent || !data.ticket) {
            return { aiReason: args.deterministicReason };
        }

        try {
            const provider = createGeminiReasoningProviderFromEnv();
            const aiReason = await provider({
                ticket: {
                    id: data.ticket.id,
                    subject: data.ticket.subject,
                    requestType: data.ticket.requestType,
                    priority: data.ticket.priority,
                },
                agent: {
                    id: data.agent.id,
                    primarySkills: data.agent.primarySkills,
                    secondarySkills: data.agent.secondarySkills,
                },
                deterministicReason: args.deterministicReason,
            });

            return { aiReason };
        } catch (err) {
            console.error("Failed to generate dynamic reasoning:", err);
            return { aiReason: args.deterministicReason };
        }
    },
});

export const getReasoningContext = query({
    args: { ticketId: v.id("tickets"), workerId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const ticket = await ctx.db.get(args.ticketId);
        if (!ticket) {
            return null; // Doesn't exist
        }

        const targetWorkerId = args.workerId ?? ticket.assignedWorkerId;
        if (!targetWorkerId) {
            return null;
        }

        // Also get the agent's profile if it exists in this workspace
        const profile = await ctx.db
            .query("agentProfiles")
            .withIndex("by_workspaceId_userId", (q: any) =>
                q.eq("workspaceId", ticket.workspaceId).eq("userId", targetWorkerId),
            )
            .first();

        const primarySkills = profile?.parseStatus === "ready" ? profile.primarySkills : [];
        const secondarySkills = profile?.parseStatus === "ready" ? profile.secondarySkills : [];

        let targetWorkerName = targetWorkerId;
        try {
            const user = await authComponent.getAnyUserById(ctx, targetWorkerId);
            if (user) {
                targetWorkerName = (user.name && user.name.trim()) || user.email || targetWorkerId;
            }
        } catch {
            // Ignore if user isn't found
            targetWorkerName = targetWorkerId;
        }

        return {
            ticket: {
                id: String(ticket._id),
                subject: ticket.subject ?? null,
                requestType: ticket.requestType ?? null,
                priority: ticket.priority ?? null,
            },
            agent: {
                id: targetWorkerName,
                primarySkills: primarySkills as string[],
                secondarySkills: secondarySkills as string[],
            },
        };
    },
});

export const getReasoningContextReference = makeFunctionReference<
    "query",
    { ticketId: string; workerId?: string },
    {
        ticket: {
            id: string;
            subject: string | null;
            requestType: string | null;
            priority: string | null;
        };
        agent: {
            id: string;
            primarySkills: string[];
            secondarySkills: string[];
        };
    } | null
>("ai/generate_routing_reason:getReasoningContext");
