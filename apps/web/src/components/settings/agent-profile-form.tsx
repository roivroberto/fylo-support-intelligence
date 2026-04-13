"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";

import {
	generateCurrentResumeUploadUrlReference,
	getCurrentAgentProfileReference,
	parseCurrentResumeReference,
	saveCurrentResumeUploadReference,
} from "@Fylo/backend/convex/agent_profiles_reference";
import { getCurrentWorkspaceReference } from "@Fylo/backend/convex/workspaces_reference";

import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/button";

function formatStatusLabel(status: string) {
	if (status === "ready")      return "Parsed — ready for routing";
	if (status === "processing") return "Parsing resume…";
	if (status === "failed")     return "Parsing failed";
	return "No resume uploaded yet";
}

function statusColor(status: string): string {
	if (status === "ready")      return "#34d399";
	if (status === "processing") return "#a78bfa";
	if (status === "failed")     return "#f87171";
	return "rgba(240,240,240,0.35)";
}

function formatLastParsedAt(ms: number | undefined): string {
	if (ms == null) return "";
	const d = new Date(ms);
	const now = Date.now();
	const diffMs = now - ms;
	if (diffMs < 60_000) return "Just now";
	if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)} min ago`;
	if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)} hr ago`;
	return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function describeParseSource(parseSource?: "provider" | "fallback", parseFallbackReason?: "parser_error" | "invalid_schema" | null): string {
	if (!parseSource) return "";
	if (parseSource === "provider") return "Primary AI extracted your skills from the resume.";
	if (parseSource === "fallback") {
		if (parseFallbackReason === "parser_error") return "Fallback parser was used (primary AI could not read the file).";
		if (parseFallbackReason === "invalid_schema") return "Fallback parser was used (primary AI returned invalid structure).";
		return "Fallback parser was used.";
	}
	return "";
}

/** Human-readable labels for routing skill slugs (matches backend SUPPORTED_REQUEST_TYPES). */
const REQUEST_TYPE_LABELS: Record<string, string> = {
	billing_issue: "Billing issue",
	refund_request: "Refund request",
	technical_problem: "Technical problem",
	account_access: "Account access",
	feature_request: "Feature request",
	complaint: "Complaint",
	general_inquiry: "General inquiry",
};

