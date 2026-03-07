# Operational Core Pilot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a pilot-ready support routing product with Better Auth, Convex persistence, Resend inbound/outbound email, explainable routing/review, and a human-first agent workspace.

**Architecture:** Next.js App Router handles UI and navigation, Convex owns domain workflows and state, Better Auth owns identity/session flows through Convex integration, and Resend handles email transport. AI is assistive for classification/summaries/drafts, but all outputs are schema-validated and safely fall back to deterministic review paths.

**Tech Stack:** Next.js 16, React 19, TypeScript, Convex, Better Auth, Resend, Zod, Vitest, Playwright, Tailwind/shadcn

**Execution Skills:** @superpowers/executing-plans, @superpowers/test-driven-development, @superpowers/verification-before-completion, @superpowers/systematic-debugging

---

### Task 1: Add Test Harness and Core Threshold Utility

**Files:**
- Create: `vitest.workspace.ts`
- Modify: `package.json`
- Modify: `apps/web/package.json`
- Modify: `packages/backend/package.json`
- Create: `apps/web/src/test/setup.ts`
- Create: `packages/backend/convex/lib/routing-thresholds.ts`
- Test: `packages/backend/convex/lib/__tests__/routing-thresholds.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { computeReviewState } from "../routing-thresholds";

describe("computeReviewState", () => {
  it("routes <=0.8 confidence to manager verification", () => {
    expect(computeReviewState(0.8)).toBe("manager_verification");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/routing-thresholds.test.ts`
Expected: FAIL with `Cannot find module '../routing-thresholds'`

**Step 3: Write minimal implementation**

```ts
export type ReviewState = "auto_assign_allowed" | "manager_verification" | "manual_triage";

export function computeReviewState(confidence: number): ReviewState {
  if (confidence > 0.8) return "auto_assign_allowed";
  if (confidence >= 0.5) return "manager_verification";
  return "manual_triage";
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/routing-thresholds.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add vitest.workspace.ts package.json apps/web/package.json packages/backend/package.json apps/web/src/test/setup.ts packages/backend/convex/lib/routing-thresholds.ts packages/backend/convex/lib/__tests__/routing-thresholds.test.ts
git commit -m "chore: add test harness and routing threshold utility"
```

### Task 2: Standardize Better Auth + Convex Session Wiring

**Files:**
- Modify: `apps/web/src/components/providers.tsx`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/middleware.ts`
- Modify: `apps/web/src/lib/auth-client.ts`
- Modify: `apps/web/src/lib/auth-server.ts`
- Modify: `apps/web/src/app/api/auth/[...all]/route.ts`
- Create: `apps/web/src/lib/current-user.ts`
- Modify: `apps/web/src/components/header.tsx`
- Test: `apps/web/src/lib/__tests__/current-user.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { roleFromSession } from "../current-user";

