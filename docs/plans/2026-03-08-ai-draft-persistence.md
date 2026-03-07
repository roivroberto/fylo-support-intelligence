# AI Draft Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist real AI-generated ticket reply drafts so the first draft is created once, reused on reload, and only changes when a user explicitly regenerates it.

**Architecture:** Add a dedicated Convex draft storage table plus authenticated ensure/regenerate functions. Use a provider-backed action to generate structured draft content with deterministic fallback, read stored drafts through queries, and update the ticket detail UI so first-open generation, regenerate, and approved-send all operate on persisted draft state.

**Tech Stack:** Next.js 16, React 19, TypeScript, Convex, Better Auth, Gemini-style HTTP API via `fetch`, Zod, Vitest, Playwright

**Execution Skills:** @superpowers/subagent-driven-development, @superpowers/test-driven-development, @superpowers/systematic-debugging, @superpowers/verification-before-completion

---

### Task 1: Add provider-generation unit coverage

**Files:**
- Modify: `packages/backend/convex/lib/__tests__/generate-draft-reply.test.ts`
- Modify: `packages/backend/convex/ai/generate_draft_reply.ts`
- Create: `packages/backend/convex/lib/gemini_draft_provider.ts`

**Step 1: Write the failing test**

```ts
it("labels provider-backed drafts truthfully", () => {
  expect(getDraftGeneratedLabel({ generationSource: "provider", usedFallback: false })).toBe(
    "AI generated draft",
  );
});
```

Add a second failing test that stubs a provider response and expects parsed structured draft content to be returned without fallback.

**Step 2: Run test to verify it fails**

Run: `bun run test --project backend --config ../../vitest.workspace.ts packages/backend/convex/lib/__tests__/generate-draft-reply.test.ts`
Expected: FAIL because provider source handling does not exist yet.

**Step 3: Write minimal implementation**

- Add a small provider adapter in `packages/backend/convex/lib/gemini_draft_provider.ts` that uses `fetch` and the existing API key.
- Extend `packages/backend/convex/ai/generate_draft_reply.ts` to distinguish generation source and to run the provider adapter before deterministic fallback.
- Keep schema validation and fallback behavior centralized.

**Step 4: Run test to verify it passes**

Run: `bun run test --project backend --config ../../vitest.workspace.ts packages/backend/convex/lib/__tests__/generate-draft-reply.test.ts`
Expected: PASS

### Task 2: Add persisted draft storage behavior

**Files:**
- Modify: `packages/backend/convex/schema.ts`
- Modify: `packages/backend/convex/drafts.ts`
- Modify: `packages/backend/convex/drafts_reference.ts`
- Test: `packages/backend/convex/lib/__tests__/draft-persistence.test.ts`

**Step 1: Write the failing test**

```ts
it("returns the stored draft on subsequent ensure calls", async () => {
  const store = new InMemoryDraftStore();
  const first = await ensureStoredDraft(store, seedTicket, generateA);
  const second = await ensureStoredDraft(store, seedTicket, generateB);
  expect(second).toEqual(first);
});
```

Add a paired failing test for explicit regenerate replacing the stored content.

**Step 2: Run test to verify it fails**

Run: `bun run test --project backend --config ../../vitest.workspace.ts packages/backend/convex/lib/__tests__/draft-persistence.test.ts`
Expected: FAIL because persisted draft helpers and storage do not exist yet.

**Step 3: Write minimal implementation**

- Add a `draftReplies` table with one row per ticket and a `by_ticketId` index.
- Refactor `packages/backend/convex/drafts.ts` so `getForTicket` reads stored rows.
- Add authenticated ensure/regenerate functions that persist normalized draft content and metadata.
- Update `packages/backend/convex/drafts_reference.ts` with any new action references and expanded draft metadata.

**Step 4: Run test to verify it passes**

Run: `bun run test --project backend --config ../../vitest.workspace.ts packages/backend/convex/lib/__tests__/draft-persistence.test.ts`
Expected: PASS

### Task 3: Wire first-open ensure behavior into the ticket page

**Files:**
- Modify: `apps/web/src/app/(app)/tickets/[ticketId]/page.tsx`
- Modify: `apps/web/src/app/(app)/tickets/[ticketId]/page.test.tsx`
- Modify: `apps/web/src/components/ticket/ticket-detail.tsx`

**Step 1: Write the failing test**

```ts
it("ensures a draft when the ticket has none", async () => {
  fetchAuthQuery.mockResolvedValueOnce({ id: "ticket_1" });
  fetchAuthQuery.mockResolvedValueOnce(null);
  fetchAuthAction.mockResolvedValueOnce({ draftReply: "Hello customer" });
  await TicketDetailPage({ params: Promise.resolve({ ticketId: "ticket_1" }) });
  expect(fetchAuthAction).toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test --project web --config ../../vitest.workspace.ts apps/web/src/app/'(app)'/tickets/'[ticketId]'/page.test.tsx`
Expected: FAIL because the page never ensures a stored draft.

**Step 3: Write minimal implementation**

- Import `fetchAuthAction` and the new ensure-draft reference into the ticket page.
- Keep the current invalid-id behavior intact.
- Pass the ensured draft into `TicketDetail` so the UI renders the persisted result immediately.

**Step 4: Run test to verify it passes**

Run: `bun run test --project web --config ../../vitest.workspace.ts apps/web/src/app/'(app)'/tickets/'[ticketId]'/page.test.tsx`
Expected: PASS

