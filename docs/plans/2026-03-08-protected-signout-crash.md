# Protected Sign-Out Crash Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent the app from crashing when a signed-in user clicks `Sign out` while viewing protected, live-query-backed routes like `/visibility` and `/settings/policy`.

**Architecture:** The root cause is that `authClient.signOut()` currently runs client-side in the header without forcing a route transition or refresh. That leaves protected pages with mounted Convex `useQuery` subscriptions alive long enough to re-run unauthenticated and throw. Fix the flow at the source by making sign-out explicitly transition to a safe public route, add regression coverage for the header behavior, and verify the protected routes no longer surface client-side application errors after sign-out.

**Tech Stack:** Next.js App Router, Better Auth React client, Convex Better Auth provider, React Testing Library, Vitest, Playwright.

---

## Baseline Evidence (Already Verified)

- `apps/web/src/components/header.tsx` calls `authClient.signOut()` directly and does not redirect, refresh, or await the result.
- `apps/web/src/app/(app)/visibility/page.tsx` uses a mounted `useQuery(getTeamVisibilityReference, {})`.
- `apps/web/src/components/settings/policy-form.tsx` uses mounted `useQuery(getCurrentPolicyReference, {})` and `useMutation(saveCurrentPolicyReference)`.
- `apps/web/src/app/(app)/tickets/[ticketId]/page.tsx` fetches data on the server and does not keep a mounted live detail query in the same way.
- Fresh reproduction confirms the bug still exists:
  - sign out from `/visibility` -> app error + `ConvexError: Unauthenticated`
  - sign out from `/settings/policy` -> app error + `ConvexError: Unauthenticated`

### Task 1: Add header regression test for sign-out navigation

**Files:**
- Create: `apps/web/src/components/header.test.tsx`
- Modify: `apps/web/src/components/header.tsx`

**Step 1: Write the failing test**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
const signOut = vi.fn().mockResolvedValue(undefined);
const useSession = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("../lib/auth-client", () => ({
  authClient: {
    useSession: () => useSession(),
    signOut,
  },
}));

import Header from "./header";

describe("Header", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    signOut.mockClear();
    useSession.mockReturnValue({
      data: { user: { role: "lead", email: "lead@fylo.local", name: "Lead" } },
      isPending: false,
    });
  });

  it("navigates to a public route after sign out", async () => {
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith("/");
      expect(refresh).toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bunx vitest run apps/web/src/components/header.test.tsx --config ../../vitest.workspace.ts`
Expected: FAIL because `Header` does not use `useRouter` or navigate after sign-out.

**Step 3: Implement the minimal code in the header**

Update `apps/web/src/components/header.tsx` to:

```tsx
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }
}
```

Wire the button to `void handleSignOut()` instead of calling `authClient.signOut()` inline.

**Step 4: Run test to verify it passes**

Run: `bunx vitest run apps/web/src/components/header.test.tsx --config ../../vitest.workspace.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/header.tsx apps/web/src/components/header.test.tsx
git commit -m "fix: redirect to a safe route after sign out"
```

### Task 2: Verify no regression on public signed-out header state

**Files:**
- Modify: `apps/web/src/components/header.test.tsx`

**Step 1: Add a second failing test**

```tsx
it("shows signed-out navigation when there is no session", () => {
  useSession.mockReturnValue({ data: null, isPending: false });

  render(<Header />);

  expect(screen.getByText("signed out")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
});
```

**Step 2: Run the test file**

Run: `bunx vitest run apps/web/src/components/header.test.tsx --config ../../vitest.workspace.ts`
Expected: PASS or FAIL only if the new router wiring accidentally broke signed-out rendering.

**Step 3: Adjust implementation only if needed**

Keep the header behavior unchanged for signed-out and pending states. Do not refactor unrelated layout code.

**Step 4: Re-run the test file**

Run: `bunx vitest run apps/web/src/components/header.test.tsx --config ../../vitest.workspace.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/header.test.tsx apps/web/src/components/header.tsx
git commit -m "test: cover signed-out header state"
```

### Task 3: Add E2E regression coverage for protected-route sign-out

**Files:**
- Modify: `apps/web/tests/e2e/pilot-app.spec.ts`

**Step 1: Write the failing E2E tests**

Add focused tests that:

```ts
test("signing out from visibility returns to a signed-out public state", async ({ page }) => {
  await bootstrapSession(page);
  await page.goto("/visibility");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByText("signed out")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText(/Application error/i)).not.toBeVisible();
});

test("signing out from policy returns to a signed-out public state", async ({ page }) => {
  await bootstrapSession(page);
  await page.goto("/settings/policy");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByText("signed out")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText(/Application error/i)).not.toBeVisible();
});
```

**Step 2: Run just the new E2E tests and verify they fail**

Run: `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts -g "signing out from"`
Expected: FAIL with the current application-error behavior.

**Step 3: Keep implementation minimal**

Do not add route-specific guards or suppress Convex errors in the pages. The fix should remain centralized in the sign-out transition path unless evidence proves otherwise.

**Step 4: Re-run the new E2E tests**

Run: `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts -g "signing out from"`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/tests/e2e/pilot-app.spec.ts apps/web/src/components/header.tsx apps/web/src/components/header.test.tsx
git commit -m "test: cover protected-route sign out flow"
```

### Task 4: Run focused verification across the auth-sensitive surfaces

**Files:**
- No code changes expected

**Step 1: Run the unit coverage for header behavior**

Run: `bunx vitest run apps/web/src/components/header.test.tsx --config ../../vitest.workspace.ts`
Expected: PASS.

**Step 2: Run the focused protected-route E2E coverage**

Run: `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts -g "signing out from"`
Expected: PASS.

**Step 3: Run the broader auth and pilot route checks that exercise sign-in/sign-out**

Run: `bunx playwright test apps/web/tests/e2e/auth-flow.spec.ts apps/web/tests/e2e/pilot-app.spec.ts -g "reuses the same bootstrap identity after signing out|supports sign-up and sign-in through protected route redirects|signing out from"`
Expected: PASS.

**Step 4: Spot-check no regression on the working ticket case**

Run: `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts -g "reuses the same bootstrap identity after signing out|returns a 404 for invalid ticket ids"`
Expected: PASS.

**Step 5: Commit verification-only state if needed**

No commit if nothing changed. If test files needed final expectation cleanup, commit with:

```bash
git add apps/web/tests/e2e/pilot-app.spec.ts apps/web/src/components/header.test.tsx apps/web/src/components/header.tsx
git commit -m "fix: verify protected sign-out no longer crashes"
```
