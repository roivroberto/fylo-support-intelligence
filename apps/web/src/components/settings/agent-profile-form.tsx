"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";

import {
	generateCurrentResumeUploadUrlReference,
	getCurrentAgentProfileReference,
	parseCurrentResumeReference,
	saveCurrentResumeUploadReference,
} from "@Fylo/backend/convex/agent_profiles_reference";

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
	const snapshot = useQuery(getCurrentAgentProfileReference, {});
	const generateUploadUrl = useMutation(generateCurrentResumeUploadUrlReference);
	const saveResumeUpload = useMutation(saveCurrentResumeUploadReference);
	const parseCurrentResume = useAction(parseCurrentResumeReference);
	const [status, setStatus] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const profile = snapshot?.profile ?? null;
	const summary = useMemo(() => {
		if (!profile?.summary) {
			return "Upload a PDF resume to replace role-based routing defaults with your parsed skills.";
		}
		return profile.summary;
	}, [profile?.summary]);

	if (!snapshot) {
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
		try {
			const uploadUrl = await generateUploadUrl({});
			const storageId = await uploadFileToConvex(uploadUrl, file);
			await saveResumeUpload({
				storageId,
				resumeFileName: file.name,
				resumeMimeType: file.type,
			});
			const parsed = await parseCurrentResume({});
			setStatus(
				parsed.parseStatus === "ready"
					? "Resume uploaded and parsed. Routing will use your extracted skills."
					: parsed.parseError ?? "Resume uploaded but parsing failed.",
			);
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Unable to upload resume");
		} finally {
			setIsUploading(false);
		}
	}

	const parseStatus = profile?.parseStatus ?? "idle";
	const skillRows = [
		{ label: "Primary skills",   value: profile?.primarySkills.join(", ")   || null },
		{ label: "Secondary skills", value: profile?.secondarySkills.join(", ") || null },
		{ label: "Languages",        value: profile?.languages.join(", ")        || null },
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
								{formatStatusLabel(parseStatus)}
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
						{isUploading ? "Uploading and parsing…" : "Upload new resume"}
					</Button>
				</div>
			</div>
		</div>
	);
}
