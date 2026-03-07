# Draft — README

## Snapshot
- **One-sentence concept:** An **explainable routing layer for small Filipino support teams** that turns inbound support emails into structured tickets, classifies them, routes them with visible logic, escalates uncertain cases to human review, and shows work distribution clearly.
- **Target user:** Team lead or operator of a **5–20 person outsourced support pod or e-commerce support micro-agency** using a team inbox, lightweight tools, and at least some manual assignment.
- **Core pain:** Support requests land in a shared inbox, ticket attributes are inferred inconsistently, routing lives in the lead’s head, urgent cases can get buried, and workers have limited visibility into why work moved the way it did.
- **Primary track:** Future of Work
- **Optional secondary track:** Collective Prosperity (supporting lens only)
- **Current confidence level:** Medium
- **Biggest unknowns:**
  - Whether **LinkedIn-based skill bootstrap** is worth mentioning in MVP, or should stay post-demo.
  - Whether **Work Distribution Visibility** feels helpful rather than surveillance-heavy.
  - Whether workers actually care about routing legibility enough for that to be part of the main story.
  - Whether **historical performance** improves the routing story or just adds fake complexity.
- **One-sentence MVP promise:** Show one end-to-end flow where seeded support emails become structured tickets, are classified across a small fixed schema, routed with clear reasons, reviewed by a human when confidence is not high enough, and summarized in a work-distribution view.

## Working status
- **Stage:** refinement
- **Next checkpoint:** 4 hours
- **Draft posture:** Revisable working docs only. Nothing here should be treated as final.

## Locked decisions
- Lead with **explainable routing layer for small support teams**.
- Demo use case is **customer support via shared inbox / support email**.
- MVP is limited to:
  1. email-derived ticket intake from seeded data
  2. ticket classification
  3. explainable routing
  4. human review when confidence is not high enough
  5. Work Distribution Visibility
- Routing factors in MVP:
  - skill match
  - product expertise
  - current workload
  - language compatibility
  - optional seeded historical-performance signal as tie-breaker only
- Review thresholds:
  - **confidence > 0.80** → auto-assignment allowed
  - **confidence 0.50–0.80** → manager verification
  - **confidence < 0.50** → manual triage
- **Do not** build live inbox sync, LinkedIn auth, database, or live model calls on the critical path.
- **Do not** introduce fairness scoring or ownership claims unless clearly justified.

## Recommended direction
Keep the product story brutally simple:
- **Screen 1:** Inbox-derived tickets + classification
- **Screen 2:** Routing decisions + review queue
- **Screen 3:** Work Distribution Visibility

## Explicit cuts
- No live email integration
- No LinkedIn OAuth in MVP
- No BPO marketplace
- No payroll or billing
- No worker voting system
- No client CRM
- No omnichannel integration
- No “AI agent” theater
- No full employee-performance ranking dashboard