### Task 4: Add regenerate behavior in the draft panel

**Files:**
- Modify: `apps/web/src/components/ticket/draft-reply-panel.tsx`
- Modify: `packages/backend/convex/drafts_reference.ts`
- Test: `apps/web/src/components/ticket/draft-reply-panel.test.tsx`

**Step 1: Write the failing test**

```ts
it("regenerates the stored draft only when requested", async () => {
  render(<DraftReplyPanel ... />);
  await user.click(screen.getByRole("button", { name: /regenerate draft/i }));
  expect(regenerateDraft).toHaveBeenCalledWith({ ticketId: "ticket_1" });
});
```

Add a second failing test that confirms approved send still uses the currently displayed stored draft content.

**Step 2: Run test to verify it fails**

Run: `bun run test --project web --config ../../vitest.workspace.ts apps/web/src/components/ticket/draft-reply-panel.test.tsx`
Expected: FAIL because there is no regenerate control or action wiring.

**Step 3: Write minimal implementation**

- Add a `Regenerate draft` button and loading state.
- Call the new regenerate action.
- Update local panel state from the returned stored draft while preserving send behavior.
- Surface fallback/provider labels truthfully.

**Step 4: Run test to verify it passes**

Run: `bun run test --project web --config ../../vitest.workspace.ts apps/web/src/components/ticket/draft-reply-panel.test.tsx`
Expected: PASS

### Task 5: Prove persisted behavior end to end and keep live email coverage

**Files:**
- Modify: `apps/web/tests/e2e/pilot-app.spec.ts`
- Modify: `packages/backend/convex/e2e.ts`
- Modify if needed: `apps/web/tests/e2e/resend-live.spec.ts`

**Step 1: Write the failing test**

Add Playwright coverage that:
- seeds a ticket without a stored draft,
- opens the ticket and expects an AI/provider-or-fallback generated draft to appear,
- reloads and expects the same stored draft content,
- clicks `Regenerate draft` and expects the displayed draft metadata or content to update.

**Step 2: Run test to verify it fails**

Run: `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts --grep "persisted draft"`
Expected: FAIL because draft persistence and regenerate do not exist yet.

**Step 3: Write minimal implementation**

- Adjust E2E seeding so the relevant ticket starts without a stored draft row.
- Keep the existing live Resend outbound spec intact.
- If live outbound assertions need label updates, only make the smallest necessary changes.

**Step 4: Run test to verify it passes**

Run: `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts --grep "persisted draft"`
Expected: PASS

### Task 6: Add remaining email transport and webhook coverage

**Files:**
- Create: `packages/backend/convex/lib/__tests__/resend-client.test.ts`
- Create: `packages/backend/convex/webhooks/__tests__/resend-http.test.ts`
- Create: `packages/backend/convex/lib/__tests__/replies-action.test.ts`
- Modify if needed: `packages/backend/convex/lib/resend_client.ts`
- Modify if needed: `packages/backend/convex/webhooks/resend.ts`
- Modify if needed: `packages/backend/convex/replies.ts`

**Step 1: Write the failing tests**

Add backend tests that cover:
- `createResendClient` request URL, method, headers, and payload body
- non-OK Resend responses and missing provider message ids
- `createResendClientFromEnv` fallback from `RESEND_FROM_EMAIL` to `RESEND_FROM` and missing-env failures
- inbound webhook HTTP behavior for invalid signature, invalid JSON, invalid payload, success, duplicate acceptance, and mutation failure
- `sendApproved` action orchestration for reserve -> send -> finalize and already-sent short-circuit behavior

**Step 2: Run tests to verify they fail**

Run:
- `bun run test --project backend --config ../../vitest.workspace.ts packages/backend/convex/lib/__tests__/resend-client.test.ts`
- `bun run test --project backend --config ../../vitest.workspace.ts packages/backend/convex/webhooks/__tests__/resend-http.test.ts`
- `bun run test --project backend --config ../../vitest.workspace.ts packages/backend/convex/lib/__tests__/replies-action.test.ts`

Expected: FAIL because this coverage and any required seams do not exist yet.

**Step 3: Write minimal implementation**

- Add only the smallest seams needed to unit-test the current logic without changing runtime behavior.
- Keep the existing live outbound send path unchanged.
- Prefer dependency injection or narrow exported helpers over broad refactors.

**Step 4: Run tests to verify they pass**

Run the same three commands again.

Expected: PASS

### Task 7: Verify direct checks and document inbound-email limits

**Files:**
- Modify if needed: `docs/pilot-runbook.md`
- Modify if needed: `README.md`

**Step 1: Run affected automated checks**

Run:
- `bun run test`
- `bun run build`
- `bunx playwright test`
- `E2E_RESEND_LIVE=1 bunx playwright test apps/web/tests/e2e/resend-live.spec.ts`

If local inbound webhook E2E is added during Task 6, include it in the Playwright run or invoke it directly as part of this step.

Expected: PASS

**Step 2: Document live-email verification scope**

- Clarify that outbound send is covered by guarded live E2E.
- Clarify that true live inbound webhook verification requires a public callback target and remains a documented manual verification path, not a default local CI step.

**Step 3: Re-run only if docs or config changed behavior**

Run the smallest relevant check again if any config or environment docs changed in a behaviorally significant way.
