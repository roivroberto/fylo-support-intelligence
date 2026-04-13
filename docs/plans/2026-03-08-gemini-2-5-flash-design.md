# Gemini 2.5 Flash Default Design

## Context
- The draft-generation provider adapter currently defaults to `gemini-2.0-flash` in `packages/backend/convex/lib/gemini_draft_provider.ts`.
- The user wants the app to use Gemini 2.5 Flash instead.
- The existing adapter already accepts an optional explicit `model`, so the smallest safe change is to update the built-in default.

## Decision
- Change the provider default model from `gemini-2.0-flash` to `gemini-2.5-flash`.
- Keep the current API key flow and request shape unchanged.
- Keep the optional `model` override in the provider helper unchanged.

## Why This Approach
- It matches the user request directly without introducing new environment variables or configuration surface.
- It preserves current behavior for callers that explicitly pass a model.
- It only requires small test updates around the generated request URL.

## Scope
- Update the default model constant in `packages/backend/convex/lib/gemini_draft_provider.ts`.
- Update provider tests that assert the request URL.
- Re-run focused backend tests for the provider path.

## Out Of Scope
- Adding a new model environment variable.
- Changing prompt structure, schema handling, or fallback behavior.
- Changing any non-draft AI provider usage.

## Verification
- Focused backend provider tests should pass.
- The request URL asserted in tests should reference `gemini-2.5-flash`.
