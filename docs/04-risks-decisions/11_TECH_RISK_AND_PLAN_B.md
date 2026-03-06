# 11_TECH_RISK_AND_PLAN_B

## Smallest technical proof
The thinnest slice that proves the idea is **not** “AI ticket routing.” It is:

1. Load a seeded set of support tickets and worker profiles.
2. Show ticket attributes needed for routing: category, urgency, complexity, confidence.
3. Run a **deterministic routing function** using the locked rule.
4. Send low-confidence tickets to a review queue.
5. Update a simple Contribution Visibility view after assignment.

That is enough to prove all of the important claims:
- small teams can triage faster
- routing can be explainable
- AI stays assistive, not in charge
- worker contribution can be made more legible

### What must be real in this smallest proof
- seeded data loading
- deterministic routing logic
- low-confidence review trigger
- worker load updates
- dashboard roll-up after routing

### What can be optional in this smallest proof
- live AI classification
- QA scoring
- deployment
- backend API boundary
- database

### Recommended 3-screen demo
1. **Intake / Classification**
   - seeded tickets visible
   - category, urgency, complexity, confidence shown
2. **Routing / Review**
   - “Route tickets” action
   - readable reason for each assignment
   - one flagged low-confidence ticket goes to review
3. **Contribution Visibility**
   - assignments by worker
   - urgent/VIP distribution
   - before vs after load

## Critical dependencies
### Required dependencies
- **Seed dataset quality**
  - If the tickets and workers are weak, the whole demo looks fake.
- **Deterministic routing function**
  - This is the product’s core proof.
- **Stable shared object shape**
  - Frontend and backend must agree on the same fields.
- **No-network demo path**
  - The demo must run locally with zero internet dependence.
- **Readable routing reasons**
  - If the system cannot explain assignments in plain language, the pitch weakens.

### Optional dependencies
- **LLM classification call**
  - Nice to have, not core.
- **QA example call**
  - Only useful if it is clean and deterministic.
- **Hosted deployment**
  - Helpful, but not worth risking the demo.

## Top failure points
### 1. The seeded data does not produce visible routing drama
If the tickets are too similar, the routing engine looks trivial. If they are too random, the logic looks arbitrary.

### 2. The routing engine and expected outputs drift apart
If `/data/routing_expected.csv` and the actual routing code disagree, the team will waste hours debugging the wrong thing.

### 3. The LLM output is unstable or slow
Classification schema drift, latency, bad JSON, or inconsistent labels can break both the UI and the narrative.

### 4. Frontend and backend contract drift
If field names or enum values differ across the UI, seed files, and route function, you get last-minute demo bugs that feel “mysterious” but are just sloppy typing.

### 5. Deployment or network failure
A Vercel issue, bad environment variable, or weak Wi‑Fi can kill confidence minutes before demo time.

### 6. Contribution Visibility is read as surveillance
This is not a technical crash, but it is a demo risk. If the screen looks punitive instead of transparent, the story weakens fast.

## Probability x impact assessment
| Risk | Probability | Impact | Why it matters | Mitigation |
|---|---:|---:|---|---|
| Weak seeded data | High | High | The whole product story depends on visible, believable cases | Lock datasets first; include edge cases: VIP, urgent, ambiguous, overloaded worker, specialist worker |
| Routing/output drift | Medium | High | Core proof breaks | Snapshot expected outputs; add a simple validation script |
| LLM instability | High | Medium | Breaks the “smart” layer, not the whole concept | Precompute classifications; treat live AI as bonus |
| FE/BE schema mismatch | Medium | High | Causes silent UI bugs and wrong renders | Centralize shared types and enums |
| Deployment/network failure | Medium | High | Kills live demo flow | Prepare local no-network run and screenshots backup |
| Contribution screen misframed | Medium | Medium | Judges may see surveillance, not worker visibility | Rename carefully; show routing fairness and workload clarity, not ranking |

## Mock vs real recommendation
### Keep real
- routing algorithm
- review queue trigger
- worker load changes
- routing reasons
- dashboard roll-up from actual assignment outputs

### Safe to mock
- AI classification output
- QA scoring output
- trend charts over time
- ingestion from live tools like Gmail, Zendesk, Intercom, or Slack
- auth and user accounts
- persistent database writes

### Strong recommendation
Do **not** demo anything that depends on:
- live customer systems
- real email parsing
- OAuth
- external model availability
- multi-user sync

Those are demo-killers for this project.

## Safe demo fakery
This is how to simplify without lying.

### Safe statement 1
> For demo stability, we preloaded representative support tickets and worker profiles based on realistic team scenarios.

### Safe statement 2
> Classification is shown using fixed outputs for this demo so we can focus on the routing and review logic.

### Safe statement 3
> The AI layer is assistive. The core routing and review policy is deterministic and explainable.

### Safe statement 4
> QA is illustrated with one example case, not presented as a production-ready evaluation model.

### Safe statement 5
> Contribution Visibility is a demo summary of routing outcomes, not a live employee surveillance tool.

### Do not say
- “The AI autonomously manages teams.”
- “This is production-ready.”
- “We integrated with real support platforms.”
- “Workers own the platform now.”
- “The model is highly accurate.”

## Plan B architecture
If the “smart” part fails, the app should still demo cleanly.

