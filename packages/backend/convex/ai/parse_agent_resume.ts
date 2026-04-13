import { actionGeneric as action } from "convex/server";
import { v } from "convex/values";

import {
	parseAgentProfile,
	type ParsedAgentProfile,
} from "../lib/agent_profile_schema";
import { createGeminiResumeParserFromEnv } from "../lib/gemini_resume_parser";

export type ParseAgentResumeInput = {
	resumeFileName: string | null;
	resumeMimeType: string | null;
	resumeBase64: string;
};

export type ParseAgentResumeResult = {
	profile: ParsedAgentProfile | null;
	generationSource: "provider" | "fallback";
	usedFallback: boolean;
	fallbackReason: "parser_error" | "invalid_schema" | null;
	/** When fallback/error, the underlying error message from the parser or schema. */
	parseErrorMessage?: string;
};

export async function parseAgentResumeWithFallback(
	parser: (input: ParseAgentResumeInput) => Promise<unknown>,
	input: ParseAgentResumeInput,
): Promise<ParseAgentResumeResult> {
	try {
		const raw = await parser(input);
		const parsed = parseAgentProfile(raw);
		if (parsed) {
			return {
				profile: parsed,
				generationSource: "provider",
				usedFallback: false,
				fallbackReason: null,
			};
		}
		return {
			profile: null,
			generationSource: "fallback",
			usedFallback: true,
			fallbackReason: "invalid_schema",
			parseErrorMessage: "AI response did not match required schema (skills, languages, summary).",
		};
	} catch (err) {
		const message =
			err instanceof Error ? err.message : err != null ? String(err) : "Unknown error";
		return {
			profile: null,
			generationSource: "fallback",
			usedFallback: true,
			fallbackReason: "parser_error",
			parseErrorMessage: message,
		};
	}
}

async function runResumeParser(input: ParseAgentResumeInput) {
	return parseAgentResumeWithFallback(
		createGeminiResumeParserFromEnv(),
		input,
	);
}

export const parseAgentResume = action({
	args: {
		resumeFileName: v.union(v.string(), v.null()),
		resumeMimeType: v.union(v.string(), v.null()),
		resumeBase64: v.string(),
	},
	handler: async (_ctx, args) => runResumeParser(args),
});
