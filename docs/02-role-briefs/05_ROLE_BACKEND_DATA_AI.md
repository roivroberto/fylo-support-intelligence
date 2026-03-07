# Draft — Role: Backend / Data / AI

> **Major edits in this pass**
> - Updated the data model to start from **inbound support emails**.
> - Added the new classification schema and explicit review thresholds.
> - Expanded routing inputs to include **language compatibility** and optional **historical performance**.
> - Demoted live classification, live inbox integration, and LinkedIn auth to optional-only.

## Mission
Make the routing behavior believable and testable first. Treat AI as optional until the deterministic path is locked.

## Draft data model
### Worker
- worker_id
- name
- role
- primary_skills[]
- secondary_skills[]
- expertise_areas[]
- certifications[]
- language_skills[]
- available
- active_load
- max_capacity
- historical_performance_by_area
- profile_source_note

### InboxMessage
- message_id
- customer_name
- customer_org
- customer_tier
- from_email
- subject
- body
- received_at
- channel

### Ticket
- ticket_id
- message_id
- customer_name
- customer_org
- customer_tier
- subject
- message
- request_type
- priority
- severity
- product_area
- required_expertise
- customer_sentiment
- language
- classification_confidence
- status

### RoutingDecision
- ticket_id
- assigned_worker_id
- review_state
- review_owner_id
- routing_reason
- routing_explanation[]
- why_not_top_alternative
- matched_skill
- matched_product_area
- language_match
- historical_performance_signal
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
- urgent_assigned
- expertise_areas_used
- languages_used
- work_distribution_note

## Draft API contract
> **Draft note:** API boundaries are optional for MVP. The app can run entirely from local utilities if time is tight.

### `GET /api/seeds/inbox`
Returns seeded inbox messages.  
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
  "request_type": "refund_request",
  "priority": "high",
  "severity": "partial_functionality_broken",
  "product_area": "billing",
  "required_expertise": "billing_specialist",
  "customer_sentiment": "frustrated",
  "language": "en",
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
      "review_state": "manager_verification",
      "review_owner_id": "w_001",
      "routing_outcome": "review_queue",
      "routing_reason": "Best expertise match found, but confidence is below auto-assignment threshold. Manager verification required."
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
- Use AI to infer request type, priority, severity, product area, required expertise, sentiment, and language only if the output schema stays stable
- Fall back to seeded values immediately if model output drifts
- Do **not** let the model invent routing inputs during the live demo

### Skill bootstrap
- **Post-MVP / optional**
- Worker profiles may later be bootstrapped from LinkedIn signals such as skills, certifications, and job history
- For MVP, use seeded worker profile data only

### QA
- **Nice-to-have, not MVP**
- Only show one seeded weak-response example if time permits

## Retrieval / rules / workflow logic
### Locked routing formula
> Each ticket goes to the available worker with the best skill match, relevant product expertise, manageable workload, and language compatibility. Historical performance can be used only as a light seeded tie-breaker. Confidence thresholds determine whether the decision can be auto-assigned or must stop for review.

### Review thresholds
- `classification_confidence > 0.80` → `auto_assign_allowed`
- `classification_confidence >= 0.50 && <= 0.80` → `manager_verification`
- `classification_confidence < 0.50` → `manual_triage`

### Strong recommendation
- Do **not** introduce a fairness score
- Do **not** let the model decide routing directly
- Do **not** hide the rule behind “AI magic”
- Do **not** make historical performance a core MVP dependency

## Explicit enums
- `request_type`: `billing_issue | refund_request | technical_problem | account_access | feature_request | complaint | general_inquiry`
- `priority`: `low | medium | high | urgent`
- `severity`: `minor_issue | partial_functionality_broken | major_functionality_broken | system_unusable`
- `product_area`: `billing | authentication | api | mobile_app | dashboard | integrations`
- `required_expertise`: `billing_specialist | technical_support | customer_success | compliance`
- `customer_sentiment`: `calm | frustrated | angry | urgent`
- `routing_outcome`: `assigned | review_queue`
- `review_state`: `auto_assign_allowed | manager_verification | manual_triage`
- `customer_tier`: `standard | vip`
- `language`: `en | fil | mixed | other`
- `skill_match_level`: `low | medium | high`

## Mock data plan
Create first:
- `/data/support_emails_seed.csv`
- `/data/workers_seed.csv`
- `/data/routing_expected.csv`
- `/data/dashboard_seed.json`

### Dataset constraints
- 40–60 seeded support emails
- 6–8 workers
- enough variation in request type, priority, severity, product area, language, ambiguity, and worker load to make routing decisions visible
- at least one mid-confidence case for manager verification
- at least one low-confidence VIP / refund / escalation case that goes to manual triage

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
- LinkedIn-source note on worker profiles

## What should not be fake if possible
- Routing results
- Review-state trigger
- Worker load changes
- Dashboard roll-up
- Readable routing explanation
- One “why not the next best worker?” explanation

## Anti-goals
- Do not spend time optimizing prompts until the seed data and route outputs are fully locked.
- Do not add fairness math you cannot defend.
- Do not expand into agentic workflows.
- Do not make LinkedIn bootstrap or live inbox sync part of the MVP path.

## What this person must get done before the next checkpoint (4 hours)
1. Finish all seed files first.
2. Implement the deterministic routing function.
3. Validate that `routing_expected.csv` matches the code output.
4. Hand frontend stable route output + dashboard data.
5. Mark every AI-dependent piece as optional until proven stable.
6. Keep historical-performance and LinkedIn signals as optional, not foundational.
