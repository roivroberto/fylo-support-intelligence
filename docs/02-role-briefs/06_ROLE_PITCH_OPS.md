# Draft — Role: Pitch / Research / Operations

> **Major edits in this pass**
> - Updated the product story around **support emails entering a shared inbox**.
> - Added the richer classification and confidence-threshold workflow.
> - Kept LinkedIn bootstrap and live integrations out of the spoken MVP story.
> - Preserved the main wedge: explainable routing + visible review, not generic AI helpdesk hype.

## Mission
Make the demo story land. Do not sound like a fake startup deck. Lead with one sharp operational problem and one credible vertical slice.

## Demo story arc
1. Small support teams still run on shared inboxes, manual triage, and lead intuition
2. Existing AI ticketing patterns already exist, so novelty is **not** the claim
3. Our wedge is explainable routing for small support pods without enterprise tooling
4. Humans still review uncertain cases using visible thresholds
5. Screen 3 shows work distribution clearly enough to build trust, not surveillance

## 2–4 minute pitch structure
### 1. Problem
Small support pods handle incoming support emails and routing manually. Important tickets get buried, routing decisions are hard to explain, and QA often happens after mistakes.

### 2. User
A **team lead / operator of a 5–20 person outsourced support pod or e-commerce support micro-agency** running on lightweight tools, not enterprise systems.

### 3. Solution
An **explainable routing layer for small support teams** that turns support emails into structured tickets, classifies them, routes them with visible logic, escalates medium-confidence cases to manager verification, sends low-confidence cases to manual triage, and ends with a Work Distribution Visibility view.

### 4. Why this matters
This is a **Future of Work** story because it shows AI supporting more legible, judgment-preserving service work in a Philippines context shaped by services and outsourcing.

The **Collective Prosperity** angle is real but light: not ownership solved, but work allocation made more legible and less opaque. Keep this to the impact slide or Q&A, not the title slide.

### 5. Feasibility
We intentionally cut scope to a single support-email workflow with seeded data, deterministic routing, threshold-based review, and a local no-network demo path.

## Judging angle
- **Innovation:** explainable routing + readable assignment reasons + visible review thresholds for small support pods, not generic AI ticketing
- **Feasibility:** thin vertical slice, seeded inbox messages, deterministic routing, no-network fallback
- **Impact potential:** better operational clarity and trust for small service teams in a large Philippine support-work context
- **Track fit:** strong primary fit to Future of Work; secondary fit only where it strengthens the case

## Speaking parts for 5 members
1. **Product Lead:** user + problem
2. **Tech Lead:** system flow and why we cut live inbox / live AI risk
3. **Frontend/UX:** 3-screen walkthrough
4. **Backend/Data/AI:** routing logic + review thresholds
5. **Pitch/Ops:** why now, impact, close, Q&A guardrails

## Timeboxed execution plan
- **Hour 1:** data and pitch language locked
- **Hour 2:** routing screen + review states visible
- **Hour 3:** full demo path stable locally
- **Hour 4:** rehearse twice, cut weak claims, prepare backup demo

## Backup demo plan if something breaks
- Show local build first
- If the app is unstable, use prerecorded walkthrough
- Keep three backup screenshots:
  1. inbox + classification table
  2. routing + review queues
  3. Work Distribution Visibility
- Use `routing_expected.csv` as source of truth if needed

## Guardrails for spoken pitch
- Do **not** say “we built a better Zendesk”
- Do **not** say “worker ownership is solved”
- Do **not** say “AI triage” is novel
- Do **not** lead with “worker-led” or “co-op”
- Do **not** imply live LinkedIn auth or live inbox sync if you did not build them
- Do say: “AI clears repetitive structure; humans keep judgment” if asked about the pattern

## What this person must get done before the next checkpoint (4 hours)
1. Write the 30-second opening and 15-second close.
2. Prepare the demo narration for the 3 screens.
3. Draft mentor questions for Nana Luz / Softype and Bestsign first.
4. Keep everyone from overclaiming ownership, worker benefit, or novelty.
5. Keep LinkedIn bootstrap and historical-performance language parked unless directly asked.
