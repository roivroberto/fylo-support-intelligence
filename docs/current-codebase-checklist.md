# Current Codebase Checklist

Snapshot date: 2026-03-08

Legend:
- `[x]` implemented and verified
- `[-]` present but incomplete or unstable
- `[ ]` missing, static-only, or stubbed

## Routes

### Frontend

- [ ] `/` - placeholder landing page only. Evidence: `apps/web/src/app/page.tsx`
- [x] `/sign-in` - Better Auth sign-in flow with safe `next` redirect. Evidence: `apps/web/src/app/sign-in/page.tsx`, `apps/web/src/app/sign-in/page.test.tsx`
- [x] `/sign-up` - Better Auth sign-up flow with safe `next` redirect. Evidence: `apps/web/src/app/sign-up/page.tsx`, `apps/web/src/app/sign-up/page.test.tsx`
- [x] `/queue` - live Convex-backed queue with classification, routing, and ticket drill-in links. Evidence: `apps/web/src/app/(app)/queue/page.tsx`, `packages/backend/convex/tickets.ts`
- [x] `/review` - live Convex-backed review queue with human-decision drill-in links. Evidence: `apps/web/src/app/(app)/review/page.tsx`, `packages/backend/convex/tickets.ts`
- [x] `/visibility` - live Convex-backed visibility surface. Evidence: `apps/web/src/app/(app)/visibility/page.tsx`, `packages/backend/convex/visibility.ts`
- [x] `/settings/policy` - live policy read/save flow with role gating. Evidence: `apps/web/src/app/(app)/settings/policy/page.tsx`, `apps/web/src/components/settings/policy-form.tsx`, `packages/backend/convex/policies.ts`
- [x] `/tickets/[ticketId]` - live ticket workspace with notes, recommendation context, and review actions. Evidence: `apps/web/src/app/(app)/tickets/[ticketId]/page.tsx`, `apps/web/src/components/ticket/ticket-workspace-actions.tsx`, `packages/backend/convex/review.ts`

### API

- [x] `/api/auth/[...all]` - Better Auth route handler is wired. Evidence: `apps/web/src/app/api/auth/[...all]/route.ts`, `packages/backend/convex/auth.ts`
- [x] `/api/e2e/bootstrap` - session bootstrap + seed verification route for Playwright. Evidence: `apps/web/src/app/api/e2e/bootstrap/route.ts`
- [x] `/webhooks/resend/inbound` - Convex HTTP webhook route is registered and handled. Evidence: `packages/backend/convex/http.ts`, `packages/backend/convex/webhooks/resend.ts`

## Features

- [x] Auth - email/password auth, session checks, and protected-route redirects are implemented. Evidence: `apps/web/src/proxy.ts`, `packages/backend/convex/auth.ts`
- [x] Queue - live queue data, AI classification metadata, and routing status are surfaced end-to-end. Evidence: `apps/web/src/app/(app)/queue/page.tsx`, `packages/backend/convex/tickets.ts`
- [x] Review - frontend review flow is wired to live review-needed tickets. Evidence: `apps/web/src/app/(app)/review/page.tsx`, `packages/backend/convex/tickets.ts`, `packages/backend/convex/review.ts`
- [x] Visibility - live visibility snapshot is implemented end-to-end. Evidence: `apps/web/src/app/(app)/visibility/page.tsx`, `packages/backend/convex/visibility.ts`
- [x] Policy - workspace policy editing is live and role-aware. Evidence: `apps/web/src/components/settings/policy-form.tsx`, `packages/backend/convex/policies.ts`
- [x] Ticket workspace - ticket detail, draft reply, notes, and lead review actions are exposed in one live workspace. Evidence: `apps/web/src/app/(app)/tickets/[ticketId]/page.tsx`, `apps/web/src/components/ticket/ticket-detail.tsx`, `apps/web/src/components/ticket/ticket-workspace-actions.tsx`
- [x] Notes - backend create/list and frontend note entry are wired. Evidence: `packages/backend/convex/notes.ts`, `packages/backend/convex/notes_reference.ts`, `apps/web/src/components/ticket/ticket-workspace-actions.tsx`
- [x] Draft generation - ensure/regenerate flows and fallback metadata are implemented. Evidence: `packages/backend/convex/drafts.ts`, `packages/backend/convex/ai/generate_draft_reply.ts`
- [x] Approved reply sending - UI, backend action, and Resend send path are implemented. Evidence: `apps/web/src/components/ticket/draft-reply-panel.tsx`, `packages/backend/convex/replies.ts`, `packages/backend/convex/lib/send_reply.ts`
- [x] Inbound webhook ingestion - signature validation, parsing, idempotent ingest, and failure recording are implemented. Evidence: `packages/backend/convex/webhooks/resend.ts`, `packages/backend/convex/messages.ts`, `packages/backend/convex/tickets.ts`
- [x] Classification - provider-backed ticket classification is wired with schema validation and deterministic fallback metadata. Evidence: `packages/backend/convex/ai/classify_ticket.ts`, `packages/backend/convex/lib/gemini_classification_provider.ts`
- [x] Routing - inbound ticket ingestion triggers classification and routing, then surfaces the result in queue/review/ticket views. Evidence: `packages/backend/convex/webhooks/resend.ts`, `packages/backend/convex/tickets.ts`, `packages/backend/convex/lib/routing/route_ticket.ts`
- [-] Workspaces/memberships admin - backend support exists without a frontend admin surface. Evidence: `packages/backend/convex/workspaces.ts`, `packages/backend/convex/memberships.ts`
- [-] E2E/bootstrap tooling - bootstrap flow and specs exist; the previous shared-port suite flake is addressed by isolating Playwright onto its own port, but sign-out-related E2E failures still remain. Evidence: `apps/web/src/app/api/e2e/bootstrap/route.ts`, `apps/web/tests/e2e/pilot-app.spec.ts`, `apps/web/tests/e2e/auth-flow.spec.ts`, `playwright.shared.cjs`

