# Gemma 3 27B Default Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Switch the default draft-generation model from Gemini 2.5 Flash to Gemma 3 27B using the exact Google API model id `gemma-3-27b-it`.

**Architecture:** Update the default model fallback in the provider adapter, omit JSON mode whenever the resolved model id is `gemma-3-27b-it`, and keep the existing optional explicit `model` override behavior unchanged for all other models. Verify the change with focused provider request-shape tests plus live provider and wrapper-path calls against the current API key.

**Tech Stack:** TypeScript, Convex, Vitest, Google Generative Language API, git

---

### Task 1: Switch the default provider model and request shape

**Files:**
- Modify: `packages/backend/convex/lib/gemini_draft_provider.ts`
- Modify: `packages/backend/convex/lib/__tests__/gemini-draft-provider.test.ts`

**Step 1: Write the failing test**

Update the focused provider tests in `packages/backend/convex/lib/__tests__/gemini-draft-provider.test.ts` so they prove both the default Gemma request and an explicit `model: "gemma-3-27b-it"` request omit `generationConfig.responseMimeType`.

```ts
"https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=AIza-test"
```

**Step 2: Run test to verify it fails**

Run: `bun run test --project backend packages/backend/convex/lib/__tests__/gemini-draft-provider.test.ts`
Expected: FAIL because the provider still sends `generationConfig.responseMimeType` when the caller explicitly sets `model: "gemma-3-27b-it"`.

**Step 3: Write minimal implementation**

Keep the default model as:

```ts
const model = options.model ?? "gemma-3-27b-it";
```

and make the minimal request-body change so any resolved `gemma-3-27b-it` call omits `generationConfig.responseMimeType`, while other model ids keep the prior request shape.

**Step 4: Run test to verify it passes**

Run: `bun run test --project backend packages/backend/convex/lib/__tests__/gemini-draft-provider.test.ts`
Expected: PASS

**Step 5: Run the related draft-generation test**

Run: `bun run test --project backend packages/backend/convex/lib/__tests__/generate-draft-reply.test.ts`
Expected: PASS

### Task 2: Verify live provider output and wrapper behavior

**Files:**
- No code changes required unless verification exposes a real compatibility problem.

**Step 1: Run the live provider call**

Run a one-off script that calls `createGeminiDraftProviderFromEnv(process.env)` with the current `AI_PROVIDER_API_KEY` and logs the returned JSON.

Expected: JSON object with `summary`, `recommended_action`, and `draft_reply` after omitting JSON mode for the default Gemma request.

**Step 2: Run the wrapper-path call**

Run a one-off script that calls `generateProviderBackedDraftReply(...)` with the live provider and logs the returned metadata.

Expected:

```json
{
  "generationSource": "provider",
  "usedFallback": false,
  "fallbackReason": null
}
```
