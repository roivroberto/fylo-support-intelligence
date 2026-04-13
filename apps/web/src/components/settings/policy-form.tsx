"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";

import {
	getCurrentPolicyReference,
	saveCurrentPolicyReference,
} from "../../../../../packages/backend/convex/policies_reference";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const DEFAULT_POLICY = {
	autoAssignThreshold: 0.8,
	maxAssignmentsPerWorker: 8,
	requireLeadReview: true,
	allowSecondarySkills: true,
};

export function PolicyForm() {
	const policySnapshot = useQuery(getCurrentPolicyReference, {});
	const savePolicy = useMutation(saveCurrentPolicyReference);
	const [policy, setPolicy] = useState(DEFAULT_POLICY);
	const [isSaving, setIsSaving] = useState(false);
	const [saveLabel, setSaveLabel] = useState<string | null>(null);

	useEffect(() => {
		if (policySnapshot?.policy) {
			setPolicy(policySnapshot.policy);
		}
	}, [
		policySnapshot?.policy.autoAssignThreshold,
		policySnapshot?.policy.maxAssignmentsPerWorker,
		policySnapshot?.policy.requireLeadReview,
		policySnapshot?.policy.allowSecondarySkills,
	]);

	const summary = useMemo(() => {
		const pct = Math.round(policy.autoAssignThreshold * 100);
		return `${pct}% confidence unlocks direct assignment. ${policy.maxAssignmentsPerWorker} active tickets per worker keeps load visible.`;
	}, [policy.autoAssignThreshold, policy.maxAssignmentsPerWorker]);

	if (!policySnapshot) {
		return (
			<div className="app-card">
				<p className="app-loading">Loading routing policy…</p>
			</div>
		);
	}

	const canManage = policySnapshot.canManage;

	async function handleSave() {
		setIsSaving(true);
		setSaveLabel(null);
		try {
			await savePolicy(policy);
			setSaveLabel("Policy saved");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="app-card">
			<div className="grid gap-6 p-5 lg:grid-cols-[1fr_280px]">
				{/* Fields */}
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="flex flex-col gap-2">
						<Label htmlFor="auto-assign-threshold">Auto-assign threshold</Label>
						<Input
							id="auto-assign-threshold"
							type="number"
							min={0.6}
							max={0.95}
							step={0.05}
							value={policy.autoAssignThreshold}
							disabled={!canManage || isSaving}
							onChange={(e) =>
								setPolicy((p) => ({
									...p,
									autoAssignThreshold: Number(e.currentTarget.value),
								}))
							}
						/>
						<p className="app-body" style={{ fontSize: "0.75rem" }}>
							Higher = more edge cases go to review.
						</p>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="max-assignments">Max tickets per worker</Label>
						<Input
							id="max-assignments"
							type="number"
							min={1}
							max={20}
							step={1}
							value={policy.maxAssignmentsPerWorker}
							disabled={!canManage || isSaving}
							onChange={(e) =>
								setPolicy((p) => ({
									...p,
									maxAssignmentsPerWorker: Number(e.currentTarget.value),
								}))
							}
						/>
						<p className="app-body" style={{ fontSize: "0.75rem" }}>
							Visible cap prevents quiet overload.
						</p>
					</div>

					<label className="app-checkbox-label sm:col-span-2 lg:col-span-1">
						<input
							type="checkbox"
							checked={policy.requireLeadReview}
							disabled={!canManage || isSaving}
							onChange={(e) =>
								setPolicy((p) => ({
									...p,
									requireLeadReview: e.currentTarget.checked,
								}))
							}
						/>
						<span>
							<span className="app-h3" style={{ display: "block", marginBottom: "0.25rem" }}>
								Require lead review for exceptions
							</span>
							<span className="app-body" style={{ fontSize: "0.75rem" }}>
								Keeps sensitive routing changes visible while the pilot is learning.
							</span>
						</span>
					</label>

					<label className="app-checkbox-label sm:col-span-2 lg:col-span-1">
						<input
							type="checkbox"
							checked={policy.allowSecondarySkills}
							disabled={!canManage || isSaving}
							onChange={(e) =>
								setPolicy((p) => ({
									...p,
									allowSecondarySkills: e.currentTarget.checked,
								}))
							}
						/>
						<span>
							<span className="app-h3" style={{ display: "block", marginBottom: "0.25rem" }}>
								Allow secondary-skill coverage
							</span>
							<span className="app-body" style={{ fontSize: "0.75rem" }}>
								Useful for backlog relief when primary owners are full.
							</span>
						</span>
					</label>
				</div>

				{/* Side panel */}
				<div
					className="flex flex-col gap-4 p-4"
					style={{
						background: "rgba(255,255,255,0.02)",
						border: "1px solid rgba(255,255,255,0.06)",
						borderRadius: "4px",
					}}
				>
					<div>
						<p className="app-eyebrow mb-2">Pilot impact</p>
						<p className="app-body" style={{ fontSize: "0.8rem", color: "#f0f0f0" }}>
							{summary}
						</p>
					</div>
					<p className="app-body" style={{ fontSize: "0.8rem" }}>
						Controls read and write the current workspace policy.
					</p>
					{saveLabel && (
						<p className="app-feedback app-feedback--success">{saveLabel}</p>
					)}
					{!canManage && (
						<p className="app-feedback app-feedback--error" style={{ color: "#fbbf24" }}>
							Read-only — lead access required to save.
						</p>
					)}
					<Button
						type="button"
						disabled={!canManage || isSaving}
						onClick={() => void handleSave()}
						className="w-full mt-auto"
					>
						{isSaving ? "Saving…" : "Save policy"}
					</Button>
				</div>
			</div>
		</div>
	);
}
