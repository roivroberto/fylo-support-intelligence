# Gemini 2.5 Flash Default Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Switch the default draft-generation model from Gemini 2.0 Flash to Gemini 2.5 Flash.

**Architecture:** Update the default model in the isolated Gemini draft provider adapter and keep the existing optional model override unchanged. Verify the change through the focused provider test file that already checks the generated request URL.

**Tech Stack:** TypeScript, Convex, Vitest, fetch

---

### Task 1: Change the provider default model

**Files:**
- Modify: `packages/backend/convex/lib/gemini_draft_provider.ts`
- Modify: `packages/backend/convex/lib/__tests__/gemini-draft-provider.test.ts`

**Step 1: Write the failing test**

Update the existing request-URL assertion in `packages/backend/convex/lib/__tests__/gemini-draft-provider.test.ts` to expect:

```ts
"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIza-test"
```

**Step 2: Run test to verify it fails**

Run: `bun run test --project backend packages/backend/convex/lib/__tests__/gemini-draft-provider.test.ts`
Expected: FAIL because the provider still defaults to `gemini-2.0-flash`.

**Step 3: Write minimal implementation**

Change the default model in `packages/backend/convex/lib/gemini_draft_provider.ts` from:

```ts
const model = options.model ?? "gemini-2.0-flash";
```

to:

```ts
const model = options.model ?? "gemini-2.5-flash";
```

**Step 4: Run test to verify it passes**

Run: `bun run test --project backend packages/backend/convex/lib/__tests__/gemini-draft-provider.test.ts`
Expected: PASS

**Step 5: Run the related draft-generation test**

Run: `bun run test --project backend packages/backend/convex/lib/__tests__/generate-draft-reply.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add docs/plans/2026-03-08-gemini-2-5-flash-design.md docs/plans/2026-03-08-gemini-2-5-flash.md packages/backend/convex/lib/gemini_draft_provider.ts packages/backend/convex/lib/__tests__/gemini-draft-provider.test.ts
git commit -m "chore: switch draft provider default to gemini 2.5 flash"
```