### Plan B principle
**Keep the system as a local deterministic workflow app.**

### Recommended Plan B stack
- Next.js frontend only, or Next.js with zero real API dependence
- local JSON/CSV files in `/data`
- shared `types.ts`
- pure utility functions:
  - `loadTickets()`
  - `loadWorkers()`
  - `routeTickets()`
  - `buildDashboard()`

### Plan B logic
- `category`, `urgency`, `complexity`, and `classification_confidence` come from seed data
- `routeTickets()` uses the locked routing formula only
- low-confidence review is triggered by `classification_confidence < threshold`
- dashboard is derived from route outputs, not pre-baked screenshots

### Plan B threshold suggestion
- `classification_confidence < 0.65` → review queue

### Plan B output shape
Keep one stable object:

```ts
{
  ticket_id: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'low' | 'medium' | 'high';
  classification_confidence: number;
  assigned_worker_id?: string;
  review_required: boolean;
  review_owner_id?: string;
  routing_reason: string;
  routing_outcome: 'assigned' | 'review_queue';
}
```

### What changes from Plan A
- no live model calls
- no `/api/classify` dependency
- no separate QA service
- no server state required

## Plan B demo script
1. Open the app with seeded tickets already loaded.
2. Explain that the system supports AI-assisted classification, but for demo reliability the ticket attributes are preloaded.
3. Show 8–10 tickets with enough variation to make routing decisions obvious.
4. Click **Route Tickets**.
5. Show readable assignment reasons:
   - best skill match
   - current load manageable
   - urgent/VIP prioritized
6. Highlight one low-confidence ticket sent to the review queue.
7. Open review queue, approve or reassign it manually.
8. Open Contribution Visibility and show how the routing changed team load distribution.
9. End with the product point: the system makes triage more legible without hiding human judgment.

### Backup backup plan
If the app itself becomes unstable:
- use a prerecorded screen capture
- keep three static screenshots ready:
  1. classification table
  2. review queue example
  3. contribution view after routing
- narrate honestly that the demo is based on the local prototype flow

## Recommended edits to 03_ROLE_TECH_LEAD.md
### Edit 1 — change the mission
Add:
> Lock a no-network demo path before attempting any live AI or deployment polish.

### Edit 2 — tighten the architecture
Replace the current AI line with:
> **AI:** optional demo enhancer only; the core demo must run entirely from seeded data and deterministic logic.

### Edit 3 — add a non-goal section
Add:
- No auth
- No database
- No live integrations
- No multi-user state
- No real-time sync

### Edit 4 — add a shared contract task
Add to critical path:
> Create one shared `types.ts` file for ticket, worker, routing decision, and dashboard payloads.

### Edit 5 — add validation tooling
Add:
> Create one script that compares `routing_expected.csv` against actual routing output and fails fast on mismatch.

### Edit 6 — strengthen fallback plan
Replace fallback bullets with:
- If AI fails: use seeded classification JSON and remove live AI from the demo narrative.
- If API layer gets messy: collapse route computation into frontend utilities immediately.
- If deployment fails: switch to local demo, then prerecorded walkthrough if needed.

### Edit 7 — make the milestone order stricter
Recommended order:
1. dataset locked
2. route function correct
3. dashboard derived from route output
4. UI wired to seed mode
5. optional live AI experiment
6. deployment last

## Recommended edits to 05_ROLE_BACKEND_DATA_AI.md
### Edit 1 — redefine the mission
Replace with:
> Make the routing behavior believable and testable first. Treat AI as optional until the deterministic path is locked.

### Edit 2 — demote `/api/classify` from critical path
Keep the endpoint only if time allows. Add:
> The demo does not require live classification. Seed values are the default path.

### Edit 3 — add explicit enums
Add fixed enums for:
- `urgency`
- `complexity`
- `routing_outcome`
- `customer_tier`
- `skill_match_level`

This cuts frontend-backend drift.

### Edit 4 — add route explainability fields
Extend `RoutingDecision` with:
- `matched_skill`
- `load_before`
- `load_after`
- `priority_reason`
- `confidence_rule_applied`

These make the demo easier to narrate.

### Edit 5 — make review queue deterministic
Add one explicit rule:
> Any ticket with `classification_confidence < 0.65` must enter review before assignment.

### Edit 6 — add seed-first scripts
Add required scripts:
- `validate-seeds`
- `route-from-seeds`
- `build-dashboard-from-routing`

### Edit 7 — narrow the AI scope
Replace AI section with:
- Classification: optional bonus path only
- QA: one hardcoded or seeded example only
- No model-driven routing
- No agentic workflow

### Edit 8 — sharpen what must not be fake
Keep real if possible:
- deterministic route results
- review trigger
- load updates
- dashboard totals

Allow fake:
- label inference
- QA commentary
- time-series trend history

### Edit 9 — add one explicit anti-goal
Add:
> Do not spend time optimizing model prompts until the seed data and route outputs are fully locked.

## Bottom line
The project wins technically if it proves one thing cleanly:

> Given a believable set of tickets and workers, the system can classify or preload ticket attributes, route work with readable reasons, escalate low-confidence cases to human review, and show team contribution outcomes.

Everything else is garnish. If the team forgets that, they will overbuild and hurt the demo.
