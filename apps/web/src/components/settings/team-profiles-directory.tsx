import type {
	TeamProfileDirectoryMember,
	TeamProfileDirectorySummary,
} from "@Fylo/backend/convex/agent_profiles_reference";

type TeamProfilesDirectoryProps = {
	summary: TeamProfileDirectorySummary;
	members: TeamProfileDirectoryMember[];
};

type ResolvedDirectoryStatus = {
	label: string;
	toneClassName: string;
	detail: string;
};

const statusConfig = {
	ready: {
		label: "Ready",
		toneClassName: "text-foreground",
		fallbackDetail: "Resume is on file",
	},
	processing: {
		label: "Processing",
		toneClassName: "text-muted-foreground",
		fallbackDetail: "Resume parsing in progress",
	},
	failed: {
		label: "Needs attention",
		toneClassName: "text-destructive",
		fallbackDetail: "Resume needs another upload",
	},
	idle: {
		label: "On file",
		toneClassName: "text-muted-foreground",
		fallbackDetail: "Resume uploaded and waiting for parsing",
	},
} as const;

function formatRoleLabel(role: TeamProfileDirectoryMember["role"]) {
	return role === "lead" ? "Lead" : "Agent";
}

function resolveMemberStatus(
	member: TeamProfileDirectoryMember,
): ResolvedDirectoryStatus {
	if (!member.profile) {
		return {
			label: "Missing",
			toneClassName: "text-muted-foreground",
			detail: "No resume uploaded",
		};
	}

	switch (member.profile.parseStatus) {
		case "ready":
		case "processing":
		case "idle": {
			const config = statusConfig[member.profile.parseStatus];
			return {
				label: config.label,
				toneClassName: config.toneClassName,
				detail: member.profile.summary ?? config.fallbackDetail,
			};
		}
		case "failed": {
			const config = statusConfig.failed;
			return {
				label: config.label,
				toneClassName: config.toneClassName,
				detail: member.profile.parseError ?? config.fallbackDetail,
			};
		}
		default: {
			const exhaustiveCheck: never = member.profile.parseStatus;
			return exhaustiveCheck;
		}
	}
}

export function TeamProfilesDirectory({
	summary,
	members,
}: TeamProfilesDirectoryProps) {
	return (
		<section className="border bg-card text-card-foreground">
			<div className="border-b px-4 py-4 sm:px-5">
				<h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
					Team profile coverage
				</h3>
			</div>
			<div className="grid gap-px border-b bg-border sm:grid-cols-4">
				<div className="bg-card px-4 py-3 text-sm">
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						Coverage
					</p>
					<p className="mt-2 font-medium text-foreground">
						{summary.totalMembers} teammate{summary.totalMembers === 1 ? "" : "s"}
					</p>
				</div>
				<div className="bg-card px-4 py-3 text-sm">
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						Ready
					</p>
					<p className="mt-2 font-medium text-foreground">{summary.readyCount} ready</p>
				</div>
				<div className="bg-card px-4 py-3 text-sm">
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						Processing
					</p>
					<p className="mt-2 font-medium text-foreground">
						{summary.processingCount} processing
					</p>
				</div>
				<div className="bg-card px-4 py-3 text-sm">
					<p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
						Missing
					</p>
					<p className="mt-2 font-medium text-foreground">{summary.missingCount} missing</p>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full min-w-[640px] border-collapse" aria-label="Team profiles directory">
					<thead>
						<tr className="border-b text-left">
							<th
								scope="col"
								className="px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
							>
								Team member
							</th>
							<th
								scope="col"
								className="px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
							>
								Role
							</th>
							<th
								scope="col"
								className="px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
							>
								Status
							</th>
						</tr>
					</thead>
					<tbody>
						{members.map((member) => {
							const resolvedStatus = resolveMemberStatus(member);

							return (
								<tr key={member.userId} className="border-b align-top last:border-b-0">
									<th scope="row" className="px-4 py-4 text-left font-normal">
										<div className="min-w-0">
											<div className="flex min-w-0 flex-wrap items-center gap-2">
												<p className="min-w-0 break-all font-medium text-foreground">
													{member.userId}
												</p>
												{member.profile?.resumeFileName ? (
													<span className="max-w-full truncate text-xs text-muted-foreground sm:max-w-[220px]">
														{member.profile.resumeFileName}
													</span>
												) : null}
											</div>
											<p className="mt-1 break-words text-sm text-muted-foreground">
												{resolvedStatus.detail}
											</p>
										</div>
									</th>
									<td className="px-4 py-4 text-sm font-medium text-foreground">
										{formatRoleLabel(member.role)}
									</td>
									<td className={`px-4 py-4 text-sm font-medium ${resolvedStatus.toneClassName}`}>
										{resolvedStatus.label}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</section>
	);
}
