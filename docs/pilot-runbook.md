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

## If the local E2E suite or smoke test fails

1. Re-run `bunx playwright test apps/web/tests/e2e/pilot-app.spec.ts` if local env/bootstrap coverage failed, or `bunx playwright test apps/web/tests/e2e/pilot-smoke.spec.ts` for the CI-safe smoke path.
2. Open the generated Playwright trace or `test-results/` error context.
3. Manually load `/queue`, `/visibility`, and `/settings/policy` and confirm the pilot shell renders.
4. If the failure started after inbound email changes, inspect webhook logs for `ingest_failure` records and compare the `reason` plus `payloadDigest`.

## CI expectation

GitHub Actions runs `bun test` plus the CI-safe pilot smoke test in `.github/workflows/ci.yml`. The expanded authenticated E2E suite is intended for local verification where the required env files and Convex dev deployment are available.
