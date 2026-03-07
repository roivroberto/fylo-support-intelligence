import { describe, expect, it } from "vitest";

import { parseAgentProfile } from "../agent_profile_schema";

describe("parseAgentProfile", () => {
	it("normalizes supported skills and languages", () => {
		expect(
			parseAgentProfile({
				primary_skills: ["Technical_Problem", "general_inquiry", "unknown_skill"],
				secondary_skills: ["billing_issue", "technical_problem"],
				languages: ["English", "Tagalog", "english"],
				summary:
					"Handled customer support queues across technical and general operations work.",
			}),
		).toEqual({
			primary_skills: ["technical_problem", "general_inquiry"],
			secondary_skills: ["billing_issue"],
			languages: ["en", "fil"],
			summary:
				"Handled customer support queues across technical and general operations work.",
		});
	});

	it("returns null when no supported primary skill remains", () => {
		expect(
			parseAgentProfile({
				primary_skills: ["sales"],
				secondary_skills: [],
				languages: ["English"],
				summary:
					"Worked on several different tasks but without supported routing categories.",
			}),
		).toBeNull();
	});
});
