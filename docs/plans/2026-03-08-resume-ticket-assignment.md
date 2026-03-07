# Resume Ticket Assignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let each agent upload a resume PDF, parse it into a normalized skill profile, and use that parsed profile as the primary source for ticket assignment.

**Architecture:** Add an `agentProfiles` table plus authenticated query, mutation, and action surfaces for the current signed-in agent. Store uploaded resume PDFs in Convex storage, parse the current file with the existing Gemma-style HTTP integration pattern, validate the returned JSON through a strict schema, and teach routing to prefer parsed profile skills and languages over the current hardcoded role defaults.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Convex, Better Auth, Convex storage, Google Generative Language API (`gemma-3-27b-it`), Zod, Vitest.

**Execution Skills:** @superpowers/subagent-driven-development, @superpowers/systematic-debugging, @superpowers/verification-before-completion

---

### Task 1: Add backend agent profile storage and parsing helpers

**Files:**
- Modify: `packages/backend/convex/schema.ts`
- Create: `packages/backend/convex/agent_profiles.ts`
- Create: `packages/backend/convex/agent_profiles_reference.ts`
- Create: `packages/backend/convex/ai/parse_agent_resume.ts`
- Create: `packages/backend/convex/lib/agent_profile_schema.ts`
- Create: `packages/backend/convex/lib/gemini_resume_parser.ts`
- Test: `packages/backend/convex/lib/__tests__/agent-profile-schema.test.ts`
- Test: `packages/backend/convex/lib/__tests__/gemini-resume-parser.test.ts`

**Step 1:** Add focused backend tests for strict schema parsing and the Gemma request/response adapter.

**Step 2:** Implement the schema, provider adapter, and current-agent profile functions.

**Step 3:** Expose references for current-profile read, upload-url generation, uploaded-file save, and parse action.

**Step 4:** Run:

```bash
bun run test --project backend --config ../../vitest.workspace.ts packages/backend/convex/lib/__tests__/agent-profile-schema.test.ts packages/backend/convex/lib/__tests__/gemini-resume-parser.test.ts
```

Expected: PASS.

### Task 2: Make routing consume parsed agent profiles

**Files:**
- Modify: `packages/backend/convex/tickets.ts`
- Test: `packages/backend/convex/lib/__tests__/ticket-routing-profile.test.ts`

**Step 1:** Add backend tests proving a ready parsed profile overrides role defaults and that missing/failed profiles keep the current fallback behavior.

**Step 2:** Update routing worker construction to read `agentProfiles` for the current workspace and merge parsed profile data into worker definitions.

**Step 3:** Run:

```bash
bun run test --project backend --config ../../vitest.workspace.ts packages/backend/convex/lib/__tests__/ticket-routing-profile.test.ts
```

Expected: PASS.

### Task 3: Add the self-serve settings profile UI

**Files:**
- Create: `apps/web/src/app/(app)/settings/profile/page.tsx`
- Create: `apps/web/src/components/settings/agent-profile-form.tsx`
- Create: `apps/web/src/components/settings/agent-profile-form.test.tsx`
- Modify: `apps/web/src/app/(app)/layout.tsx`

**Step 1:** Add UI tests for loading state, successful upload + parse flow, and failed-parse messaging.

**Step 2:** Build the profile page and upload form using Convex query/mutation/action hooks and direct upload to the generated storage URL.

**Step 3:** Update the app navigation to include the new profile settings surface.

**Step 4:** Run:

```bash
bun run test --project web --config ../../vitest.workspace.ts apps/web/src/components/settings/agent-profile-form.test.tsx
```

Expected: PASS.

### Task 4: Verify repo-level regression checks

**Files:**
- Modify if needed: `README.md`
- Modify if needed: `docs/current-codebase-checklist.md`

**Step 1:** Run affected checks.

```bash
bun run test
bun run build
```

**Step 2:** If behavior or surfaces changed enough to require docs updates, make the smallest accurate doc changes.

**Step 3:** Re-run the relevant checks if any behaviorally significant doc/config edits were made.

Expected: PASS.

### Task 5: Commit and push

**Files:**
- Stage only the files related to this feature.

**Step 1:** Review `git status`, `git diff`, and recent commit message style.

**Step 2:** Commit with a concise message focused on why the resume profile path improves ticket assignment.

**Step 3:** Push the current branch to its remote tracking branch.