function formatSkillsForDisplay(slugs: string[]): string {
	if (!slugs.length) return "";
	return slugs
		.map((slug) => REQUEST_TYPE_LABELS[slug] ?? slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
		.join(", ");
}

const LANGUAGE_LABELS: Record<string, string> = {
	en: "English",
	fil: "Filipino",
};

function formatLanguagesForDisplay(codes: string[]): string {
	if (!codes.length) return "";
	return codes.map((code) => LANGUAGE_LABELS[code] ?? code).join(", ");
}

async function uploadFileToConvex(uploadUrl: string, file: File) {
	const response = await fetch(uploadUrl, {
		method: "POST",
		headers: { "Content-Type": file.type },
		body: file,
	});
	if (!response.ok) throw new Error("Resume upload failed");
	const body = (await response.json()) as { storageId?: string };
	if (!body.storageId) throw new Error("Resume upload did not return a storage id");
	return body.storageId;
}

export function AgentProfileForm() {
	const { data: session } = authClient.useSession();
	const workspaceState = useQuery(
		getCurrentWorkspaceReference,
		session ? {} : "skip",
	);
	const snapshot = useQuery(
		getCurrentAgentProfileReference,
		session && workspaceState?.isMember ? {} : "skip",
	);
	const generateUploadUrl = useMutation(generateCurrentResumeUploadUrlReference);
	const saveResumeUpload = useMutation(saveCurrentResumeUploadReference);
	const parseCurrentResume = useAction(parseCurrentResumeReference);
	const [status, setStatus] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadPhase, setUploadPhase] = useState<"uploading" | "parsing" | null>(null);

	const profile = snapshot?.profile ?? null;
	const summary = useMemo(() => {
		if (!profile?.summary) {
			return "Upload a PDF resume to replace role-based routing defaults with your parsed skills.";
		}
		return profile.summary;
	}, [profile?.summary]);

	const isWorkspaceReady = session && workspaceState?.isMember;
	const isLoading =
		!session ||
		workspaceState === undefined ||
		(isWorkspaceReady && snapshot === undefined);

	if (!isWorkspaceReady && workspaceState && !workspaceState.isMember) {
		return (
			<div className="app-card p-5">
				<p className="app-body">
					Join or create a workspace to manage your agent profile and upload your
					resume for skill-based routing.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="app-card">
				<p className="app-loading">Loading agent profile…</p>
			</div>
		);
	}

	async function handleFileChange(file: File | null) {
		if (!file || isUploading) return;
		if (file.type !== "application/pdf") {
			setStatus("Please upload a PDF resume.");
			return;
		}
		if (file.size > 5_000_000) {
			setStatus("Resume must be 5 MB or smaller.");
			return;
		}
		setIsUploading(true);
		setStatus(null);
		setUploadPhase("uploading");
		try {
			const uploadUrl = await generateUploadUrl({});
			const storageId = await uploadFileToConvex(uploadUrl, file);
			await saveResumeUpload({
				storageId,
				resumeFileName: file.name,
				resumeMimeType: file.type,
			});
			setUploadPhase("parsing");
			const parsed = await parseCurrentResume({});
			setUploadPhase(null);
			setStatus(
				parsed.parseStatus === "ready"
					? "Resume uploaded and parsed. Routing will use your extracted skills."
					: parsed.parseError ?? "Resume uploaded but parsing failed.",
			);
		} catch (error) {
			setUploadPhase(null);
			setStatus(error instanceof Error ? error.message : "Unable to upload resume");
		} finally {
			setIsUploading(false);
		}
	}

	const parseStatus = profile?.parseStatus ?? "idle";
	const skillRows = [
		{ label: "Primary skills",   value: profile?.primarySkills?.length ? formatSkillsForDisplay(profile.primarySkills) : null },
		{ label: "Secondary skills", value: profile?.secondarySkills?.length ? formatSkillsForDisplay(profile.secondarySkills) : null },
		{ label: "Languages",        value: profile?.languages?.length ? formatLanguagesForDisplay(profile.languages) : null },
	];

	return (
		<div className="app-card">
			<div className="grid gap-6 p-5 lg:grid-cols-[1fr_280px]">
				{/* Left */}
				<div className="flex flex-col gap-5">
					<div>
						<p className="app-eyebrow mb-3">Resume PDF</p>
						<input
							type="file"
							accept="application/pdf"
							disabled={isUploading}
							onChange={(e) => void handleFileChange(e.currentTarget.files?.[0] ?? null)}
							className="app-file-input"
							title="Upload PDF resume"
							aria-label="Upload PDF resume"
						/>
					</div>

					{/* Status block */}
					<div
						className="flex flex-col gap-3 p-4"
						style={{
							background: "rgba(255,255,255,0.02)",
							border: "1px solid rgba(255,255,255,0.06)",
							borderRadius: "4px",
						}}
					>
						<div>
							<p className="app-field-label mb-2">Current status</p>
							<p
								style={{
									fontFamily: "var(--font-jetbrains-mono)",
									fontSize: "0.75rem",
									fontWeight: 600,
									color: statusColor(parseStatus),
								}}
							>
								{uploadPhase === "uploading"
									? "Uploading…"
									: uploadPhase === "parsing"
										? "AI is reading your resume…"
										: formatStatusLabel(parseStatus)}
							</p>
						</div>
						{profile?.resumeFileName && (
							<p className="app-body" style={{ fontSize: "0.75rem" }}>
								File: {profile.resumeFileName}
							</p>
						)}
						{status && (
							<p
								className="app-body"
								style={{
									fontSize: "0.75rem",
									color: status.includes("parsed") ? "#34d399" : status.includes("failed") ? "#f87171" : "rgba(240,240,240,0.6)",
								}}
							>
								{status}
							</p>
						)}
						{profile?.parseError && (
							<p className="app-feedback app-feedback--error" style={{ fontSize: "0.75rem" }}>
								{profile.parseError}
							</p>
						)}
						{/* AI parsing summary — what the AI did */}
						{(parseStatus === "ready" || parseStatus === "failed") && (profile?.parseSource ?? profile?.lastParsedAt) && (
							<div
								className="flex flex-col gap-2"
								style={{
									borderTop: "1px solid rgba(255,255,255,0.06)",
									paddingTop: "0.75rem",
									marginTop: "0.25rem",
								}}
							>
								<p className="app-field-label" style={{ fontSize: "0.7rem" }}>
									What the AI did
								</p>
								{parseStatus === "ready" && (
									<>
										<p className="app-body" style={{ fontSize: "0.75rem", color: "rgba(240,240,240,0.85)" }}>
											{describeParseSource(profile.parseSource, profile.parseFallbackReason)}
										</p>
										{profile.lastParsedAt != null && (
											<p className="app-body" style={{ fontSize: "0.7rem", color: "rgba(240,240,240,0.5)" }}>
												Last parsed {formatLastParsedAt(profile.lastParsedAt)}
											</p>
										)}
										<p className="app-body" style={{ fontSize: "0.7rem", color: "rgba(240,240,240,0.6)" }}>
											{profile.primarySkills.length} primary skill{profile.primarySkills.length !== 1 ? "s" : ""}, {profile.secondarySkills.length} secondary, {profile.languages.length} language{profile.languages.length !== 1 ? "s" : ""} extracted for routing.
										</p>
									</>
								)}
								{parseStatus === "failed" && (profile.parseSource ?? profile.parseFallbackReason) && (
									<p className="app-body" style={{ fontSize: "0.75rem", color: "rgba(240,240,240,0.7)" }}>
										{describeParseSource(profile.parseSource, profile.parseFallbackReason)}
									</p>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Right: parsed skills */}
				<div
					className="flex flex-col gap-4 p-4"
					style={{
						background: "rgba(255,255,255,0.02)",
						border: "1px solid rgba(255,255,255,0.06)",
						borderRadius: "4px",
					}}
				>
					<div>
						<p className="app-eyebrow mb-2">Parsed summary</p>
						<p className="app-body" style={{ fontSize: "0.8rem", color: "#f0f0f0" }}>
							{summary}
						</p>
					</div>

					<div className="flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
						{skillRows.map(({ label, value }) => (
							<div key={label}>
								<p className="app-field-label mb-1">{label}</p>
								<p className="app-body" style={{ fontSize: "0.8rem", color: value ? "#f0f0f0" : "rgba(240,240,240,0.25)" }}>
									{value ?? "Not parsed yet"}
								</p>
							</div>
						))}
					</div>

					<Button
						type="button"
						variant="outline"
						disabled={isUploading}
						className="w-full mt-auto"
					>
						{uploadPhase === "uploading"
							? "Uploading…"
							: uploadPhase === "parsing"
								? "AI reading resume…"
								: isUploading
									? "Please wait…"
									: "Upload new resume"}
					</Button>
				</div>
			</div>
		</div>
	);
}
