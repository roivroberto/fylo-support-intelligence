"use client";

import {
	generateCurrentResumeUploadUrlReference,
	parseCurrentResumeReference,
	saveCurrentResumeUploadReference,
} from "@Fylo/backend/convex/agent_profiles_reference";
import { joinWithPodCodeReference } from "@Fylo/backend/convex/memberships_reference";
import {
	ensureOnboardingWorkspaceReference,
	getCurrentWorkspaceReference,
} from "@Fylo/backend/convex/workspaces_reference";
import { useAction, useMutation, useQuery } from "convex/react";
import { ShieldCheck, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { authClient } from "../../lib/auth-client";
import "./onboarding.css";

type Step =
	| "role"
	| "lead-creating"
	| "lead-done"
	| "agent-resume"
	| "agent-joining"
	| "agent-done";

type Feedback = { type: "success" | "error"; message: string } | null;

async function uploadFileToConvex(uploadUrl: string, file: File) {
	const response = await fetch(uploadUrl, {
		method: "POST",
		headers: { "Content-Type": file.type },
		body: file,
	});
	if (!response.ok) throw new Error("Resume upload failed");
	const body = (await response.json()) as { storageId?: string };
	if (!body.storageId) throw new Error("Upload did not return a storage id");
	return body.storageId;
}

export default function OnboardingPage() {
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const router = useRouter();
	const workspaceState = useQuery(
		getCurrentWorkspaceReference,
		session ? {} : "skip",
	);

	const [step, setStep] = useState<Step>("role");
	const [feedback, setFeedback] = useState<Feedback>(null);
	const [isWorking, setIsWorking] = useState(false);

	const [generatedPodCode, setGeneratedPodCode] = useState<string | null>(
		null,
	);
	const [joinedWorkspaceName, setJoinedWorkspaceName] = useState<
		string | null
	>(null);

	const [resumeFile, setResumeFile] = useState<File | null>(null);
	const [podCodeInput, setPodCodeInput] = useState("");

	const ensureOnboardingWorkspace = useMutation(
		ensureOnboardingWorkspaceReference,
	);
	const joinWithPodCode = useMutation(joinWithPodCodeReference);
	const generateUploadUrl = useMutation(
		generateCurrentResumeUploadUrlReference,
	);
	const saveResumeUpload = useMutation(saveCurrentResumeUploadReference);
	const parseResume = useAction(parseCurrentResumeReference);

	useEffect(() => {
		// Only auto-redirect if user is already a member but hasn't just completed onboarding.
		// When on lead-done or agent-done, let them see the code/success and click "Continue" themselves.
		if (
			workspaceState?.isMember &&
			step !== "lead-done" &&
			step !== "agent-done"
		) {
			router.replace("/queue");
		}
	}, [workspaceState, router, step]);

	useEffect(() => {
		if (!isSessionPending && !session) {
			router.replace("/sign-up");
		}
	}, [isSessionPending, session, router]);

	async function handleSelectLead() {
		setFeedback(null);
		setIsWorking(true);
		setStep("lead-creating");
		try {
			const result = await ensureOnboardingWorkspace({});
			if (result.isMember && result.workspace) {
				setGeneratedPodCode(result.workspace.podCode);
				setJoinedWorkspaceName(result.workspace.name);
				setStep("lead-done");
			} else {
				setFeedback({
					type: "error",
					message: "Could not create workspace. Try again or join as a Team Agent.",
				});
				setStep("role");
			}
		} catch (error) {
			setFeedback({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Unable to create workspace",
			});
			setStep("role");
		} finally {
			setIsWorking(false);
		}
	}

	function handleSelectAgent() {
		setFeedback(null);
		setStep("agent-resume");
	}

	function handleResumeFileChange(file: File | null) {
		if (!file) return;
		if (file.type !== "application/pdf") {
			setFeedback({ type: "error", message: "Please upload a PDF resume." });
			return;
		}
		if (file.size > 5_000_000) {
			setFeedback({
				type: "error",
				message: "Resume must be 5 MB or smaller.",
			});
			return;
		}
		setFeedback(null);
		setResumeFile(file);
	}

	async function handleAgentJoin(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const code = podCodeInput.trim();
		if (!code) {
			setFeedback({ type: "error", message: "Enter a workspace code." });
			return;
		}

		setFeedback(null);
		setIsWorking(true);
		setStep("agent-joining");

		try {
			const result = await joinWithPodCode({ podCode: code });

			if (!result.isMember) {
				setFeedback({
					type: "error",
					message: "Could not join workspace with that code.",
				});
				setStep("agent-resume");
				return;
			}

			if (resumeFile) {
				try {
					const uploadUrl = await generateUploadUrl({});
					const storageId = await uploadFileToConvex(uploadUrl, resumeFile);
					await saveResumeUpload({
						storageId,
						resumeFileName: resumeFile.name,
						resumeMimeType: resumeFile.type,
					});
					void parseResume({});
				} catch {
					// Resume upload is non-fatal — agent can re-upload from settings
				}
			}

			setJoinedWorkspaceName(result.workspace?.name ?? "Workspace");
			setStep("agent-done");
		} catch (error) {
			setFeedback({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Unable to join workspace",
			});
			setStep("agent-resume");
		} finally {
			setIsWorking(false);
		}
	}

	if (isSessionPending || !session || workspaceState === undefined) {
		return (
			<div className="onboarding-page">
				<div className="grain" />
				<div className="onboarding-center">
					<p className="onboarding-loading">Loading…</p>
				</div>
			</div>
		);
	}

	return (
		<div className="onboarding-page">
			<div className="grain" />

			<div className="onboarding-brand">
				<Image
					src="/white_fylo.svg"
					alt="Fylo"
					width={0}
					height={0}
					sizes="100vw"
					style={{ width: "auto", height: "22px" }}
					priority
				/>
			</div>

			<div className="onboarding-center">
				{/* ── Role selection ── */}
				{step === "role" && (
					<div className="onboarding-card onboarding-card--wide">
						<div className="onboarding-card-head">
							<p className="onboarding-eyebrow">Get started</p>
							<h1 className="onboarding-title">Choose your role</h1>
							<p className="onboarding-sub">
								This determines how you'll interact with your workspace.
							</p>
						</div>

						<div className="onboarding-roles">
							<button
								type="button"
								className="role-option"
								disabled={isWorking}
								onClick={handleSelectLead}
							>
								<div className="role-option-icon role-option-icon--lead">
									<ShieldCheck size={24} />
								</div>
								<h3 className="role-option-title">Team Lead</h3>
								<p className="role-option-desc">
									Create a workspace and invite your team with a unique code.
								</p>
							</button>

							<button
								type="button"
								className="role-option"
								disabled={isWorking}
								onClick={handleSelectAgent}
							>
								<div className="role-option-icon role-option-icon--agent">
									<Users size={24} />
								</div>
								<h3 className="role-option-title">Team Agent</h3>
								<p className="role-option-desc">
									Upload your resume and join an existing team's workspace.
								</p>
							</button>
						</div>

						{feedback && (
							<FeedbackMessage feedback={feedback} />
						)}
					</div>
				)}

				{/* ── Lead: creating ── */}
				{step === "lead-creating" && (
					<div className="onboarding-card">
						<div className="onboarding-card-head">
							<p className="onboarding-eyebrow">Setting up</p>
							<h1 className="onboarding-title">Creating workspace…</h1>
						</div>
						<p className="onboarding-loading">
							Generating your workspace code…
						</p>
					</div>
				)}

				{/* ── Lead: done ── */}
				{step === "lead-done" && generatedPodCode && (
					<div className="onboarding-card">
						<div className="onboarding-card-head">
							<p className="onboarding-eyebrow">Workspace ready</p>
							<h1 className="onboarding-title">You're all set</h1>
							<p className="onboarding-sub">
								Share this code with your team so they can join your workspace.
							</p>
						</div>

						<div className="pod-code-display">
							<span className="pod-code-label">Your workspace code</span>
							<code className="pod-code-value">{generatedPodCode}</code>
						</div>

						<Button
							className="onboarding-continue"
							onClick={() => router.push("/queue")}
						>
							Continue to dashboard
						</Button>
					</div>
				)}

				{/* ── Agent: resume + pod code ── */}
				{step === "agent-resume" && (
					<div className="onboarding-card">
						<div className="onboarding-card-head">
							<p className="onboarding-eyebrow">Agent setup</p>
							<h1 className="onboarding-title">Upload & join</h1>
							<p className="onboarding-sub">
								Upload your resume for skill-based routing, then enter your
								team's workspace code.
							</p>
						</div>

						<form
							className="onboarding-agent-form"
							onSubmit={handleAgentJoin}
						>
							<div className="onboarding-field">
								<Label htmlFor="onboarding-resume">Resume (PDF)</Label>
								<div className="onboarding-file-zone">
									{resumeFile ? (
										<div className="onboarding-file-selected">
											<span className="onboarding-file-name">
												{resumeFile.name}
											</span>
											<button
												type="button"
												className="onboarding-file-remove"
												onClick={() => setResumeFile(null)}
											>
												Remove
											</button>
										</div>
									) : (
										<input
											id="onboarding-resume"
											type="file"
											accept="application/pdf"
											title="Upload resume PDF"
											className="onboarding-file-input"
											onChange={(e) =>
												handleResumeFileChange(
													e.currentTarget.files?.[0] ?? null,
												)
											}
										/>
									)}
								</div>
							</div>

							<div className="onboarding-field">
								<Label htmlFor="onboarding-pod-code">Workspace code</Label>
								<Input
									id="onboarding-pod-code"
									autoComplete="off"
									placeholder="pod-abc12345"
									disabled={isWorking}
									value={podCodeInput}
									onChange={(e) => setPodCodeInput(e.currentTarget.value)}
								/>
							</div>

							<Button
								type="submit"
								disabled={isWorking}
								className="onboarding-continue"
							>
								{isWorking ? "Joining…" : "Join workspace"}
							</Button>
						</form>

						{feedback && <FeedbackMessage feedback={feedback} />}

						<button
							type="button"
							className="onboarding-back"
							onClick={() => {
								setStep("role");
								setFeedback(null);
							}}
						>
							← Back to role selection
						</button>
					</div>
				)}

				{/* ── Agent: joining ── */}
				{step === "agent-joining" && (
					<div className="onboarding-card">
						<div className="onboarding-card-head">
							<p className="onboarding-eyebrow">Joining</p>
							<h1 className="onboarding-title">Setting up your profile…</h1>
						</div>
						<p className="onboarding-loading">
							Joining workspace
							{resumeFile ? " and uploading resume" : ""}…
						</p>
					</div>
				)}

				{/* ── Agent: done ── */}
				{step === "agent-done" && (
					<div className="onboarding-card">
						<div className="onboarding-card-head">
							<p className="onboarding-eyebrow">Welcome aboard</p>
							<h1 className="onboarding-title">You're in</h1>
							<p className="onboarding-sub">
								You've joined <strong>{joinedWorkspaceName}</strong>.
								{resumeFile
									? " Your resume is being parsed for skill-based routing."
									: " You can upload a resume later from your profile settings."}
							</p>
						</div>

						<Button
							className="onboarding-continue"
							onClick={() => router.push("/queue")}
						>
							Continue to dashboard
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
	if (!feedback) return null;
	return (
		<p
			aria-live="polite"
			className={`onboarding-feedback ${
				feedback.type === "error"
					? "onboarding-feedback--error"
					: "onboarding-feedback--success"
			}`}
		>
			{feedback.message}
		</p>
	);
}
