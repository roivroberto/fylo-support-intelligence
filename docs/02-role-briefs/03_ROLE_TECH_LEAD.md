# Draft — Role: Tech Lead / Integrations

> **Major edits in this pass**
> - Locked a **no-network demo path** as the priority.
> - Demoted live AI and API boundaries out of the critical path.
> - Added shared types, validation scripts, demo reset, and explicit non-goals.
> - Reordered milestones around dataset → routing → dashboard → UI → optional AI → deployment.

## Mission
Ship the thinnest vertical slice that feels reliable in a demo. Reliability beats elegance. Lock a no-network demo path before attempting live AI or deployment polish.

## Simplest architecture that can ship
- **Frontend:** Next.js app with three main screens
- **Backend:** optional only; prefer pure utility functions first
- **Data:** seeded CSV + JSON loaded locally
- **AI:** optional demo enhancer only; the core demo must run entirely from seeded data and deterministic logic
- **Deployment:** local-first; hosted build only after local demo is stable

## Proposed stack
- Next.js
- TypeScript
- Tailwind
- Local data loader
- Shared `types.ts`
- Pure utility functions:
  - `loadTickets()`
  - `loadWorkers()`
  - `routeTickets()`
  - `buildDashboard()`
- No database required for the first stable demo

## Thin vertical slice
1. Load `tickets_seed.csv`
2. Render classification table
3. Run deterministic routing function against `workers_seed.csv`
4. Send low-confidence tickets to review queue
5. Render Work Distribution Visibility derived from actual routing output

## Critical path
1. Dataset locked
2. Shared object shapes frozen
3. Routing engine implemented and tested
4. Dashboard derived from route output
5. Frontend wired to deterministic outputs
6. Local no-network demo path proven
7. Optional live AI experiment
8. Deployment last

## Top 3 technical failure points
1. **Weak seeded data**
   - If the ticket mix is boring, the demo looks fake or trivial
2. **Contract drift**
   - If field names or enums drift across data, route logic, and UI, the app becomes flaky
3. **LLM / deployment instability**
   - Live AI latency or bad deployment timing can sink an otherwise good demo

## Fallback plan if APIs / auth / deployment fail
- **If AI fails:** use seeded classification JSON and remove live AI from the spoken narrative
- **If deployment fails:** run locally with a clean demo script
- **If API layer gets messy:** collapse routing into frontend utilities immediately
- **If the app becomes unstable:** use prerecorded walkthrough + three backup screenshots

## Delivery milestones
- **Hour 1:** data files locked
- **Hour 2:** shared types + deterministic routing pass fixture tests
- **Hour 3:** dashboard derived from route output, UI wired to seed mode
- **Hour 4:** demo flow stable end-to-end locally
- **Hour 5+:** optional AI polish or deployment

## Recommended routing implementation
Do not overbuild scoring. Use readable logic:
1. Filter to available workers
2. Prefer best skill match
3. Break ties with lighter current load
4. Surface priority note for urgent or VIP
5. If `classification_confidence < 0.65`, route to team lead review instead of direct assignment
6. Log which rule fired so the UI can narrate the decision

## Non-goals
- No auth
- No database
- No live integrations
- No multi-user sync
- No real-time state
- No model-driven routing
- No agentic workflow

## What this person must get done before the next checkpoint (4 hours)
1. Lock file ingestion for all seed files.
2. Create one shared `types.ts` for ticket, worker, routing decision, and dashboard payloads.
3. Implement deterministic routing with readable reasons.
4. Create one validation script that compares expected routing against actual outputs.
5. Prepare one no-network demo path and one demo reset command.
