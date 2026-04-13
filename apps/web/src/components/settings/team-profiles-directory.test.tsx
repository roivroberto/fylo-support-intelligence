import { cleanup, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { TeamProfilesDirectory } from "./team-profiles-directory";

describe("TeamProfilesDirectory", () => {
	beforeEach(() => {
		cleanup();
	});

	it("renders summary counts", () => {
		render(
			<TeamProfilesDirectory
				summary={{
					totalMembers: 4,
					readyCount: 2,
					processingCount: 1,
					failedCount: 0,
					missingCount: 1,
				}}
				members={[]}
			/>,
		);

		expect(screen.getByText("4 teammates")).toBeInTheDocument();
		expect(screen.getByText("2 ready")).toBeInTheDocument();
		expect(screen.getByText("1 processing")).toBeInTheDocument();
		expect(screen.getByText("1 missing")).toBeInTheDocument();
	});

	it("renders ready and missing profile rows", () => {
		render(
			<TeamProfilesDirectory
				summary={{
					totalMembers: 2,
					readyCount: 1,
					processingCount: 0,
					failedCount: 0,
					missingCount: 1,
				}}
				members={[
					{
						userId: "lead_1",
						role: "lead",
						profile: {
							parseStatus: "ready",
							resumeFileName: "lead-resume.pdf",
							primarySkills: ["Routing"],
							secondarySkills: ["Escalations"],
							languages: ["English"],
							summary: "Lead routing specialist",
						},
					},
					{
						userId: "agent_2",
						role: "agent",
						profile: null,
					},
				]}
			/>,
		);

		expect(screen.getByText("lead_1")).toBeInTheDocument();
		expect(screen.getByText("lead-resume.pdf")).toBeInTheDocument();
		expect(screen.getByText("Lead routing specialist")).toBeInTheDocument();
		expect(screen.getByText("agent_2")).toBeInTheDocument();
		expect(screen.getByText("No resume uploaded")).toBeInTheDocument();
	});

	it("renders role and status labels", () => {
		render(
			<TeamProfilesDirectory
				summary={{
					totalMembers: 4,
					readyCount: 1,
					processingCount: 1,
					failedCount: 1,
					missingCount: 0,
				}}
				members={[
					{
						userId: "lead_1",
						role: "lead",
						profile: {
							parseStatus: "ready",
							primarySkills: [],
							secondarySkills: [],
							languages: [],
						},
					},
					{
						userId: "agent_1",
						role: "agent",
						profile: {
							parseStatus: "processing",
							primarySkills: [],
							secondarySkills: [],
							languages: [],
						},
					},
					{
						userId: "agent_2",
						role: "agent",
						profile: {
							parseStatus: "failed",
							primarySkills: [],
							secondarySkills: [],
							languages: [],
						},
					},
					{
						userId: "agent_3",
						role: "agent",
						profile: {
							parseStatus: "idle",
							primarySkills: [],
							secondarySkills: [],
							languages: [],
						},
					},
				]}
			/>,
		);

		const leadRow = screen
			.getByRole("rowheader", { name: /lead_1/i })
			.closest("tr");
		const processingRow = screen
			.getByRole("rowheader", { name: /agent_1/i })
			.closest("tr");
		const failedRow = screen
			.getByRole("rowheader", { name: /agent_2/i })
			.closest("tr");
		const idleRow = screen
			.getByRole("rowheader", { name: /agent_3/i })
			.closest("tr");

		expect(leadRow).not.toBeNull();
		expect(processingRow).not.toBeNull();
		expect(failedRow).not.toBeNull();
		expect(idleRow).not.toBeNull();

		expect(within(leadRow as HTMLElement).getByText("Lead")).toBeInTheDocument();
		expect(within(leadRow as HTMLElement).getByText("Ready")).toBeInTheDocument();
		expect(within(processingRow as HTMLElement).getByText("Agent")).toBeInTheDocument();
		expect(
			within(processingRow as HTMLElement).getByText("Processing"),
		).toBeInTheDocument();
		expect(
			within(failedRow as HTMLElement).getByText("Needs attention"),
		).toBeInTheDocument();
		expect(within(idleRow as HTMLElement).getByText("On file")).toBeInTheDocument();
	});

	it("renders the directory as an accessible table", () => {
		render(
			<TeamProfilesDirectory
				summary={{
					totalMembers: 1,
					readyCount: 1,
					processingCount: 0,
					failedCount: 0,
					missingCount: 0,
				}}
				members={[
					{
						userId: "lead_1",
						role: "lead",
						profile: {
							parseStatus: "ready",
							primarySkills: [],
							secondarySkills: [],
							languages: [],
						},
					},
				]}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: /team profile coverage/i }),
		).toBeInTheDocument();
		expect(screen.getByRole("table", { name: /team profiles directory/i })).toBeInTheDocument();
		expect(screen.getByRole("columnheader", { name: /team member/i })).toBeInTheDocument();
		expect(screen.getByRole("columnheader", { name: /role/i })).toBeInTheDocument();
		expect(screen.getByRole("columnheader", { name: /status/i })).toBeInTheDocument();
	});

	it("keeps long content contained and idle copy aligned", () => {
		const longUserId =
			"lead_user_with_an_extremely_long_identifier_that_should_not_blow_up_the_grid";
		const longFileName =
			"resume-file-name-that-keeps-going-and-going-and-should-truncate-in-the-row.pdf";
		const longSummary =
			"This is an intentionally long routing summary that should wrap safely inside the row without stretching the compact directory layout beyond its column constraints.";

		render(
			<TeamProfilesDirectory
				summary={{
					totalMembers: 1,
					readyCount: 0,
					processingCount: 0,
					failedCount: 0,
					missingCount: 0,
				}}
				members={[
					{
						userId: longUserId,
						role: "lead",
						profile: {
							parseStatus: "idle",
							resumeFileName: longFileName,
							primarySkills: [],
							secondarySkills: [],
							languages: [],
						},
					},
					{
						userId: "agent_ready",
						role: "agent",
						profile: {
							parseStatus: "ready",
							primarySkills: [],
							secondarySkills: [],
							languages: [],
							summary: longSummary,
						},
					},
				]}
			/>,
		);

		expect(screen.getByText("On file")).toBeInTheDocument();
		expect(
			screen.getByText("Resume uploaded and waiting for parsing"),
		).toBeInTheDocument();
		expect(screen.getByText(longUserId)).toHaveClass("break-all");
		expect(screen.getByText(longFileName)).toHaveClass("truncate");
		expect(screen.getByText(longSummary)).toHaveClass("break-words");
	});
});
