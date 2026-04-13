import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useAction, useMutation, useQuery } = vi.hoisted(() => ({
	useAction: vi.fn(),
	useMutation: vi.fn(),
	useQuery: vi.fn(),
}));

const generateUploadUrl = vi.fn();
const saveResumeUpload = vi.fn();
const parseCurrentResume = vi.fn();

vi.mock("convex/react", () => ({
	useAction,
	useMutation,
	useQuery,
}));

vi.mock("@Fylo/backend/convex/agent_profiles_reference", () => ({
	getCurrentAgentProfileReference: { name: "getCurrentAgentProfileReference" },
	generateCurrentResumeUploadUrlReference: {
		name: "generateCurrentResumeUploadUrlReference",
	},
	saveCurrentResumeUploadReference: { name: "saveCurrentResumeUploadReference" },
	parseCurrentResumeReference: { name: "parseCurrentResumeReference" },
}));

vi.mock("../ui/button", () => ({
	Button: ({ children, ...props }: React.ComponentProps<"button">) => (
		<button {...props}>{children}</button>
	),
}));

describe("AgentProfileForm", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		useQuery.mockReturnValue({
			workspaceId: "ws_1",
			userId: "user_1",
			profile: null,
		});
		useMutation.mockImplementation((reference: { name: string }) => {
			if (reference.name === "generateCurrentResumeUploadUrlReference") {
				return generateUploadUrl;
			}

			if (reference.name === "saveCurrentResumeUploadReference") {
				return saveResumeUpload;
			}

			return vi.fn();
		});
		useAction.mockImplementation((reference: { name: string }) => {
			if (reference.name === "parseCurrentResumeReference") {
				return parseCurrentResume;
			}

			return vi.fn();
		});
	});

	it("renders the empty state guidance", async () => {
		const { AgentProfileForm } = await import("./agent-profile-form");
		render(<AgentProfileForm />);

		expect(
			screen.getByText(/upload a pdf resume to replace the current role-based routing defaults/i),
		).toBeInTheDocument();
	});

	it("uploads and parses a resume", async () => {
		generateUploadUrl.mockResolvedValue("https://upload.test");
		saveResumeUpload.mockResolvedValue(undefined);
		parseCurrentResume.mockResolvedValue({
			parseStatus: "ready",
			parseError: undefined,
		});
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ storageId: "storage_123" }),
		});
		vi.stubGlobal("fetch", fetchMock);

		const { AgentProfileForm } = await import("./agent-profile-form");
		render(<AgentProfileForm />);

		const file = new File(["resume"], "resume.pdf", { type: "application/pdf" });
		fireEvent.change(screen.getByLabelText(/resume pdf/i), {
			target: { files: [file] },
		});

		await waitFor(() => {
			expect(generateUploadUrl).toHaveBeenCalledWith({});
			expect(saveResumeUpload).toHaveBeenCalledWith({
				storageId: "storage_123",
				resumeFileName: "resume.pdf",
				resumeMimeType: "application/pdf",
			});
			expect(parseCurrentResume).toHaveBeenCalledWith({});
		});

		expect(
			screen.getByText(/resume uploaded and parsed. routing will use your extracted skills/i),
		).toBeInTheDocument();
	});

	it("shows parsing failures returned by the backend", async () => {
		generateUploadUrl.mockResolvedValue("https://upload.test");
		saveResumeUpload.mockResolvedValue(undefined);
		parseCurrentResume.mockResolvedValue({
			parseStatus: "failed",
			parseError: "Resume parsing returned invalid structured data",
		});
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({ storageId: "storage_123" }),
			}),
		);

		const { AgentProfileForm } = await import("./agent-profile-form");
		render(<AgentProfileForm />);

		const file = new File(["resume"], "resume.pdf", { type: "application/pdf" });
		fireEvent.change(screen.getByLabelText(/resume pdf/i), {
			target: { files: [file] },
		});

		await waitFor(() => {
			expect(
				screen.getByText("Resume parsing returned invalid structured data"),
			).toBeInTheDocument();
		});
	});
});
