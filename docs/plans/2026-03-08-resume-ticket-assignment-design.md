# Resume Ticket Assignment Design

## Context
- The app already has workspace memberships, live routing, recommended assignees, and a settings area, but worker skill profiles are still inferred from hardcoded role defaults in `packages/backend/convex/tickets.ts`.
- The user wants agents to upload their own resumes so the system can parse their skills and use that data for ticket assignment.
- The backend already uses a Google-hosted Gemma model through the Generative Language API for classification and draft generation, with strict JSON parsing and fallback behavior.

## Decision
- Add a self-serve agent profile flow under settings where the signed-in agent uploads a resume PDF.
- Store both the uploaded resume file and a normalized parsed agent profile so the original file remains available for debugging and future re-parsing.
- Use a Gemma-backed parsing action to extract structured skills, languages, and a short summary from the uploaded resume.
- Make the parsed profile the primary source for routing worker skills and languages once parsing succeeds, while preserving the current role-based defaults as a safe fallback.

## Why This Approach
- It satisfies the product request without introducing lead-managed profile editing, multi-file profile history, OCR, or manual skill-taxonomy tooling.
- Keeping the original file plus normalized fields makes the feature easier to debug and safer to evolve later.
- Reusing the existing Gemma HTTP integration pattern keeps dependencies small and matches the current backend architecture.
- Falling back to the current defaults ensures routing keeps working even when a resume is missing or parsing fails.

## Architecture
1. Add an `agentProfiles` table keyed by workspace and user.
2. Add authenticated profile queries and mutations for the current signed-in agent.
3. Upload resume PDFs into Convex storage through a short-lived upload URL.
4. Persist the uploaded file metadata on the agent profile, then invoke a backend action to parse the current resume.
5. Validate the parsed JSON through a strict schema before writing routing fields.
6. Update routing worker construction so parsed skills and languages override the current role defaults when the profile is ready.

## Data Model
- Add a new `agentProfiles` table with one row per `workspaceId + userId`.
- Store:
  - `workspaceId`
  - `userId`
  - `resumeStorageId`
  - `resumeFileName`
  - `resumeMimeType`
  - `resumeUploadedAt`
  - `parseStatus` (`idle`, `processing`, `ready`, `failed`)
  - `primarySkills[]`
  - `secondarySkills[]`
  - `languages[]`
  - `summary`
  - `parseSource` (`provider`, `fallback`)
  - `parseFallbackReason` (`parser_error`, `invalid_schema`, `null`)
  - `parseError`
  - `lastParsedAt`
- Add indexes for `by_workspaceId`, `by_userId`, and `by_workspaceId_userId`.

## Backend Flow
### Read path
1. Resolve the signed-in user and their single pilot workspace membership.
2. Read the current agent profile by `workspaceId + userId`.
3. Return profile metadata, parse status, and normalized routing fields.

### Upload path
1. Generate a Convex storage upload URL for the authenticated agent.
2. The browser uploads the selected PDF to that URL.
3. A mutation saves the returned `storageId` and file metadata onto the current user profile, resets parse state to `processing`, and clears prior parsed output.
4. The client invokes a parsing action for the current profile.

### Parse path
1. Validate the current user and membership.
2. Load the stored PDF blob from Convex storage.
3. Encode the file as base64 and send it to the Google Generative Language API with `gemma-3-27b-it` and a strict JSON prompt.
4. Parse and validate the returned JSON through a dedicated profile schema.
5. If valid, save normalized skills, languages, summary, and success metadata.
6. If parsing fails or returns invalid JSON, mark the profile `failed`, record the reason, and keep the uploaded file metadata intact.

## Routing Changes
- Replace the current hardcoded worker skill selection path with a profile-aware path.
- When an agent profile exists and `parseStatus === "ready"`, use:
  - `primarySkills` for worker `primary`
  - `secondarySkills` for worker `secondary`
  - `languages` for worker `languages`
- When no ready profile exists, fall back to the current role-based worker defaults.
- Keep capacity and load behavior unchanged.

## Frontend Changes
- Add a new route at `apps/web/src/app/(app)/settings/profile/page.tsx`.
- Add a new `AgentProfileForm` client component for:
  - selecting a PDF file
  - uploading it to Convex storage
  - saving metadata
  - triggering parsing
  - showing parse status and parsed results
- Update the app shell navigation so agents can find the new profile page.
- Keep the visual style aligned with the existing settings surfaces.

## Error Handling
- Reject missing or non-PDF uploads in the client and backend save mutation.
- Reject oversized files in the client for v1 with a conservative cap.
- If upload fails, keep the existing profile unchanged.
- If parsing fails, show a clear retry/re-upload message and keep routing on the existing fallback defaults.
- Never write AI output into routing fields until schema validation succeeds.

## Permissions
- Only the signed-in agent can upload or replace their own resume profile in v1.
- Leads and other users do not edit another agent's resume in this version.

## Verification
- Add backend tests for profile schema parsing, provider behavior, profile persistence, and routing fallback/profile override logic.
- Add frontend tests for the new profile form states and upload behavior.
- Run `bun run test` and `bun run build` before commit.

## Out Of Scope
- Lead-managed uploads for other agents
- OCR or scanned-image resume support
- Resume version history
- Manual skill editing UI
- Multi-workspace profile management
