# 11_TECH_RISK_AND_PLAN_B

## Smallest technical proof
The thinnest slice that proves the idea is **not** “AI ticket routing.” It is:

1. Load a seeded set of support emails and worker profiles.
2. Show ticket attributes needed for routing: request type, priority, severity, product area, required expertise, language, and confidence.
3. Run a **deterministic routing function** using the locked rule.
4. Send mid-confidence tickets to manager verification and low-confidence tickets to manual triage.
5. Update a simple Work Distribution Visibility view after assignment.

That is enough to prove all of the important claims:
- small teams can triage faster
- routing can be explainable
- AI stays assistive, not in charge
- review thresholds are visible and defensible
- team contribution can be made more legible

### What must be real in this smallest proof
- seeded inbox data loading
- deterministic routing logic
- threshold-based review trigger
- worker load updates
- dashboard roll-up after routing

### What can be optional in this smallest proof
- live AI classification
- QA scoring
- deployment
- backend API boundary
- database
- live email sync
- live LinkedIn auth

### Recommended 3-screen demo
1. **Inbox / Classification**
   - seeded support emails visible
   - request type, priority, severity, product area, language, confidence shown
2. **Routing / Review**
   - “Route tickets” action
   - readable reason for each assignment
   - one manager-verification case and one manual-triage case
3. **Work Distribution Visibility**
   - assignments by worker
   - urgent distribution
   - before vs after load

## Critical dependencies
### Required dependencies
- **Seed dataset quality**
  - If the inbox messages and workers are weak, the whole demo looks fake.
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
- **LinkedIn skill bootstrap**
  - Nice story garnish, dangerous demo dependency.
- **Hosted deployment**
  - Helpful, but not worth risking the demo.

## Top failure points
### 1. The seeded data does not produce visible routing drama
If the inbox messages are too similar, the routing engine looks trivial. If they are too random, the logic looks arbitrary.

### 2. The routing engine and expected outputs drift apart
If `/data/routing_expected.csv` and the actual routing code disagree, the team will waste hours debugging the wrong thing.

### 3. Live email ingestion or LinkedIn auth gets pulled into MVP
Both sound impressive. Both are classic demo-killers for this project.

### 4. The LLM output is unstable or slow
Classification schema drift, latency, bad JSON, or inconsistent labels can break both the UI and the narrative.

### 5. Frontend and backend contract drift
If field names or enum values differ across the UI, seed files, and route function, you get last-minute demo bugs that feel “mysterious” but are just sloppy typing.

### 6. Work Distribution Visibility is read as surveillance
This is not a technical crash, but it is a demo risk. If the screen looks punitive instead of transparent, the story weakens fast.

## Probability x impact assessment
| Risk | Probability | Impact | Why it matters | Mitigation |
|---|---:|---:|---|---|
| Weak seeded data | High | High | The whole product story depends on visible, believable cases | Lock datasets first; include edge cases: urgent, ambiguous, overloaded worker, language-specific case |
| Routing/output drift | Medium | High | Core proof breaks | Snapshot expected outputs; add a simple validation script |
| Live inbox / LinkedIn creep | High | High | Can destroy build time and demo stability | Ban both from MVP critical path |
| LLM instability | High | Medium | Breaks the “smart” layer, not the whole concept | Precompute classifications; treat live AI as bonus |
| FE/BE schema mismatch | Medium | High | Causes silent UI bugs and wrong renders | Centralize shared types and enums |
| Contribution screen misframed | Medium | Medium | Judges may see surveillance, not worker visibility | Rename carefully; show workload clarity, not ranking |

## Mock vs real recommendation
### Keep real
- routing algorithm
- review-state trigger
- worker load changes
- routing reasons
- dashboard roll-up from actual assignment outputs

### Safe to mock
- AI classification output
- QA scoring output
- trend charts over time
- ingestion from live tools like Gmail, Zendesk, Intercom, or Slack
- LinkedIn skill extraction
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
> For demo stability, we preloaded representative support emails and worker profiles based on realistic team scenarios.

### Safe statement 2
> Classification is shown using fixed outputs for this demo so we can focus on routing and review logic.

### Safe statement 3
> The AI layer is assistive. The core routing and review policy is deterministic and explainable.

### Safe statement 4
> LinkedIn-based profile bootstrap is part of the longer-term concept, not the hackathon MVP.

### Safe statement 5
> Work Distribution Visibility is a demo summary of routing outcomes, not a live employee surveillance tool.

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
  - `loadInboxMessages()`
  - `loadWorkers()`
  - `routeTickets()`
  - `buildDashboard()`

