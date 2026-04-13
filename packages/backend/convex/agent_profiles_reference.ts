import { makeFunctionReference } from "convex/server";

import type {
	AgentProfileSnapshot,
	CurrentAgentProfileWorkspace,
	TeamProfileDirectoryMember,
	TeamProfileDirectorySummary,
	TeamProfileDirectoryWorkspace,
} from "./agent_profiles";
import type { ParseAgentResumeResult } from "./ai/parse_agent_resume";

export const getCurrentAgentProfileReference = makeFunctionReference<
	"query",
	Record<string, never>,
	CurrentAgentProfileWorkspace
>("agent_profiles:getCurrent");

export const generateCurrentResumeUploadUrlReference = makeFunctionReference<
	"mutation",
	Record<string, never>,
	string
>("agent_profiles:generateResumeUploadUrl");

export const getTeamProfileDirectoryReference = makeFunctionReference<
	"query",
	Record<string, never>,
	TeamProfileDirectoryWorkspace
>("agent_profiles:getTeamProfileDirectory");

export const saveCurrentResumeUploadReference = makeFunctionReference<
	"mutation",
	{
		storageId: string;
		resumeFileName: string;
		resumeMimeType: string;
	},
	AgentProfileSnapshot
>("agent_profiles:saveCurrentResumeUpload");

export const parseCurrentResumeReference = makeFunctionReference<
	"action",
	Record<string, never>,
	AgentProfileSnapshot
>("agent_profiles:parseCurrentResume");

export const parseAgentResumeReference = makeFunctionReference<
	"action",
	{
		resumeFileName: string | null;
		resumeMimeType: string | null;
		resumeBase64: string;
	},
	ParseAgentResumeResult
>("ai/parse_agent_resume:parseAgentResume");

export type {
	AgentProfileSnapshot,
	CurrentAgentProfileWorkspace,
	TeamProfileDirectoryMember,
	TeamProfileDirectorySummary,
	TeamProfileDirectoryWorkspace,
};
