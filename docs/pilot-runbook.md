# Pilot Runbook

## Purpose

Use this runbook to verify the operational core pilot is up, the expanded local E2E suite still passes, and inbound webhook failures leave a small breadcrumb for follow-up.

## Before a pilot session

1. Install dependencies with `bun install`.
2. Confirm placeholder public env vars exist locally or rely on the Playwright smoke defaults.
3. Start the web app with `bun run dev:web` if you want to inspect the pilot manually.

## Local E2E verification

Run the full pilot E2E suite when your local env files and Convex dev setup are configured:

```bash
bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts
```

Expected result: authenticated bootstrap, visibility, policy, and ticket workflows all pass without sending a real email.

## Live outbound email verification

Run the guarded live outbound check only when local env files include working Resend credentials and you intend to send a real message:

```bash
E2E_RESEND_LIVE=1 bunx playwright test apps/web/tests/e2e/resend-live.spec.ts
```

Expected result: the app sends one approved reply through Resend and verifies that the outbound message record was persisted.

This spec is intentionally opt-in and is not part of the default local or CI Playwright run.

## CI-safe smoke verification

Run the focused smoke test when you only need a lightweight route check:

```bash
bunx playwright test apps/web/tests/e2e/pilot-smoke.spec.ts
```

Expected result: the `/queue` route loads and shows the `Shared Queue` heading for the pilot workspace.

## Inbound webhook reliability checks

The Resend inbound webhook now records a lightweight failure payload when trusted requests cannot be parsed or persisted.

- `invalid_json`: webhook body could not be parsed.
- `invalid_payload`: payload shape was missing required inbound fields.
- `ingest_mutation_failed`: Convex ingest mutations threw before the ticket/message write completed.

Each failure includes a short `payloadDigest` so the team can correlate repeated failures without storing the full raw payload in the failure record.

## True inbound webhook verification

The default local and CI checks cover the inbound webhook code paths through unit, integration, and handler-level tests.

A true provider-to-app inbound verification still requires a public callback target that Resend can reach, such as a deployed environment or a local tunnel. Treat that as a manual verification path rather than a default local CI step.

## If the local E2E suite or smoke test fails

1. Re-run `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts` if local env/bootstrap coverage failed, or `bunx playwright test apps/web/tests/e2e/pilot-smoke.spec.ts` for the CI-safe smoke path.
2. Open the generated Playwright trace or `test-results/` error context.
3. Manually load `/queue`, `/visibility`, and `/settings/policy` and confirm the pilot shell renders.
4. If the failure started after inbound email changes, inspect webhook logs for `ingest_failure` records and compare the `reason` plus `payloadDigest`.

## CI expectation

GitHub Actions runs `bun test` plus the CI-safe pilot smoke test in `.github/workflows/ci.yml`. The expanded authenticated E2E suite is intended for local verification where the required env files and Convex dev deployment are available.
