# Login Signup Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add user-facing sign-in and sign-up pages for Better Auth, and protect backend-backed views so unauthenticated users are redirected into the auth flow.

**Architecture:** Keep public pilot routes (`/`, `/queue`, `/review`) unchanged, because queue/review are still static surfaces today. Add dedicated `/sign-in` and `/sign-up` pages that call Better Auth client methods, then redirect back to the intended route through a sanitized `next` query param. Enforce auth for backend-backed routes (`/visibility`, `/settings/policy`, `/tickets/*`) at the proxy layer so users with no session cookie cannot reach protected pages.

**Tech Stack:** Next.js App Router, Better Auth React client, Convex Better Auth integration, Vitest (web project), Playwright E2E.

---

## Baseline Check (Already Verified)

- `apps/web/src/app/page.tsx` (`/`) exists, static.
- `apps/web/src/app/(app)/queue/page.tsx` (`/queue`) exists, static rows (no backend query).
- `apps/web/src/app/(app)/review/page.tsx` (`/review`) exists, static list (no backend query).
- `apps/web/src/app/(app)/visibility/page.tsx` is wired to `visibility:getTeamVisibility`.
- `apps/web/src/components/settings/policy-form.tsx` is wired to `policies:getCurrent` and `policies:saveCurrent`.
- `apps/web/src/app/(app)/tickets/[ticketId]/page.tsx` + `apps/web/src/components/ticket/draft-reply-panel.tsx` are wired to ticket detail/draft/reply backend functions.

### Task 1: Add safe post-auth redirect helper

**Files:**
- Create: `apps/web/src/lib/auth-redirect.ts`
- Test: `apps/web/src/lib/__tests__/auth-redirect.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { getSafeNextPath } from "../auth-redirect";

describe("getSafeNextPath", () => {
  it("allows internal next paths", () => {
    expect(getSafeNextPath("/visibility")).toBe("/visibility");
  });

  it("rejects external and malformed values", () => {
    expect(getSafeNextPath("https://evil.example")).toBe("/visibility");
    expect(getSafeNextPath("//evil.example")).toBe("/visibility");
    expect(getSafeNextPath("javascript:alert(1)")).toBe("/visibility");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run apps/web/src/lib/__tests__/auth-redirect.test.ts`
Expected: FAIL with missing module/function.

**Step 3: Write minimal implementation**

```ts
const DEFAULT_NEXT_PATH = "/visibility";

export function getSafeNextPath(raw: string | null | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }
  return raw;
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run apps/web/src/lib/__tests__/auth-redirect.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/lib/auth-redirect.ts apps/web/src/lib/__tests__/auth-redirect.test.ts
git commit -m "test: add safe redirect helper for auth callbacks"
```

### Task 2: Build reusable email/password auth form UI

**Files:**
- Create: `apps/web/src/components/auth/email-password-auth-form.tsx`
- Test: `apps/web/src/components/auth/email-password-auth-form.test.tsx`

**Step 1: Write the failing test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmailPasswordAuthForm } from "./email-password-auth-form";

