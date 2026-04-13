import { z } from "zod";

export const SUPPORTED_REQUEST_TYPES = [
	"billing_issue",
	"refund_request",
	"technical_problem",
	"account_access",
	"feature_request",
	"complaint",
	"general_inquiry",
] as const;

const supportedRequestTypeSet = new Set<string>(SUPPORTED_REQUEST_TYPES);

function normalizeStringList(values: unknown[]): string[] {
	const normalized = values
		.map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
		.filter((value) => value.length > 0);

	return [...new Set(normalized)];
}

function normalizeRequestTypes(values: unknown[]): string[] {
	return normalizeStringList(values).filter((value) =>
		supportedRequestTypeSet.has(value),
	);
}

function normalizeLanguages(values: unknown[]): string[] {
	return normalizeStringList(values).map((value) => {
		if (["english", "eng", "en-us", "en-ph"].includes(value)) {
			return "en";
		}

		if (["filipino", "tagalog", "fil"].includes(value)) {
			return "fil";
		}

		return value;
	});
}

export const agentProfileSchema = z
	.object({
		primary_skills: z.array(z.string()).transform(normalizeRequestTypes),
		secondary_skills: z.array(z.string()).transform(normalizeRequestTypes),
		languages: z.array(z.string()).transform(normalizeLanguages),
		summary: z.string().trim().min(20),
	})
	.strict()
	.transform((value) => ({
		primary_skills: value.primary_skills,
		secondary_skills: value.secondary_skills.filter(
			(skill) => !value.primary_skills.includes(skill),
		),
		languages: [...new Set(value.languages)].filter((language) => language.length > 0),
		summary: value.summary.trim(),
	}))
	.refine((value) => value.primary_skills.length > 0, {
		message: "At least one primary skill is required",
		path: ["primary_skills"],
	});

export type ParsedAgentProfile = z.infer<typeof agentProfileSchema>;

export function parseAgentProfile(input: unknown) {
	const parsed = agentProfileSchema.safeParse(input);
	return parsed.success ? parsed.data : null;
}
