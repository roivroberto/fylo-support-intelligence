# Lead Team Profile Visibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a lead-only directory that shows every workspace member and their resume-backed routing profile status.

**Architecture:** Extend the existing agent profile backend with a lead-only workspace directory query, then add a new settings page and read-only directory component that render member rows with nullable profile snapshots. Reuse the current membership and profile data model so this feature is visibility-only and does not change the upload or routing flows.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Convex, Better Auth, Vitest.

**Execution Skills:** @superpowers/subagent-driven-development, @superpowers/verification-before-completion

---

### Task 1: Add lead-only backend team profile query

**Files:**
- Modify: `packages/backend/convex/agent_profiles.ts`
- Modify: `packages/backend/convex/agent_profiles_reference.ts`
- Test: `packages/backend/convex/lib/__tests__/team-profile-directory.test.ts`

**Step 1: Write the failing test**

Add tests covering:
- a lead can read all workspace members with mixed ready/missing states
- an agent gets `Forbidden`

**Step 2: Run test to verify it fails**

Run:

```bash
bunx vitest run --project backend --config ../../vitest.workspace.ts packages/backend/convex/lib/__tests__/team-profile-directory.test.ts
```

Expected: FAIL because the query and reference do not exist yet.

**Step 3: Write minimal implementation**

Add a new lead-only query that:
- resolves the current workspace membership
- checks `role === "lead"`
- reads memberships and agent profiles for the workspace
- returns summary counts plus member rows with nullable profiles

**Step 4: Run test to verify it passes**

Run:

```bash
bunx vitest run --project backend --config ../../vitest.workspace.ts packages/backend/convex/lib/__tests__/team-profile-directory.test.ts
```

Expected: PASS.

### Task 2: Add the lead-facing settings page and directory component

**Files:**
- Create: `apps/web/src/app/(app)/settings/team-profiles/page.tsx`
- Create: `apps/web/src/components/settings/team-profiles-directory.tsx`
- Create: `apps/web/src/components/settings/team-profiles-directory.test.tsx`
- Modify: `apps/web/src/app/(app)/layout.tsx`

**Step 1: Write the failing test**

Add frontend tests covering:
- rendering summary counts
- rendering ready and missing profile rows
- rendering role and status labels

**Step 2: Run test to verify it fails**

Run:

```bash
bunx vitest run --project web --config ../../vitest.workspace.ts apps/web/src/components/settings/team-profiles-directory.test.tsx
```

Expected: FAIL because the component/page do not exist yet.

**Step 3: Write minimal implementation**

Build a read-only page that:
- calls the new lead-only query
- renders operational summary cards
- renders a directory row/card per member
- adds a `Team profiles` link to the app shell

**Step 4: Run test to verify it passes**

Run:

```bash
bunx vitest run --project web --config ../../vitest.workspace.ts apps/web/src/components/settings/team-profiles-directory.test.tsx
```

Expected: PASS.

### Task 3: Verify end-to-end repo health

**Files:**
- Modify if needed: `docs/current-codebase-checklist.md`

**Step 1: Run full verification**

```bash
bun run test
bun run build
```

Expected: PASS.

**Step 2: Commit**

```bash
git add packages/backend/convex/agent_profiles.ts packages/backend/convex/agent_profiles_reference.ts packages/backend/convex/lib/__tests__/team-profile-directory.test.ts apps/web/src/app/(app)/settings/team-profiles/page.tsx apps/web/src/components/settings/team-profiles-directory.tsx apps/web/src/components/settings/team-profiles-directory.test.tsx apps/web/src/app/(app)/layout.tsx docs/plans/2026-03-08-lead-team-profile-visibility-design.md docs/plans/2026-03-08-lead-team-profile-visibility.md
git commit -m "feat: add lead team profile visibility"
```

Expected: commit succeeds with only this feature's files staged.
