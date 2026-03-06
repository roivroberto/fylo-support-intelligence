# Draft — Role: Pitch / Research / Operations

> **Major edits in this pass**
> - Reframed the product away from **worker-led service team OS** toward **explainable routing for small support teams**.
> - Locked **Future of Work** as the only lead track.
> - Cut co-op / ownership overclaiming from the first 60–90 seconds.
> - Aligned the story to the judging criteria and the actual MVP wedge.

## Mission
Make the demo story land. Do not sound like a fake startup deck. Lead with one sharp operational problem and one credible vertical slice.

## Demo story arc
1. Small support teams still run on manual triage and lead intuition
2. Existing AI ticketing patterns already exist, so novelty is **not** the claim
3. Our wedge is explainable routing for small support pods without enterprise tooling
4. Humans still review uncertain cases
5. Screen 3 shows work distribution clearly enough to build trust, not surveillance

## 2–4 minute pitch structure
### 1. Problem
Small support pods handle intake and routing manually. Important tickets get buried, routing decisions are hard to explain, and QA often happens after mistakes.

### 2. User
A **team lead / operator of a 5–20 person outsourced support pod or e-commerce support micro-agency** running on lightweight tools, not enterprise systems.

### 3. Solution
An **explainable routing layer for small support teams** that classifies tickets, routes them with visible logic, escalates low-confidence cases to a human lead, and ends with a Work Distribution Visibility view.

### 4. Why this matters
This is a **Future of Work** story because it shows AI supporting more legible, judgment-preserving service work in a Philippines context shaped by services and outsourcing.【91:0†08_VALIDATION_RESEARCH.md†L17-L20】【85:7†10_MENTOR_SPONSOR_MAP.md†L25-L33】

The **Collective Prosperity** angle is real but light: not ownership solved, but work allocation made more legible and less opaque. Keep this to the impact slide or Q&A, not the title slide.【85:7†10_MENTOR_SPONSOR_MAP.md†L8-L23】

### 5. Feasibility
We intentionally cut scope to a single customer support workflow with seeded data, deterministic routing, and a local no-network demo path.【85:0†11_TECH_RISK_AND_PLAN_B.md†L3-L10】【85:0†11_TECH_RISK_AND_PLAN_B.md†L45-L56】

## Judging angle
- **Innovation:** explainable routing + readable assignment reasons + visible low-confidence review for small support pods, not generic AI ticketing.【85:2†09_COMPETITOR_AND_ANALOGS.md†L24-L46】
- **Feasibility:** thin vertical slice, seeded data, deterministic routing, no-network fallback.【85:0†11_TECH_RISK_AND_PLAN_B.md†L18-L30】【85:8†03_ROLE_TECH_LEAD.md†L43-L66】
- **Impact potential:** better operational clarity and trust for small service teams in a large Philippine support-work context.【91:0†08_VALIDATION_RESEARCH.md†L22-L26】
- **Track fit:** strong primary fit to Future of Work; secondary fit only where it strengthens the case.【85:7†10_MENTOR_SPONSOR_MAP.md†L3-L16】

## Speaking parts for 5 members
1. **Product Lead:** user + problem
2. **Tech Lead:** system flow and why we cut live AI risk
3. **Frontend/UX:** 3-screen walkthrough
4. **Backend/Data/AI:** routing logic + review threshold
5. **Pitch/Ops:** why now, impact, close, Q&A guardrails

## Timeboxed execution plan
- **Hour 1:** data and pitch language locked
- **Hour 2:** routing screen + review state visible
- **Hour 3:** full demo path stable locally
- **Hour 4:** rehearse twice, cut weak claims, prepare backup demo

## Backup demo plan if something breaks
- Show local build first
- If the app is unstable, use prerecorded walkthrough
- Keep three backup screenshots:
  1. classification table
  2. routing + review queue
  3. Work Distribution Visibility
- Use `routing_expected.csv` as source of truth if needed

## Guardrails for spoken pitch
- Do **not** say “we built a better Zendesk”
- Do **not** say “worker ownership is solved”
- Do **not** say “AI triage” is novel
- Do **not** lead with “worker-led” or “co-op”
- Do say: “AI clears repetitive structure; humans keep judgment” if asked about the pattern【91:1†Exploring The Four Focus Tracks.txt†L45-L49】

## What this person must get done before the next checkpoint (4 hours)
1. Write the 30-second opening and 15-second close.
2. Prepare the demo narration for the 3 screens.
3. Draft mentor questions for Nana Luz / Softype and Bestsign first.
4. Keep everyone from overclaiming ownership, worker benefit, or novelty.