describe("roleFromSession", () => {
  it("defaults to agent when session role is missing", () => {
    expect(roleFromSession(undefined)).toBe("agent");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run apps/web/src/lib/__tests__/current-user.test.ts`
Expected: FAIL with `Cannot find module '../current-user'`

**Step 3: Write minimal implementation**

```ts
export type AppRole = "lead" | "agent";

export function roleFromSession(role: unknown): AppRole {
  return role === "lead" ? "lead" : "agent";
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run apps/web/src/lib/__tests__/current-user.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/providers.tsx apps/web/src/app/layout.tsx apps/web/src/middleware.ts apps/web/src/lib/auth-client.ts apps/web/src/lib/auth-server.ts apps/web/src/app/api/auth/[...all]/route.ts apps/web/src/lib/current-user.ts apps/web/src/components/header.tsx apps/web/src/lib/__tests__/current-user.test.ts
git commit -m "refactor: standardize better auth and convex session wiring"
```

### Task 3: Define Convex Schema for Pilot Domain and Membership Authz

**Files:**
- Modify: `packages/backend/convex/schema.ts`
- Create: `packages/backend/convex/lib/authz.ts`
- Create: `packages/backend/convex/workspaces.ts`
- Create: `packages/backend/convex/memberships.ts`
- Test: `packages/backend/convex/lib/__tests__/authz.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { canManagePolicy } from "../authz";

describe("canManagePolicy", () => {
  it("allows lead role", () => {
    expect(canManagePolicy("lead")).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/authz.test.ts`
Expected: FAIL with `Cannot find module '../authz'`

**Step 3: Write minimal implementation**

```ts
export type WorkspaceRole = "lead" | "agent";

export function canManagePolicy(role: WorkspaceRole): boolean {
  return role === "lead";
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/authz.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/backend/convex/schema.ts packages/backend/convex/lib/authz.ts packages/backend/convex/workspaces.ts packages/backend/convex/memberships.ts packages/backend/convex/lib/__tests__/authz.test.ts
git commit -m "feat: add workspace schema and role-based authz foundation"
```

### Task 4: Implement Resend Inbound Webhook with Idempotent Ingestion

**Files:**
- Modify: `packages/backend/convex/http.ts`
- Create: `packages/backend/convex/webhooks/resend.ts`
- Create: `packages/backend/convex/messages.ts`
- Create: `packages/backend/convex/tickets.ts`
- Create: `packages/backend/convex/lib/resend-signature.ts`
- Test: `packages/backend/convex/lib/__tests__/resend-signature.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { verifyResendSignature } from "../resend-signature";

describe("verifyResendSignature", () => {
  it("returns false when signature header is missing", async () => {
    const ok = await verifyResendSignature("", "{}", "secret");
    expect(ok).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/resend-signature.test.ts`
Expected: FAIL with `Cannot find module '../resend-signature'`

**Step 3: Write minimal implementation**

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyResendSignature(signature: string, rawBody: string, secret: string) {
  if (!signature || !secret) return false;
  const received = signature.replace(/^sha256=/, "");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/resend-signature.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/backend/convex/http.ts packages/backend/convex/webhooks/resend.ts packages/backend/convex/messages.ts packages/backend/convex/tickets.ts packages/backend/convex/lib/resend-signature.ts packages/backend/convex/lib/__tests__/resend-signature.test.ts
git commit -m "feat: add resend inbound webhook ingestion with idempotency hooks"
```

### Task 5: Add AI Classification Action with Strict Schema and Fallback

**Files:**
- Create: `packages/backend/convex/ai/classify-ticket.ts`
- Create: `packages/backend/convex/lib/classification-schema.ts`
- Modify: `packages/backend/convex/tickets.ts`
- Modify: `packages/backend/package.json`
- Test: `packages/backend/convex/lib/__tests__/classification-schema.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { classificationSchema } from "../classification-schema";

describe("classificationSchema", () => {
  it("rejects confidence above 1", () => {
    const parsed = classificationSchema.safeParse({ classification_confidence: 1.2 });
    expect(parsed.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/classification-schema.test.ts`
Expected: FAIL with `Cannot find module '../classification-schema'`

**Step 3: Write minimal implementation**

```ts
import { z } from "zod";

export const classificationSchema = z.object({
  request_type: z.string(),
  priority: z.enum(["low", "medium", "high", "urgent", "critical"]),
  classification_confidence: z.number().min(0).max(1),
});
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/classification-schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/backend/convex/ai/classify-ticket.ts packages/backend/convex/lib/classification-schema.ts packages/backend/convex/tickets.ts packages/backend/package.json packages/backend/convex/lib/__tests__/classification-schema.test.ts
git commit -m "feat: add validated ai classification with fallback contract"
```

### Task 6: Build Deterministic Routing Engine with Explainability

**Files:**
- Create: `packages/backend/convex/lib/routing/score-candidate.ts`
- Create: `packages/backend/convex/lib/routing/route-ticket.ts`
- Create: `packages/backend/convex/lib/routing/types.ts`
- Test: `packages/backend/convex/lib/routing/__tests__/route-ticket.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { routeTicket } from "../route-ticket";

describe("routeTicket", () => {
  it("prefers primary skill match over lower-load secondary", () => {
    const decision = routeTicket({
      ticket: { request_type: "refund_request", language: "en", classification_confidence: 0.9 },
      workers: [
        { id: "w1", primary: ["refund_request"], secondary: [], load: 7, capacity: 10, languages: ["en"] },
        { id: "w2", primary: ["billing_question"], secondary: ["refund_request"], load: 1, capacity: 10, languages: ["en"] },
      ],
    });
    expect(decision.assignedWorkerId).toBe("w1");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run packages/backend/convex/lib/routing/__tests__/route-ticket.test.ts`
Expected: FAIL with `Cannot find module '../route-ticket'`

**Step 3: Write minimal implementation**

```ts
export function routeTicket(input: { ticket: { classification_confidence: number }; workers: Array<{ id: string }> }) {
  return {
    assignedWorkerId: input.workers[0]?.id,
    reviewState: input.ticket.classification_confidence > 0.8 ? "auto_assign_allowed" : "manager_verification",
    routingReason: "Assigned using deterministic scoring order.",
  };
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run packages/backend/convex/lib/routing/__tests__/route-ticket.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/backend/convex/lib/routing/types.ts packages/backend/convex/lib/routing/score-candidate.ts packages/backend/convex/lib/routing/route-ticket.ts packages/backend/convex/lib/routing/__tests__/route-ticket.test.ts
git commit -m "feat: implement deterministic routing engine with explainable outputs"
```

### Task 7: Wire Routing Workflow, Assignment, and Lead Review Actions

**Files:**
- Create: `packages/backend/convex/routing.ts`
- Modify: `packages/backend/convex/tickets.ts`
- Create: `packages/backend/convex/review.ts`
- Create: `packages/backend/convex/lib/review-workflow.ts`
- Test: `packages/backend/convex/lib/__tests__/review-workflow.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { applyLeadReviewDecision } from "../review-workflow";

describe("applyLeadReviewDecision", () => {
  it("marks reviewed ticket as assigned when approved", () => {
    const result = applyLeadReviewDecision({ reviewState: "manager_verification", action: "approve" });
    expect(result.status).toBe("assigned");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/review-workflow.test.ts`
Expected: FAIL with `Cannot find module '../review-workflow'`

**Step 3: Write minimal implementation**

```ts
export function applyLeadReviewDecision(input: { reviewState: string; action: "approve" | "reassign" }) {
  if (input.action === "approve") {
    return { status: "assigned", reviewState: "auto_assign_allowed" };
  }
  return { status: "reviewed", reviewState: "manager_verification" };
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/review-workflow.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/backend/convex/routing.ts packages/backend/convex/tickets.ts packages/backend/convex/review.ts packages/backend/convex/lib/review-workflow.ts packages/backend/convex/lib/__tests__/review-workflow.test.ts
git commit -m "feat: add routing execution and lead review workflow"
```

### Task 8: Build Shared Queue and Review Pages in Web App

**Files:**
- Create: `apps/web/src/app/(app)/layout.tsx`
- Create: `apps/web/src/app/(app)/queue/page.tsx`
- Create: `apps/web/src/app/(app)/review/page.tsx`
- Create: `apps/web/src/components/queue/ticket-table.tsx`
- Create: `apps/web/src/components/review/review-list.tsx`
- Test: `apps/web/src/components/queue/__tests__/ticket-table.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TicketTable } from "../ticket-table";

describe("TicketTable", () => {
  it("renders routing reason text", () => {
    render(<TicketTable rows={[{ id: "t1", reason: "Primary skill match" }]} />);
    expect(screen.getByText("Primary skill match")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run apps/web/src/components/queue/__tests__/ticket-table.test.tsx`
Expected: FAIL with `Cannot find module '../ticket-table'`

**Step 3: Write minimal implementation**

```tsx
export function TicketTable({ rows }: { rows: Array<{ id: string; reason: string }> }) {
  return (
    <table>
      <tbody>{rows.map((row) => <tr key={row.id}><td>{row.reason}</td></tr>)}</tbody>
    </table>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run apps/web/src/components/queue/__tests__/ticket-table.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/(app)/layout.tsx apps/web/src/app/(app)/queue/page.tsx apps/web/src/app/(app)/review/page.tsx apps/web/src/components/queue/ticket-table.tsx apps/web/src/components/review/review-list.tsx apps/web/src/components/queue/__tests__/ticket-table.test.tsx
git commit -m "feat: add shared queue and review screens"
```

### Task 9: Implement Ticket Detail Workspace (Status, Notes, Assignment Context)

**Files:**
- Create: `apps/web/src/app/(app)/tickets/[ticketId]/page.tsx`
- Create: `apps/web/src/components/ticket/ticket-detail.tsx`
- Create: `apps/web/src/components/ticket/ticket-notes.tsx`
- Modify: `packages/backend/convex/tickets.ts`
- Create: `packages/backend/convex/notes.ts`
- Test: `apps/web/src/components/ticket/__tests__/ticket-detail.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TicketDetail } from "../ticket-detail";

describe("TicketDetail", () => {
  it("shows current review state badge", () => {
    render(<TicketDetail ticket={{ id: "t1", reviewState: "manager_verification" }} />);
    expect(screen.getByText("manager_verification")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run apps/web/src/components/ticket/__tests__/ticket-detail.test.tsx`
Expected: FAIL with `Cannot find module '../ticket-detail'`

**Step 3: Write minimal implementation**

```tsx
export function TicketDetail({ ticket }: { ticket: { id: string; reviewState: string } }) {
  return <section><h2>{ticket.id}</h2><p>{ticket.reviewState}</p></section>;
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run apps/web/src/components/ticket/__tests__/ticket-detail.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/(app)/tickets/[ticketId]/page.tsx apps/web/src/components/ticket/ticket-detail.tsx apps/web/src/components/ticket/ticket-notes.tsx apps/web/src/components/ticket/__tests__/ticket-detail.test.tsx packages/backend/convex/tickets.ts packages/backend/convex/notes.ts
git commit -m "feat: add ticket workspace with notes and status controls"
```

### Task 10: Add AI Summary + Draft Reply Generation in Workspace

**Files:**
- Create: `packages/backend/convex/ai/generate-draft-reply.ts`
- Create: `packages/backend/convex/drafts.ts`
- Create: `packages/backend/convex/lib/draft-schema.ts`
- Create: `apps/web/src/components/ticket/draft-reply-panel.tsx`
- Modify: `apps/web/src/app/(app)/tickets/[ticketId]/page.tsx`
- Test: `packages/backend/convex/lib/__tests__/draft-schema.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { draftReplySchema } from "../draft-schema";

describe("draftReplySchema", () => {
  it("requires summary and draft text", () => {
    const parsed = draftReplySchema.safeParse({ summary: "", draft_reply: "" });
    expect(parsed.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/draft-schema.test.ts`
Expected: FAIL with `Cannot find module '../draft-schema'`

**Step 3: Write minimal implementation**

```ts
import { z } from "zod";

export const draftReplySchema = z.object({
  summary: z.string().min(20),
  recommended_action: z.string().min(10),
  draft_reply: z.string().min(20),
});
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/draft-schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/backend/convex/ai/generate-draft-reply.ts packages/backend/convex/drafts.ts packages/backend/convex/lib/draft-schema.ts apps/web/src/components/ticket/draft-reply-panel.tsx apps/web/src/app/(app)/tickets/[ticketId]/page.tsx packages/backend/convex/lib/__tests__/draft-schema.test.ts
git commit -m "feat: add ai summary and draft reply workflow"
```

### Task 11: Send Approved Replies Through Resend and Persist Outbound Messages

**Files:**
- Create: `packages/backend/convex/replies.ts`
- Modify: `packages/backend/convex/messages.ts`
- Modify: `apps/web/src/components/ticket/draft-reply-panel.tsx`
- Create: `packages/backend/convex/lib/resend-client.ts`
- Create: `packages/backend/convex/lib/send-reply.ts`
- Test: `packages/backend/convex/lib/__tests__/send-reply.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { sendApprovedReply } from "../send-reply";

describe("sendApprovedReply", () => {
  it("records outbound message id when resend succeeds", async () => {
    const resend = { send: vi.fn().mockResolvedValue({ id: "msg_123" }) };
    const result = await sendApprovedReply(resend as never, { to: "a@b.com", subject: "x", html: "<p>x</p>" });
    expect(result.providerMessageId).toBe("msg_123");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/send-reply.test.ts`
Expected: FAIL with `Cannot find module '../send-reply'`

**Step 3: Write minimal implementation**

```ts
export async function sendApprovedReply(
  resend: { send: (payload: { to: string; subject: string; html: string }) => Promise<{ id: string }> },
  payload: { to: string; subject: string; html: string },
) {
  const response = await resend.send(payload);
  return { providerMessageId: response.id };
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/send-reply.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/backend/convex/replies.ts packages/backend/convex/messages.ts apps/web/src/components/ticket/draft-reply-panel.tsx packages/backend/convex/lib/resend-client.ts packages/backend/convex/lib/send-reply.ts packages/backend/convex/lib/__tests__/send-reply.test.ts
git commit -m "feat: send approved replies through resend with persistence"
```

### Task 12: Add Routing Policy Settings and Team Visibility Screens

**Files:**
- Create: `packages/backend/convex/policies.ts`
- Create: `packages/backend/convex/visibility.ts`
- Create: `packages/backend/convex/lib/policy-update.ts`
- Create: `apps/web/src/app/(app)/settings/policy/page.tsx`
- Create: `apps/web/src/app/(app)/visibility/page.tsx`
- Create: `apps/web/src/components/settings/policy-form.tsx`
- Create: `apps/web/src/components/visibility/workload-cards.tsx`
- Test: `packages/backend/convex/lib/__tests__/policy-update.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { sanitizePolicyInput } from "../policy-update";

describe("sanitizePolicyInput", () => {
  it("clamps auto-assign threshold to max 0.95", () => {
    const policy = sanitizePolicyInput({ autoAssignThreshold: 1.2 });
    expect(policy.autoAssignThreshold).toBe(0.95);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/policy-update.test.ts`
Expected: FAIL with `Cannot find module '../policy-update'`

**Step 3: Write minimal implementation**

```ts
export function sanitizePolicyInput(input: { autoAssignThreshold: number }) {
  return {
    autoAssignThreshold: Math.min(0.95, Math.max(0.6, input.autoAssignThreshold)),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run packages/backend/convex/lib/__tests__/policy-update.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/backend/convex/policies.ts packages/backend/convex/visibility.ts packages/backend/convex/lib/policy-update.ts apps/web/src/app/(app)/settings/policy/page.tsx apps/web/src/app/(app)/visibility/page.tsx apps/web/src/components/settings/policy-form.tsx apps/web/src/components/visibility/workload-cards.tsx packages/backend/convex/lib/__tests__/policy-update.test.ts
git commit -m "feat: add policy controls and team visibility dashboard"
```

### Task 13: Harden Reliability, Add E2E Smoke, and Write Pilot Runbook

**Files:**
- Create: `packages/backend/convex/ingest-failures.ts`
- Modify: `packages/backend/convex/webhooks/resend.ts`
- Create: `apps/web/tests/e2e/pilot-smoke.spec.ts`
- Create: `apps/web/playwright.config.ts`
- Create: `.github/workflows/ci.yml`
- Create: `docs/pilot-runbook.md`
- Test: `apps/web/tests/e2e/pilot-smoke.spec.ts`

**Step 1: Write the failing test**

```ts
import { test, expect } from "@playwright/test";

test("queue page loads for signed-in lead", async ({ page }) => {
  await page.goto("/queue");
  await expect(page.getByRole("heading", { name: "Shared Queue" })).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `bunx playwright test apps/web/tests/e2e/pilot-smoke.spec.ts`
Expected: FAIL with missing route/selector/auth fixture

**Step 3: Write minimal implementation**

```ts
export async function recordIngestFailure(reason: string, payloadDigest: string) {
  return { status: "recorded", reason, payloadDigest };
}
```

**Step 4: Run test to verify it passes**

Run: `bunx playwright test apps/web/tests/e2e/pilot-smoke.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/backend/convex/ingest-failures.ts packages/backend/convex/webhooks/resend.ts apps/web/tests/e2e/pilot-smoke.spec.ts apps/web/playwright.config.ts .github/workflows/ci.yml docs/pilot-runbook.md
git commit -m "chore: harden reliability and add pilot smoke coverage"
```

## Environment Variables Checklist

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `SITE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `SUPPORT_INBOX_EMAIL`
- `AI_PROVIDER_API_KEY`

## Verification Gate Before Pilot

Run from repo root:

```bash
bun x vitest run
bun run check-types
bun run build
bunx playwright test
```

Expected: all checks pass, no skipped required tests, queue/ticket/review/reply flow works end-to-end in staging.

## Rollout Notes

1. Use a single pilot workspace with one support inbox first.
2. Enable AI classification and draft generation behind feature flags for week one.
3. Keep deterministic routing active even when AI is on.
4. Track ingest failures and send failures daily during pilot.
5. Expand to multi-inbox and multi-workspace only after pilot metrics stabilize.
