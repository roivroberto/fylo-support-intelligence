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
		const autoAssignPercent = Math.round(policy.autoAssignThreshold * 100);

		return `${autoAssignPercent}% confidence unlocks direct assignment. ${policy.maxAssignmentsPerWorker} active tickets per worker keeps load visible.`;
	}, [policy.autoAssignThreshold, policy.maxAssignmentsPerWorker]);

	if (!policySnapshot) {
		return (
			<div className="border bg-card p-5 text-sm text-muted-foreground">
				Loading current routing policy...
			</div>
		);
	}

	const canManage = policySnapshot.canManage;

	async function handleSave() {
		setIsSaving(true);
		setSaveLabel(null);

		try {
			await savePolicy(policy);
			setSaveLabel("Saved to routing policy");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<form className="border bg-card text-card-foreground">
			<div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="auto-assign-threshold">Auto-assign threshold</Label>
						<Input
							id="auto-assign-threshold"
							type="number"
							min={0.6}
							max={0.95}
							step={0.05}
							value={policy.autoAssignThreshold}
							disabled={!canManage || isSaving}
							onChange={(event) => {
								const autoAssignThreshold = Number(event.currentTarget.value);

								setPolicy((current) => ({
									...current,
									autoAssignThreshold,
								}));
							}}
						/>
						<p className="text-xs text-muted-foreground">
							Higher thresholds keep more edge cases in human review.
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="max-assignments">
							Max active tickets per worker
						</Label>
						<Input
							id="max-assignments"
							type="number"
							min={1}
							max={20}
							step={1}
							value={policy.maxAssignmentsPerWorker}
							disabled={!canManage || isSaving}
							onChange={(event) => {
								const maxAssignmentsPerWorker = Number(
									event.currentTarget.value,
								);

								setPolicy((current) => ({
									...current,
									maxAssignmentsPerWorker,
								}));
							}}
						/>
						<p className="text-xs text-muted-foreground">
							A visible cap helps the pilot avoid quiet overload.
						</p>
					</div>
					<label className="flex items-start gap-3 border p-3 text-sm">
						<input
							type="checkbox"
							checked={policy.requireLeadReview}
							disabled={!canManage || isSaving}
							onChange={(event) => {
								const requireLeadReview = event.currentTarget.checked;

								setPolicy((current) => ({
									...current,
									requireLeadReview,
								}));
							}}
						/>
						<span>
							<span className="block font-medium text-foreground">
								Require lead review for policy exceptions
							</span>
							<span className="mt-1 block text-xs text-muted-foreground">
								Keeps sensitive routing changes visible while the pilot is still
								learning.
							</span>
						</span>
					</label>
					<label className="flex items-start gap-3 border p-3 text-sm">
						<input
							type="checkbox"
							checked={policy.allowSecondarySkills}
							disabled={!canManage || isSaving}
							onChange={(event) => {
								const allowSecondarySkills = event.currentTarget.checked;

								setPolicy((current) => ({
									...current,
									allowSecondarySkills,
								}));
							}}
						/>
						<span>
							<span className="block font-medium text-foreground">
								Allow secondary-skill coverage
							</span>
							<span className="mt-1 block text-xs text-muted-foreground">
								Useful for backlog relief when the primary owner pool is full.
							</span>
						</span>
					</label>
				</div>
				<div className="space-y-4 border p-4 text-sm">
					<div>
						<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
							Pilot impact
						</p>
						<p className="mt-2 text-sm text-foreground">{summary}</p>
					</div>
					<div className="space-y-2 text-muted-foreground">
						<p>
							These controls now read and write the current workspace policy.
						</p>
						<p>
							Single-workspace v1 keeps this surface focused on one team view.
						</p>
						{saveLabel ? <p className="text-foreground">{saveLabel}</p> : null}
					</div>
					<Button
						type="button"
						variant="outline"
						className="w-full"
						disabled={!canManage || isSaving}
						onClick={() => void handleSave()}
					>
						{isSaving ? "Saving..." : "Save policy"}
					</Button>
				</div>
			</div>
		</form>
	);
}