describe("EmailPasswordAuthForm", () => {
  it("submits email and password", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <EmailPasswordAuthForm
        mode="sign-in"
        onSubmit={onSubmit}
        submitLabel="Sign in"
      />,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "pilot@fylo.local" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "Fylo-E2E-password-123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: "pilot@fylo.local",
      password: "Fylo-E2E-password-123!",
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run apps/web/src/components/auth/email-password-auth-form.test.tsx`
Expected: FAIL with missing component.

**Step 3: Write minimal implementation**

```tsx
export function EmailPasswordAuthForm(props: {
  mode: "sign-in" | "sign-up";
  submitLabel: string;
  onSubmit: (input: { email: string; password: string }) => Promise<void>;
}) {
  // render email input, password input, submit button, pending/error states
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run apps/web/src/components/auth/email-password-auth-form.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/auth/email-password-auth-form.tsx apps/web/src/components/auth/email-password-auth-form.test.tsx
git commit -m "feat: add reusable email-password auth form"
```

### Task 3: Add `/sign-in` and `/sign-up` pages wired to Better Auth

**Files:**
- Create: `apps/web/src/app/sign-in/page.tsx`
- Create: `apps/web/src/app/sign-up/page.tsx`
- Modify: `apps/web/src/lib/auth-client.ts`
- Test: `apps/web/src/app/sign-in/page.test.tsx`
- Test: `apps/web/src/app/sign-up/page.test.tsx`

**Step 1: Write the failing tests**

```tsx
it("calls Better Auth sign-in then navigates to next", async () => {
  // mock authClient.signIn.email + next/navigation router
  // expect callback path uses getSafeNextPath(searchParams.get("next"))
});

it("calls Better Auth sign-up then navigates to next", async () => {
  // mock authClient.signUp.email + router push
});
```

**Step 2: Run tests to verify they fail**

Run: `bun x vitest run apps/web/src/app/sign-in/page.test.tsx apps/web/src/app/sign-up/page.test.tsx`
Expected: FAIL with missing pages and mocks.

**Step 3: Write minimal implementation**

```tsx
// sign-in page
"use client";
// parse `next` from URLSearchParams
// submit -> authClient.signIn.email({ email, password })
// on success router.push(getSafeNextPath(next))

// sign-up page
"use client";
// submit -> authClient.signUp.email({ email, password, name })
// on success router.push(getSafeNextPath(next))
```

**Step 4: Run tests to verify they pass**

Run: `bun x vitest run apps/web/src/app/sign-in/page.test.tsx apps/web/src/app/sign-up/page.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/app/sign-in/page.tsx apps/web/src/app/sign-up/page.tsx apps/web/src/app/sign-in/page.test.tsx apps/web/src/app/sign-up/page.test.tsx apps/web/src/lib/auth-client.ts
git commit -m "feat: add frontend sign-in and sign-up pages"
```

### Task 4: Protect backend-backed routes in proxy

**Files:**
- Modify: `apps/web/src/proxy.ts`
- Modify: `apps/web/src/proxy.test.ts`

**Step 1: Write the failing tests**

```ts
it("redirects unauthenticated users from /visibility to /sign-in", () => {
  // request without session cookie to /visibility
  // expect redirect location /sign-in?next=%2Fvisibility
});

it("does not redirect authenticated requests", () => {
  // request with session cookie
  // expect next() behavior
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run apps/web/src/proxy.test.ts`
Expected: FAIL with missing redirect behavior.

**Step 3: Write minimal implementation**

```ts
// in proxy.ts:
// - identify protected prefixes: /visibility, /settings, /tickets
// - if protected and no auth session cookie, redirect to /sign-in?next=<pathname+search>
// - otherwise preserve current header injection flow
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run apps/web/src/proxy.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/proxy.ts apps/web/src/proxy.test.ts
git commit -m "feat: redirect unauthenticated access for protected app routes"
```

### Task 5: Update header signed-out UX

**Files:**
- Modify: `apps/web/src/components/header.tsx`
- Test: `apps/web/src/components/header.test.tsx`

**Step 1: Write the failing test**

```tsx
it("shows sign-in and sign-up links when signed out", () => {
  // mock authClient.useSession to null
  // expect links for /sign-in and /sign-up
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run apps/web/src/components/header.test.tsx`
Expected: FAIL with missing links.

**Step 3: Write minimal implementation**

```tsx
// in Header:
// - if signed out, render Sign in and Sign up links
// - keep Sign out button for authenticated session
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run apps/web/src/components/header.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/header.tsx apps/web/src/components/header.test.tsx
git commit -m "feat: expose sign-in and sign-up actions in header"
```

### Task 6: Add auth flow E2E test and update docs

**Files:**
- Create: `apps/web/tests/e2e/auth-flow.spec.ts`
- Modify: `README.md`

**Step 1: Write the failing E2E test**

```ts
test("sign up, sign out, and sign in with the same account", async ({ page }) => {
  // go to /sign-up
  // create account
  // verify authenticated header state
  // sign out
  // sign in
  // verify redirected to protected page
});
```

**Step 2: Run test to verify it fails**

Run: `bunx playwright test apps/web/tests/e2e/auth-flow.spec.ts`
Expected: FAIL until auth pages/proxy flow are complete.

**Step 3: Add docs for new routes and behavior**

```md
- Add `/sign-in` and `/sign-up` usage notes to README.
- Document protected routes redirect behavior and `next` param handling.
```

**Step 4: Run full verification**

Run: `bun run test`
Expected: PASS.

Run: `bunx playwright test apps/web/tests/e2e/auth-flow.spec.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/tests/e2e/auth-flow.spec.ts README.md
git commit -m "test: cover frontend auth flow and document usage"
```
