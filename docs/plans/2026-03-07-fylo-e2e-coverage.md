# Fylo E2E Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand Playwright coverage for the real Fylo app by adding a guarded E2E bootstrap flow that creates an authenticated Better Auth session and seeded Convex data for authenticated routes.

**Architecture:** Add a test-only Next.js bootstrap route that signs up or signs in through the real Better Auth handler, then seeds deterministic Convex data through a guarded dev-only mutation. Use that bootstrap flow from new Playwright tests to cover public routes, authenticated route loading, policy persistence, and ticket detail rendering without sending outbound email.

**Tech Stack:** Next.js App Router, Better Auth, Convex, Playwright, Vitest

---

### Task 1: Add failing E2E coverage

**Files:**
- Create: `apps/web/tests/e2e/pilot-app.spec.ts`

**Step 1: Write the failing test**
- Add Playwright coverage for `/`, `/queue`, `/review`, `/visibility`, `/settings/policy`, and `/tickets/[ticketId]` via a future bootstrap route.

**Step 2: Run test to verify it fails**
- Run: `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts`
- Expected: authenticated tests fail because the bootstrap route does not exist yet.

**Step 3: Write minimal implementation**
- None in this task.

**Step 4: Run test to verify it passes**
- Deferred until later tasks.

### Task 2: Implement guarded auth + seed bootstrap

**Files:**
- Create: `apps/web/src/app/api/e2e/bootstrap/route.ts`
- Create: `packages/backend/convex/e2e.ts`
- Create: `packages/backend/convex/e2e_reference.ts`
- Modify: `playwright.shared.cjs`

**Step 1: Write the failing test**
- Reuse the Playwright failures from Task 1.

**Step 2: Run test to verify it fails**
- Confirm the failures are due to missing bootstrap support.

**Step 3: Write minimal implementation**
- Add a GET route that is enabled only for E2E/dev mode and protected by a shared secret.
- Have the route create a real Better Auth session cookie by calling the auth handler’s email sign-up/sign-in endpoints.
- Seed deterministic workspace, memberships, policy, message, ticket, and note data through a guarded Convex mutation.

**Step 4: Run test to verify it passes**
- Run: `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts --grep "loads seeded authenticated routes"`

### Task 3: Finish policy and ticket-detail behavior coverage

**Files:**
- Modify: `apps/web/tests/e2e/pilot-app.spec.ts`

**Step 1: Write the failing test**
- Keep the policy persistence and ticket detail assertions failing until seed/bootstrap are fully wired.

**Step 2: Run test to verify it fails**
- Run focused Playwright tests for policy persistence and ticket detail rendering.

**Step 3: Write minimal implementation**
- Adjust seeded data or config only as needed for stable route loading and persistence assertions.

**Step 4: Run test to verify it passes**
- Run: `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts`

### Task 4: Verify directly affected unit tests

**Files:**
- Modify if needed: `apps/web/playwright.config.test.ts`

**Step 1: Run affected tests**
- Run: `bun run test --project web --config ../../vitest.workspace.ts --passWithNoTests`
- Or run the specific affected Vitest files if only config expectations changed.

**Step 2: Confirm all direct checks pass**
- Keep the touched E2E and Vitest coverage green before wrapping up.