## Test Coverage

- [x] Auth - good unit/integration coverage plus E2E auth flow. Evidence: `apps/web/src/proxy.test.ts`, `apps/web/src/components/auth/email-password-auth-form.test.tsx`, `apps/web/tests/e2e/auth-flow.spec.ts`
- [x] Queue - page/component coverage now verifies live queue rendering. Evidence: `apps/web/src/app/(app)/queue/page.test.tsx`, `apps/web/src/components/queue/__tests__/ticket-table.test.tsx`
- [x] Review - backend workflow coverage plus live review page coverage now exist. Evidence: `packages/backend/convex/lib/__tests__/review-workflow.test.ts`, `apps/web/src/app/(app)/review/page.test.tsx`
- [x] Visibility - backend, page-level, and E2E coverage exist. Evidence: `packages/backend/convex/lib/__tests__/visibility.test.ts`, `apps/web/src/app/(app)/visibility/page.test.tsx`, `apps/web/tests/e2e/pilot-app.spec.ts`
- [x] Policy - backend, UI, and E2E coverage exist. Evidence: `packages/backend/convex/lib/__tests__/policy-update.test.ts`, `apps/web/src/components/settings/policy-form.test.tsx`, `apps/web/tests/e2e/pilot-app.spec.ts`
- [x] Ticket workspace - display/draft coverage now includes classification detail and action surfaces, with E2E coverage for note/review interactions. Evidence: `packages/backend/convex/lib/__tests__/ticket-detail-workspace.test.ts`, `apps/web/src/components/ticket/__tests__/ticket-detail.test.tsx`, `apps/web/tests/e2e/pilot-app.spec.ts`
- [x] Notes - note creation is covered through the ticket workspace flow. Evidence: `packages/backend/convex/notes.ts`, `apps/web/tests/e2e/pilot-app.spec.ts`
- [x] Draft generation - backend logic, UI behavior, and E2E coverage exist. Evidence: `packages/backend/convex/lib/__tests__/generate-draft-reply.test.ts`, `packages/backend/convex/lib/__tests__/draft-persistence.test.ts`, `apps/web/src/components/ticket/__tests__/draft-reply-panel.test.tsx`, `apps/web/tests/e2e/pilot-app.spec.ts`
- [x] Approved reply sending - backend and UI coverage exist, plus opt-in live outbound E2E. Evidence: `packages/backend/convex/lib/__tests__/send-reply.test.ts`, `packages/backend/convex/lib/__tests__/replies-action.test.ts`, `apps/web/tests/e2e/resend-live.spec.ts`
- [-] Inbound webhook ingestion - backend coverage exists, but no true live inbound E2E. Evidence: `packages/backend/convex/webhooks/__tests__/resend.test.ts`, `packages/backend/convex/webhooks/__tests__/resend-http.test.ts`, `packages/backend/convex/webhooks/__tests__/ingest-failures.test.ts`
- [x] Classification - schema plus provider-adapter coverage exist. Evidence: `packages/backend/convex/lib/__tests__/classification-schema.test.ts`, `packages/backend/convex/lib/__tests__/gemini-classification-provider.test.ts`
- [x] Routing - threshold and routing decision coverage exist, plus webhook ingestion coverage for classify-and-route invocation. Evidence: `packages/backend/convex/lib/routing/__tests__/route-ticket.test.ts`, `packages/backend/convex/lib/__tests__/routing-thresholds.test.ts`, `packages/backend/convex/webhooks/__tests__/resend-http.test.ts`
- [-] Workspaces/memberships admin - backend coverage exists, but no frontend/admin route coverage. Evidence: `packages/backend/convex/lib/__tests__/pilot-workspace.test.ts`, `packages/backend/convex/lib/__tests__/authz.test.ts`

## Last Verified

- [x] `bun run test` - passed on 2026-03-08 with 43 test files and 159 tests passing.
- [x] `bun run build` - passed on 2026-03-08; Next built `/`, `/queue`, `/review`, `/visibility`, `/settings/policy`, `/sign-in`, `/sign-up`, `/tickets/[ticketId]`, `/api/auth/[...all]`, and `/api/e2e/bootstrap`.
- [-] `bunx playwright test` - latest full rerun on 2026-03-08 was not clean: 11 passed, 2 failed, 1 skipped. The earlier `Failed to fetch` / `ERR_CONNECTION_REFUSED` suite-level port collisions are addressed by moving Playwright to `3101`, and the remaining failures are `apps/web/tests/e2e/auth-flow.spec.ts:59` and `apps/web/tests/e2e/pilot-app.spec.ts:146`, both waiting for `signed out` after clicking `Sign out`.
- [x] `bunx vitest run --project web --config ./vitest.workspace.ts apps/web/playwright.config.test.ts` - passed on 2026-03-08 and verifies the Playwright server now runs on isolated port `3101`.
- [x] `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts -g "returns a 404 for invalid ticket ids"` - isolated rerun passed on 2026-03-08, which supports that the invalid-ticket route itself is not the current blocker.

## Current Bottom Line

- [x] Core auth, visibility, policy, draft generation, reply sending, inbound webhook plumbing, classification, and routing are in place.
- [x] The ticket workspace now supports note entry and review actions.
- [x] Queue and review are live product flows backed by current ticket state.
- [-] Workspace/member admin remains only partially complete because the backend support still lacks a frontend admin surface.
- [-] The standard Playwright suite still has sign-out-related failures, but the separate shared-port collision issue has been reduced by isolating E2E to port `3101`.
