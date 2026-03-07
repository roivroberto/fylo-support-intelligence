# AI Draft Persistence Design

## Context
- Ticket detail currently renders a deterministic draft directly from `packages/backend/convex/drafts.ts` at query time.
- `packages/backend/convex/ai/generate_draft_reply.ts` already has fallback-aware generation helpers, but the action path is not provider-backed and the output is not persisted.
- The user wants draft generation to happen once, persist, and only change when someone explicitly regenerates it.
- Outbound email sending is already live-verified end to end through `apps/web/tests/e2e/resend-live.spec.ts`, while inbound Resend webhook handling is still verified through backend tests rather than a true live callback loop.

## Scope Decision
- Implement real provider-backed draft generation for the visible ticket reply workspace.
- Generate the first draft lazily on first ticket open when no stored draft exists.
- Persist draft content and metadata so reloads remain stable.
- Add explicit regenerate behavior that replaces the stored draft with a fresh provider attempt.
- Keep deterministic fallback behavior when provider generation fails or returns invalid schema.

## Architecture
1. Add persisted draft storage in Convex keyed by `ticketId`.
2. Keep the ticket-detail page query-only for reads, but allow the page to call an authenticated action when no draft exists yet.
3. Move provider integration into the backend action path so external network access stays out of Convex queries.
4. Normalize provider output through the existing draft schema parser, then store the result plus generation metadata.
5. Preserve the current deterministic generator as the fallback path and label the UI truthfully.

## Data Model
- Add a new Convex table for stored draft replies, one row per ticket.
- Store:
  - `ticketId`
  - `summary`
  - `recommendedAction`
  - `draftReply`
  - `usedFallback`
  - `fallbackReason`
  - `generationSource`
  - `generatedAt`
  - `updatedAt`
- Index by `ticketId` so reads are stable and idempotent.

## Backend Flow
### Read path
1. Query existing stored draft by `ticketId`.
2. Return `null` if missing.

### Ensure path
1. Validate access to the ticket.
2. Read the ticket and latest inbound message body.
3. If a stored draft already exists, return it unchanged.
4. Otherwise call a provider-backed action.
5. Parse structured output through the existing schema.
6. If provider output fails, store the deterministic fallback instead.
7. Persist the stored result and return it.

### Regenerate path
1. Validate access.
2. Re-run provider-backed generation for the same ticket.
3. Replace the stored row contents and timestamps.
4. Return the updated draft.

## Provider Integration
- Use the existing `AI_PROVIDER_API_KEY` from the backend environment.
- Prefer a direct `fetch` integration against the current Gemini-style API instead of adding a new SDK dependency.
- Keep the provider adapter small and isolated so the draft schema and fallback logic remain testable without network calls.
- Return structured JSON text and validate it with the current draft schema before persisting.

## UI Behavior
- Ticket detail continues to render the draft panel when draft data is available.
- On first open without a stored draft, the page triggers ensure-generation and renders the returned draft.
- The panel adds a `Regenerate draft` control.
- The panel shows truthful generation labels such as provider-generated vs fallback-generated, plus a generated timestamp if useful.
- Sending the approved reply continues to use the stored draft text.

## Error Handling
- Missing `AI_PROVIDER_API_KEY`: skip provider call, persist fallback, mark reason clearly.
- Provider exception: persist fallback with `generator_error`.
- Invalid provider schema: persist fallback with `invalid_schema`.
- Missing ticket or auth failure: preserve current Convex error behavior.
- Regenerate failure after a stored draft already exists: keep the existing stored draft untouched unless a new result is successfully persisted.

## Testing Strategy
- Add unit tests for provider-result parsing, provider failure fallback, and truthful generation labels.
- Add backend tests for persisted ensure/regenerate semantics.
- Add page tests for first-open generation behavior and stored-draft rendering.
- Extend Playwright coverage so a seeded ticket without a draft generates one on first open, stays stable on reload, and changes only after explicit regenerate.
- Keep the existing live outbound Resend E2E spec as the real send verification path.

## Email Verification Status
- Outbound email is already live-tested end to end through the real send UI flow.
- True inbound Resend webhook E2E is not practical in the current local-only setup without a public callback target such as a tunnel or hosted preview.
- The implementation plan should keep backend webhook contract tests in automation and document any manual live inbound verification separately.
