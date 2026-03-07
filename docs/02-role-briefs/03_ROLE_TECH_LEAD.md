# Draft — Role: Tech Lead / Integrations

> **Major edits in this pass**
> - Updated the thin slice around **seeded inbox messages → structured tickets → routing → review → visibility**.
> - Added the richer ticket schema and threshold-based review states.
> - Demoted live email ingestion, LinkedIn auth, and live AI out of the critical path.
> - Reordered milestones around dataset → types → routing → review states → dashboard → UI.

## Mission
Ship the thinnest vertical slice that feels reliable in a demo. Reliability beats elegance. Lock a no-network demo path before attempting live AI, live inbox ingestion, LinkedIn auth, or deployment polish.

## Simplest architecture that can ship
- **Frontend:** Next.js app with three main screens
- **Backend:** optional only; prefer pure utility functions first
- **Data:** seeded CSV + JSON loaded locally
- **Inbox ingestion:** represented by seeded email messages; no real email sync in MVP
- **Worker profiles:** seeded locally; no real LinkedIn OAuth in MVP
- **AI:** optional demo enhancer only; the core demo must run entirely from seeded data and deterministic logic
- **Deployment:** local-first; hosted build only after local demo is stable

## Proposed stack
- Next.js
- TypeScript
- Tailwind
- Local data loader
- Shared `types.ts`
- Pure utility functions:
  - `loadInboxMessages()`
  - `loadWorkers()`
  - `routeTickets()`
  - `buildDashboard()`
- No database required for the first stable demo

## Thin vertical slice
1. Load `support_emails_seed.csv`
2. Render inbox-derived ticket table
3. Show fixed classification attributes on each ticket
4. Run deterministic routing against `workers_seed.csv`
5. Send mid-confidence tickets to manager verification
6. Send low-confidence tickets to manual triage
7. Render Work Distribution Visibility derived from actual routing output

## Critical path
1. Dataset locked
2. Shared object shapes frozen
3. Routing engine implemented and tested
4. Review-state thresholds implemented
5. Dashboard derived from route output
6. Frontend wired to deterministic outputs
7. Local no-network demo path proven
8. Optional live AI experiment
9. Deployment last

## Top 4 technical failure points
1. **Weak seeded data**
   - If the inbox messages and worker profiles are boring, the demo looks fake or trivial
2. **Contract drift**
   - If field names or enums drift across data, route logic, and UI, the app becomes flaky
3. **Overbuilt ingestion / auth**
   - Live inbox sync or LinkedIn OAuth can sink the demo for almost no judging value
4. **LLM / deployment instability**
   - Live AI latency or bad deployment timing can sink an otherwise good demo

## Fallback plan if APIs / auth / deployment fail
- **If AI fails:** use seeded classification JSON and remove live AI from the spoken narrative
- **If inbox parsing gets messy:** keep email messages as already structured seed rows
- **If LinkedIn/bootstrap gets messy:** use seeded worker profiles only
- **If deployment fails:** run locally with a clean demo script
- **If the app becomes unstable:** use prerecorded walkthrough + three backup screenshots

## Delivery milestones
- **Hour 1:** data files locked
- **Hour 2:** shared types + deterministic routing + threshold logic + fixture tests
- **Hour 3:** dashboard derived from route output, UI wired to seed mode
- **Hour 4:** demo flow stable end-to-end locally
- **Hour 5+:** optional AI polish or deployment

## Recommended routing implementation
Do not overbuild scoring. Use readable logic:
1. Filter to available workers
2. Prefer best required-expertise and product-area match
3. Prefer language-compatible workers when the ticket language is not default English
4. Break ties with lighter current load
5. Use seeded historical performance only as a light tie-breaker if already available
6. Apply confidence thresholds:
   - `> 0.80` → auto-assignment allowed
   - `0.50–0.80` → manager verification
   - `< 0.50` → manual triage
7. Log which rules fired so the UI can narrate the decision

## Non-goals
- No auth
- No database
- No live inbox integrations
- No real LinkedIn OAuth
- No multi-user sync
- No real-time state
- No model-driven routing
- No agentic workflow

## What this person must get done before the next checkpoint (4 hours)
1. Lock file ingestion for all seed files.
2. Create one shared `types.ts` for inbox message, ticket, worker, routing decision, and dashboard payloads.
3. Implement deterministic routing with readable reasons.
4. Implement threshold logic for auto-assign, manager verification, and manual triage.
5. Create one validation script that compares expected routing against actual outputs.
6. Prepare one no-network demo path and one demo reset command.
