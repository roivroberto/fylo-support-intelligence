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
	if (status === "ready") {
		return "Parsed and ready for routing";
	}

	if (status === "processing") {
		return "Parsing resume now";
	}

	if (status === "failed") {
		return "Parsing failed";
	}

	return "No resume uploaded yet";
}

async function uploadFileToConvex(uploadUrl: string, file: File) {
	const response = await fetch(uploadUrl, {
		method: "POST",
		headers: {
			"Content-Type": file.type,
		},
		body: file,
	});

	if (!response.ok) {
		throw new Error("Resume upload failed");
	}

	const body = (await response.json()) as { storageId?: string };
	if (!body.storageId) {
		throw new Error("Resume upload did not return a storage id");
	}

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
			return "Upload a PDF resume to replace the current role-based routing defaults with your parsed skills.";
		}

		return profile.summary;
	}, [profile?.summary]);

	if (!snapshot) {
		return (
			<div className="border bg-card p-5 text-sm text-muted-foreground">
				Loading agent profile...
			</div>
		);
	}

	async function handleFileChange(file: File | null) {
		if (!file || isUploading) {
			return;
		}

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
			setStatus(
				error instanceof Error ? error.message : "Unable to upload resume",
			);
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<section className="border bg-card text-card-foreground">
			<div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
				<div className="grid gap-4">
					<div>
						<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
							Routing profile
						</p>
						<h2 className="mt-2 text-xl font-semibold tracking-tight">
							Upload your resume for assignment matching
						</h2>
						<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
							A parsed profile replaces the role-based defaults used in ticket assignment
							whenever your resume is ready.
						</p>
					</div>
					<label className="grid gap-2 text-sm">
						<span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
							Resume PDF
						</span>
						<input
							type="file"
							accept="application/pdf"
							disabled={isUploading}
							onChange={(event) =>
								void handleFileChange(event.currentTarget.files?.[0] ?? null)
							}
							className="border px-3 py-3 text-xs text-foreground file:mr-3 file:border-0 file:bg-transparent file:text-xs file:font-medium"
						/>
					</label>
					<div className="grid gap-3 border p-4 text-sm">
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
								Current status
							</p>
							<p className="mt-2 font-medium text-foreground">
								{formatStatusLabel(profile?.parseStatus ?? "idle")}
							</p>
						</div>
						{profile?.resumeFileName ? (
							<p className="text-muted-foreground">Latest file: {profile.resumeFileName}</p>
						) : null}
						{status ? <p className="text-foreground">{status}</p> : null}
						{profile?.parseError ? (
							<p className="text-destructive">{profile.parseError}</p>
						) : null}
					</div>
				</div>
				<div className="space-y-4 border p-4 text-sm">
					<div>
						<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
							Parsed summary
						</p>
						<p className="mt-2 text-foreground">{summary}</p>
					</div>
					<div className="grid gap-3 text-muted-foreground">
						<p>
							Primary skills: {profile?.primarySkills.join(", ") || "Not parsed yet"}
						</p>
						<p>
							Secondary skills: {profile?.secondarySkills.join(", ") || "Not parsed yet"}
						</p>
						<p>
							Languages: {profile?.languages.join(", ") || "Not parsed yet"}
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						disabled={isUploading}
						className="w-full"
					>
						{isUploading ? "Uploading and parsing..." : "Upload new resume"}
					</Button>
				</div>
			</div>
		</section>
	);
}
