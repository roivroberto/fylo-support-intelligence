# Pod Code Invite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let the first admin create a workspace and share a pod code so other users can join that workspace during sign-up or later from the signed-in home page.

**Architecture:** Reuse the existing single-workspace pilot model and treat the workspace `slug` as the shareable pod code. Add one current-workspace query, one onboarding mutation, and one join-by-code mutation, then wire the sign-up and home-page UI to those backend surfaces.

**Tech Stack:** Next.js App Router, Better Auth React client, Convex queries and mutations, Vitest, Playwright.

---

### Task 1: Add backend workspace onboarding and join surfaces

**Files:**
- Modify: `packages/backend/convex/workspaces.ts`
- Modify: `packages/backend/convex/memberships.ts`
- Create: `packages/backend/convex/workspaces_reference.ts`
- Modify: `packages/backend/convex/e2e.ts`
- Test: `packages/backend/convex/lib/__tests__/pod-code-invite.test.ts`

**Step 1: Write the failing tests**

Add backend tests for:

```ts
it("creates the first workspace and returns a pod code for the lead", () => {
  // ensureOnboardingWorkspace creates membership + slug-backed pod code
});

it("joins an existing workspace by pod code as an agent", () => {
  // joinWithPodCode finds workspace by slug and inserts membership
});

it("returns current workspace details for a member and empty state for a non-member", () => {
  // getCurrentWorkspace returns workspace metadata when joined
});
```

**Step 2: Run the focused backend test to verify it fails**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/pod-code-invite.test.ts --project backend --config ./vitest.workspace.ts`
Expected: FAIL with missing functions or wrong behavior.

**Step 3: Write minimal implementation**

- Add a pod code generator in `packages/backend/convex/workspaces.ts`.
- Add `getCurrentWorkspace` query returning:
  - `isMember`
  - `canCreateWorkspace`
  - `workspace` with `workspaceId`, `name`, `podCode`, and `role` when available
- Add `ensureOnboardingWorkspace` mutation that:
  - returns current workspace if already joined
  - creates the first workspace and lead membership if no workspace exists
  - otherwise returns an empty-state payload
- Add `joinWithPodCode` mutation in `packages/backend/convex/memberships.ts` that:
  - looks up the workspace by `slug`
  - inserts an `agent` membership if missing
  - returns the joined workspace payload
- Add matching references in `packages/backend/convex/workspaces_reference.ts`.
- Ensure `packages/backend/convex/e2e.ts` still creates workspaces with a valid slug/pod code.

**Step 4: Run the focused backend test to verify it passes**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/pod-code-invite.test.ts --project backend --config ./vitest.workspace.ts`
Expected: PASS.

**Step 5: Run a related backend regression check**

Run: `bun run test --project backend packages/backend/convex/lib/__tests__/pilot-workspace.test.ts packages/backend/convex/lib/__tests__/visibility.test.ts`
Expected: PASS.

### Task 2: Add signed-up and signed-in pod code UI

**Files:**
- Modify: `apps/web/src/components/auth/email-password-auth-form.tsx`
- Modify: `apps/web/src/app/sign-up/page.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/components/workspace/workspace-access-panel.tsx`
- Test: `apps/web/src/components/auth/email-password-auth-form.test.tsx`
- Test: `apps/web/src/app/sign-up/page.test.tsx`
- Test: `apps/web/src/components/workspace/workspace-access-panel.test.tsx`

**Step 1: Write the failing tests**

Add tests for:

```tsx
it("includes optional pod code in sign-up submissions", () => {
  // form passes podCode when filled in
});

it("joins with pod code after sign-up when provided", () => {
  // sign-up page calls join mutation then redirects
});

it("shows workspace details for members and join/create controls for non-members", () => {
  // root workspace panel renders based on query state
});
```

**Step 2: Run the focused web tests to verify they fail**

Run: `bun x vitest run apps/web/src/components/auth/email-password-auth-form.test.tsx apps/web/src/app/sign-up/page.test.tsx apps/web/src/components/workspace/workspace-access-panel.test.tsx --project web --config ./vitest.workspace.ts`
Expected: FAIL until the new UI and behavior exist.

**Step 3: Write minimal implementation**

- Extend the auth form input shape with optional `podCode` for sign-up mode.
- Update sign-up page to:
  - call Better Auth sign-up
  - if `podCode` exists, call `joinWithPodCode`
  - otherwise call `ensureOnboardingWorkspace`
  - redirect to `/` when no pod code was entered, otherwise redirect to the safe `next` path
- Replace the static home page with a workspace access panel.
- Build `workspace-access-panel.tsx` using Convex query/mutation hooks.

**Step 4: Run the focused web tests to verify they pass**

Run: `bun x vitest run apps/web/src/components/auth/email-password-auth-form.test.tsx apps/web/src/app/sign-up/page.test.tsx apps/web/src/components/workspace/workspace-access-panel.test.tsx --project web --config ./vitest.workspace.ts`
Expected: PASS.

**Step 5: Run related auth UI tests**

Run: `bun run test --project web apps/web/src/app/sign-in/page.test.tsx apps/web/src/components/header.test.tsx apps/web/src/lib/__tests__/auth-redirect.test.ts`
Expected: PASS.

### Task 3: Verify end-to-end pod code flow

**Files:**
- Modify: `apps/web/tests/e2e/auth-flow.spec.ts`
- Modify: `README.md`

**Step 1: Write the failing E2E assertions**

Update the auth E2E flow so it proves:

```ts
test("admin sign-up shows a pod code and invited user can join with it", async ({ browser }) => {
  // first user signs up, sees pod code on /
  // second user signs up with that code
  // second user reaches /visibility successfully
});
```

**Step 2: Run the E2E spec to verify it fails**

Run: `bunx playwright test apps/web/tests/e2e/auth-flow.spec.ts`
Expected: FAIL until the flow is wired.

**Step 3: Update docs**

- Add pod code onboarding notes to `README.md`.
- Document that `/` now acts as the minimal workspace onboarding/join surface.

**Step 4: Run final verification**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/pod-code-invite.test.ts apps/web/src/components/auth/email-password-auth-form.test.tsx apps/web/src/app/sign-up/page.test.tsx apps/web/src/components/workspace/workspace-access-panel.test.tsx --config ./vitest.workspace.ts`
Expected: PASS.

Run: `bunx playwright test apps/web/tests/e2e/auth-flow.spec.ts`
Expected: PASS.