### Plan B logic
- classification fields come from seed data
- `routeTickets()` uses the locked routing formula only
- review states are triggered by the confidence thresholds
- dashboard is derived from route outputs, not pre-baked screenshots

### Plan B thresholds
- `classification_confidence > 0.80` → auto-assign allowed
- `classification_confidence 0.50–0.80` → manager verification
- `classification_confidence < 0.50` → manual triage

### Plan B output shape
Keep one stable object:

```ts
{
  ticket_id: string;
  request_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  severity: 'minor_issue' | 'partial_functionality_broken' | 'major_functionality_broken' | 'system_unusable';
  product_area: string;
  required_expertise: string;
  language: 'en' | 'fil' | 'mixed' | 'other';
  classification_confidence: number;
  assigned_worker_id?: string;
  review_state: 'auto_assign_allowed' | 'manager_verification' | 'manual_triage';
  review_owner_id?: string;
  routing_reason: string;
  routing_outcome: 'assigned' | 'review_queue';
}
```

### What changes from Plan A
- no live model calls
- no live inbox sync
- no LinkedIn auth dependency
- no separate QA service
- no server state required

## Plan B demo script
1. Open the app with seeded support emails already loaded.
2. Explain that the system supports AI-assisted classification, but for demo reliability the ticket attributes are preloaded.
3. Show 8–10 tickets with enough variation to make routing decisions obvious.
4. Click **Route Tickets**.
5. Show readable assignment reasons:
   - best expertise match
   - language fit
   - current load manageable
   - threshold-based review when needed
6. Highlight one manager-verification case.
7. Highlight one manual-triage case.
8. Open Work Distribution Visibility and show how the routing changed team load distribution.
9. End with the product point: the system makes triage more legible without hiding human judgment.

## Recommended edits to [03_ROLE_TECH_LEAD](../02-role-briefs/03_ROLE_TECH_LEAD.md)
### Edit 1 — change the mission
Add:
> Lock a no-network demo path before attempting any live inbox sync, live AI, or LinkedIn auth.

### Edit 2 — tighten the architecture
Replace the current ingestion line with:
> **Inbox ingestion:** represented by seeded inbox messages; no real email sync in MVP.

### Edit 3 — add a non-goal section
Add:
- No live inbox integrations
- No real LinkedIn OAuth
- No database
- No multi-user state
- No real-time sync

### Edit 4 — add a shared contract task
Add to critical path:
> Create one shared `types.ts` file for inbox message, ticket, worker, routing decision, and dashboard payloads.

### Edit 5 — add threshold tooling
Add:
> Create one validation script that verifies review-state thresholds and routing outputs against expected fixtures.

### Edit 6 — strengthen fallback plan
Replace fallback bullets with:
- If AI fails: use seeded classification JSON and remove live AI from the demo narrative.
- If inbox parsing gets messy: keep inbox rows already structured in seed data.
- If LinkedIn bootstrap gets messy: use seeded worker profiles only.
- If deployment fails: switch to local demo, then prerecorded walkthrough if needed.

## Recommended edits to [05_ROLE_BACKEND_DATA_AI](../02-role-briefs/05_ROLE_BACKEND_DATA_AI.md)
### Edit 1 — redefine the mission
Replace with:
> Make the routing behavior believable and testable first. Treat AI as optional until the deterministic path is locked.

### Edit 2 — update the data model
Add inbox messages, the richer ticket classification schema, language signals, and review states.

### Edit 3 — demote `/api/classify` from critical path
Keep the endpoint only if time allows. Add:
> The demo does not require live classification. Seed values are the default path.

### Edit 4 — make review states deterministic
Add explicit threshold states:
- `> 0.80` auto-assign allowed
- `0.50–0.80` manager verification
- `< 0.50` manual triage

### Edit 5 — narrow skill bootstrap scope
Add:
> LinkedIn-based worker profile bootstrap is optional and should not be on the MVP path.

### Edit 6 — sharpen what must not be fake
Keep real if possible:
- deterministic route results
- review trigger
- load updates
- dashboard totals

Allow fake:
- label inference
- QA commentary
- LinkedIn source note
- time-series trend history

## Bottom line
The project wins technically if it proves one thing cleanly:

> Given a believable set of support emails and worker profiles, the system can structure ticket attributes, route work with readable reasons, escalate uncertain cases to human review, and show team distribution outcomes.

Everything else is garnish.
