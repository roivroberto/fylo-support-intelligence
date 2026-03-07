# Gemma 3 27B Default Design

## Context
- The draft-generation provider adapter currently defaults to `gemini-2.5-flash` in `packages/backend/convex/lib/gemini_draft_provider.ts`.
- The live Google model list for the current `AI_PROVIDER_API_KEY` includes `models/gemma-3-27b-it`, which is the exact API model id for the requested Gemma 3 27B target.
- The provider adapter already accepts an optional explicit `model`, so the smallest safe change is to update only the built-in default.

## Decision
- Change the provider default model from `gemini-2.5-flash` to `gemma-3-27b-it`.
- Keep the current API key flow, prompt, parser, and optional `model` override unchanged.
- Omit `generationConfig.responseMimeType` whenever the resolved model id is `gemma-3-27b-it`, because that model rejects JSON mode with a 400 and already returns fenced JSON that the parser can handle.
- Verify the switch with both focused automated tests and a live provider call using the current environment key.

## Why This Approach
- It directly matches the requested model using the exact API model id returned by the live model catalog.
- It avoids adding configuration surface that the user did not request.
- It lets us preserve the smallest possible compatibility fix while still proving transport-level and app-level parsed output.

## Scope
- Update the default model constant in `packages/backend/convex/lib/gemini_draft_provider.ts`.
- Omit JSON mode whenever the resolved model is Gemma, including explicit `model: "gemma-3-27b-it"` overrides, while leaving other model ids on the prior request path.
- Update the provider URL assertion in `packages/backend/convex/lib/__tests__/gemini-draft-provider.test.ts`.
- Run a live provider call and a live wrapper-path call, then capture the returned output for the user.
- Commit and push the resulting change after verification.

## Out Of Scope
- Renaming files or symbols from `gemini_*` to `gemma_*`.
- Changing prompt wording, fallback behavior, or response parsing.
- Adding a model environment variable.

## Verification
- Focused provider tests pass.
- A live call to `gemma-3-27b-it` succeeds without `generationConfig.responseMimeType` and returns parseable fenced JSON with `summary`, `recommended_action`, and `draft_reply`.
- The app wrapper path returns `generationSource: "provider"`, `usedFallback: false`, and `fallbackReason: null`.
