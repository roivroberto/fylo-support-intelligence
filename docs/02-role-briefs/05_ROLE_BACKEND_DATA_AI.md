# Draft — Role: Backend / Data / AI

> **Major edits in this pass**
> - Re-defined the mission around **believable routing behavior**, not live AI.
> - Demoted `/api/classify` to optional.
> - Added explicit enums, explainability fields, deterministic review threshold, and seed-first scripts.
> - Split what must feel real from what can safely be mocked.

## Mission
Make the routing behavior believable and testable first. Treat AI as optional until the deterministic path is locked.

## Draft data model
### Worker
- worker_id
- name
- role
- primary_skills[]
- secondary_skills[]
- available
- active_load
- max_capacity

### Ticket
- ticket_id
- customer_name
- customer_org
- customer_tier
- channel
- subject
- message
- required_skills[]
- category
- urgency
- complexity
- sla_bucket
- classification_confidence
- status

### RoutingDecision
- ticket_id
- assigned_worker_id
- review_required
- review_owner_id
- routing_reason
- routing_explanation[]
- why_not_top_alternative
- matched_skill
- skill_match_level
- load_before
- load_after
- priority_reason
- confidence_rule_applied
- review_reason
- routing_outcome

### WorkDistributionVisibilityRow
- worker_id
- starting_load
- ending_load
- new_assignments
- urgent_or_critical_assigned
- vip_assigned
- categories_handled
- work_distribution_note

## Draft API contract
> **Draft note:** API boundaries are optional for MVP. The app can run entirely from local utilities if time is tight.

### `GET /api/seeds/tickets`
Returns seeded tickets.  
**Nice-to-have, not MVP** if local import already works.

### `GET /api/seeds/workers`
Returns seeded workers.  
**Nice-to-have, not MVP** if local import already works.

### `POST /api/classify`
**Validation Needed:** only keep if the live output is stable. Seed values remain the default demo path.

**Input**
```json
{
  "ticket_id": "t_1001"
}
```

**Output**
```json
{
  "ticket_id": "t_1001",
  "category": "refund_request",
  "urgency": "high",
  "complexity": "medium",
  "classification_confidence": 0.58
}
```

### `POST /api/route`
Optional convenience boundary only. Core logic can stay local.

**Input**
```json
{
  "ticket_ids": ["t_1001", "t_1002"]
}
```

**Output**
```json
{
  "assignments": [
    {
      "ticket_id": "t_1001",
      "review_required": true,
      "review_owner_id": "w_001",
      "routing_outcome": "review_queue",
      "routing_reason": "Low classification confidence. Team lead review required before final assignment."
    }
  ]
}
```

### `GET /api/dashboard`
Returns dashboard summary and work distribution data.  
**Nice-to-have, not MVP** if the dashboard can be built directly from routing output.

## AI / automation logic
### Classification
- **Draft:** optional bonus path only
- Use AI to infer category, urgency, and complexity only if the output schema stays stable
- Fall back to seeded values immediately if model output drifts
- Do **not** let the model invent routing inputs during the live demo

### QA
- **Nice-to-have, not MVP**
- Only show one seeded weak-response example if time permits

## Retrieval / rules / workflow logic
### Locked routing formula
> Each ticket goes to the available worker with the best skill match and manageable workload. Urgent or VIP tickets are prioritized. If confidence is low, the team lead reviews it before assignment.

### Hard rule
- Any ticket with `classification_confidence < 0.65` must enter review before assignment

### Strong recommendation
- Do **not** introduce a fairness score
- Do **not** let the model decide routing directly
- Do **not** hide the rule behind “AI magic”

## Explicit enums
- `urgency`: `low | medium | high | critical`
- `complexity`: `low | medium | high`
- `routing_outcome`: `assigned | review_queue`
- `customer_tier`: `standard | vip`
- `skill_match_level`: `low | medium | high`

## Mock data plan
Create first:
- `/data/tickets_seed.csv`
- `/data/workers_seed.csv`
- `/data/routing_expected.csv`
- `/data/dashboard_seed.json`

### Dataset constraints
- 40–60 seeded customer support tickets
- 6–8 workers
- enough variation in category, urgency, customer tier, ambiguity, and worker load to make routing decisions visible
- at least one low-confidence VIP / refund / escalation case that goes to review

## Required scripts
- `validate-seeds`
- `route-from-seeds`
- `build-dashboard-from-routing`
- `demo-reset`

## What can be faked for demo without hurting credibility
- Classification outputs
- QA outputs
- Dashboard trend visuals
- Time-series history

## What should not be fake if possible
- Routing results
- Review queue trigger
- Worker load changes
- Dashboard roll-up
- Readable routing explanation
- One “why not the next best worker?” explanation

## Anti-goals
- Do not spend time optimizing prompts until the seed data and route outputs are fully locked.
- Do not add fairness math you cannot defend.
- Do not expand into agentic workflows.

## What this person must get done before the next checkpoint (4 hours)
1. Finish all seed files first.
2. Implement the deterministic routing function.
3. Validate that `routing_expected.csv` matches the code output.
4. Hand frontend stable route output + dashboard data.
5. Mark every AI-dependent piece as optional until proven stable.
