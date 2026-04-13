# Pod Code Invite Design

## Context
- The app already has Better Auth sign-in and sign-up pages, but it does not have a real workspace onboarding or invite flow.
- Backend workspace and membership tables already exist in `packages/backend/convex/schema.ts`, `packages/backend/convex/workspaces.ts`, and `packages/backend/convex/memberships.ts`.
- The current pilot is explicitly single-workspace, so the smallest safe feature is one workspace with one shareable code rather than a full invite system.

## Decision
- Treat the workspace `slug` as the inviteable pod code instead of introducing a second code field.
- Add a minimal authenticated workspace query plus two mutations:
  - `ensureOnboardingWorkspace`: create the first workspace for the first signed-in admin and return its pod code.
  - `joinWithPodCode`: let an authenticated user join the existing workspace as an `agent` by entering the code.
- Add a lightweight signed-in workspace card on `/` that shows the pod code for members and shows a join form for non-members.
- Update sign-up so entering a pod code joins the workspace immediately after account creation. If no code is entered, sign-up attempts onboarding workspace creation and then sends the user to `/`.

## Why This Approach
- It matches the requested feature without building invite expiration, invite management, email invitations, or workspace switching.
- Reusing `slug` avoids a schema migration for existing workspaces and keeps lookup simple with the existing `by_slug` index.
- Putting the fallback signed-in join/create UI on `/` avoids protected-route failures for newly signed-in users who do not yet belong to a workspace.

## User Flow
- New admin signs up without a pod code.
- After sign-up, the app calls `ensureOnboardingWorkspace`.
- If no workspace exists yet, the mutation creates one, makes the user a `lead`, and returns the generated pod code.
- The user lands on `/` and sees their workspace card with the pod code to share.
- An invited user signs up with that code, or signs in and enters it on `/`, and the app joins them to the workspace as an `agent`.

## Backend Changes
- Extend `packages/backend/convex/workspaces.ts` with:
  - pod code generation helper
  - `getCurrentWorkspace` query
  - `ensureOnboardingWorkspace` mutation
- Extend `packages/backend/convex/memberships.ts` with `joinWithPodCode` mutation.
- Add `packages/backend/convex/workspaces_reference.ts` so the web app can import stable references consistently with the rest of the repo.
- Update `packages/backend/convex/e2e.ts` so seeded workspaces also get a slug/pod code when created.

## Frontend Changes
- Replace the static `/` page with a small signed-in workspace card component.
- Add a reusable workspace join/create panel component for:
  - showing workspace name, role, and pod code when the user is already a member
  - showing a join form when the user is signed in but not yet a member
  - showing a create-workspace button when no workspace exists yet
- Update `apps/web/src/app/sign-up/page.tsx` and `apps/web/src/components/auth/email-password-auth-form.tsx` so sign-up accepts an optional pod code.

## Error Handling
- Invalid pod code: show inline `Invalid pod code`.
- Already joined: treat as success and return the current workspace.
- Workspace already exists during onboarding: do not create another workspace; return a state that leaves the user on `/` to enter a code.
- Unauthenticated calls continue to fail through existing Convex auth checks.

## Testing
- Add backend tests for onboarding creation, current workspace state, and join-by-code behavior.
- Add web tests for the updated sign-up flow and the workspace panel states.
- Add one Playwright flow proving an admin can sign up, receive a pod code, and a second user can sign up with that code and access a protected workspace route.

## Out Of Scope
- Multiple workspaces per user
- Rotating or expiring invite codes
- Invite emails
- Full onboarding wizard or admin workspace settings
