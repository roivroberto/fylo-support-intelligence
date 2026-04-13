# Lead Team Profile Visibility Design

## Context
- The app now supports self-serve agent resume uploads and parsed routing profiles.
- Parsed profile data is already used by routing, but only the individual signed-in agent can currently view their own profile.
- Leads need a read-only operational view to inspect which agents have ready, failed, processing, or missing routing profiles.

## Decision
- Add a lead-only team directory page that lists every current workspace member and their profile status.
- Keep this feature read-only in v1: no reparsing, no overrides, no manual editing.
- Place it in settings as a new `Team profiles` page so it sits near policy/profile configuration while remaining easy to discover.

## Why This Approach
- It solves the visibility gap without introducing additional write permissions or audit complexity.
- It fits the current pilot access model, where role and workspace membership already define operational permissions.
- It gives leads a fast way to spot missing or broken profiles without changing the existing agent self-serve flow.

## Architecture
1. Add a lead-only backend query that resolves the viewer's pilot workspace membership.
2. Require the viewer to be a `lead` before returning any team profile data.
3. Join `memberships` with `agentProfiles` for the current workspace.
4. Return one row per member, including role and nullable profile snapshot.
5. Add a new settings page and read-only directory component that render grouped status and summary counts.

## Backend Design
- Create a query in `packages/backend/convex/agent_profiles.ts` for the current workspace lead.
- Return:
  - `workspaceId`
  - summary counts: `totalMembers`, `readyCount`, `processingCount`, `failedCount`, `missingCount`
  - `members`: array of rows with `userId`, `role`, `profile`
- `profile` contains the existing normalized fields:
  - `parseStatus`
  - `resumeFileName`
  - `primarySkills`
  - `secondarySkills`
  - `languages`
  - `summary`
  - `parseError`
  - `lastParsedAt`

## Permission Model
- Leads can view all workspace members and their profile state.
- Agents cannot access the team directory query.
- Members with no uploaded resume still appear with `profile: null`.

## Frontend Design
- Add `apps/web/src/app/(app)/settings/team-profiles/page.tsx`.
- Add a read-only `TeamProfilesDirectory` component under `apps/web/src/components/settings/`.
- Show summary metrics at the top for quick scanning.
- Show one row/card per member with:
  - user id / label
  - role
  - profile status badge
  - parsed summary when present
  - primary skills, secondary skills, languages
  - parse error or missing-profile message when relevant
- Keep the existing self-serve `Profile` page unchanged.

## UX Notes
- Visually emphasize `ready`, `processing`, `failed`, and `missing` states.
- Show all members, including leads, but make the status easy to scan so agents without profiles are obvious.
- Keep the page operational and compact rather than heavy or editorial.

## Error Handling
- Unauthorized access returns `Forbidden` from the backend query.
- Missing member profiles render as a normal `missing` state, not as an error.
- Failed profile parses render the stored parse error inline.

## Verification
- Add backend tests for:
  - lead-only access
  - mixed workspace members with ready/missing/failed profile combinations
- Add frontend tests for:
  - summary counts
  - rendering missing and ready states
  - role/status display
- Run `bun run test` and `bun run build` before commit.

## Out Of Scope
- Lead-triggered reparse
- Manual skill edits or overrides
- Resume download/open actions
- Filtering, sorting, or search beyond basic list order
