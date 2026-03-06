# Draft — Idea Draft

> **Major edits in this pass**
> - Narrowed the first user to one concrete segment: a **team lead / operator of a 5–20 person outsourced support pod or e-commerce support micro-agency**.
> - Demoted **worker-led** from headline language to a **Hypothesis / Validation Needed** label.
> - Locked **Future of Work** as the primary track; kept **Collective Prosperity** as a supporting lens only.
> - Renamed Screen 3 from **Contribution Visibility** to **Work Distribution Visibility** to reduce surveillance baggage.
> - Cut novelty claims. The wedge is now **explainable routing + readable reasons + low-confidence review + low-overhead setup for small support pods**.

## Working title
- **Recommended:** SharedShift
- **Alternate:** QueueLight

## Status labels
- **Draft:** explainable routing layer for small support teams
- **Hypothesis:** small support teams benefit when routing logic is legible and AI clears repetitive structure without hiding human decisions
- **Assumption:** workers will value visibility into work distribution if it is framed as coordination clarity, not performance scoring
- **Open Question:** does any version of **worker-led** help, or should it stay out of the spoken pitch entirely?
- **Validation Needed:** whether Work Distribution Visibility creates real worker trust or just reads as manager reporting
- **Nice-to-have, not MVP:** one QA example, one policy toggle, one plain-language explainer panel

## Problem statement
Small customer support pods often run on a shared inbox, chat escalations, spreadsheets, and lead intuition. Intake is messy. Categorization is inconsistent. Urgent tickets can get buried. Routing decisions live in one person’s head. QA usually happens after mistakes, not during triage.

AI can reduce repetitive triage work, but if it becomes a black box or just another manager dashboard, the product collapses into generic helpdesk theater.

## Who the user is
### Recommended primary user
- **Draft:** team lead or operator of a **5–20 person outsourced support pod / e-commerce support micro-agency**
- Already uses **business email/shared inbox/web forms**
- Still assigns at least some tickets manually
- Feels routing and prioritization mostly live in the lead’s head
- Needs faster triage, cleaner escalation, and more legible workload handling

### Secondary user
- **Hypothesis:** support worker inside the same team
- Wants less random assignment, clearer escalation logic, and more understandable workload distribution
- **Validation Needed:** whether this is real user value or a story we are projecting

## Current workaround
- Tickets arrive through email, chat, or forms
- A lead scans the queue and decides who should take what
- Urgent or VIP cases depend on attention and memory
- Escalations happen in chat threads
- Visibility is handled through sheets, ad hoc notes, or guesswork
- QA usually happens later, after errors or customer friction

## Why now
- The event’s **Future of Work** framing is explicitly about meaningful, equitable, empowering work in a Philippines context shaped by services, outsourcing, and overseas labor, and it asks who benefits as AI changes work (sources: [08_VALIDATION_RESEARCH](../03-research-validation/08_VALIDATION_RESEARCH.md), [10_MENTOR_SPONSOR_MAP](../03-research-validation/10_MENTOR_SPONSOR_MAP.md)).
- The event also treats tracks as **lenses, not silos**, so a light secondary **Collective Prosperity** angle is acceptable only if it strengthens the primary story rather than replacing it (sources: [08_VALIDATION_RESEARCH](../03-research-validation/08_VALIDATION_RESEARCH.md), [10_MENTOR_SPONSOR_MAP](../03-research-validation/10_MENTOR_SPONSOR_MAP.md)).
- Bestsign and Softype both reinforce the pattern that matters here: AI should handle repetitive structure while humans retain judgment and oversight (sources: [10_MENTOR_SPONSOR_MAP](../03-research-validation/10_MENTOR_SPONSOR_MAP.md), [09_COMPETITOR_AND_ANALOGS](../03-research-validation/09_COMPETITOR_AND_ANALOGS.md)).

## Proposed solution direction
Build an **explainable routing layer for small support teams** with one thin vertical slice:
1. **Intake:** load seeded support tickets
2. **Classify:** show category, urgency, complexity, and confidence
3. **Route:** assign each ticket using a readable deterministic rule
4. **Review:** send low-confidence tickets to team lead review before assignment
5. **Work Distribution Visibility:** show where work went, why, and how load changed

> **Draft framing note:** “worker-led” is not the product category. At most, it is optional supporting language if mentors confirm it helps instead of confusing.

## Locked routing formula
> Each ticket goes to the available worker with the best skill match and manageable workload. Urgent or VIP tickets are prioritized. If confidence is low, the team lead reviews it before assignment.

## Why this could matter
- Makes small service teams look more reliable without enterprise tooling
- Reduces manager-heavy triage work without hiding the rule
- Keeps AI in an assistive role rather than a black box
- Gives teams a more legible workflow, which is the only credible opening toward the secondary lens

## What makes it plausibly innovative
- **Draft:** do not claim novelty on AI triage, smart routing, or human-in-the-loop review
- The defensible wedge is:
  - explainable routing
  - readable “why this ticket / why this worker” logic
  - low-confidence review as a visible workflow state
  - lightweight-team fit for support pods without enterprise tooling
- **Validation Needed:** whether workers actually care about this visibility enough for it to be part of the core pitch

## What makes it plausibly feasible in a hackathon
- Seeded tickets and worker profiles can be controlled for demo clarity
- Routing can be deterministic and testable
- Live AI can be removed without breaking the core proof
- Three screens are enough to tell the story
- No database, auth, or live integrations are required for the first strong demo

## Demoable MVP
### End-to-end demo flow
1. Load seeded customer support tickets
2. Show classification attributes already attached to each ticket
3. Route tickets with visible reasons
4. Send one low-confidence case to the review queue
5. End on Work Distribution Visibility

### Must
- Ticket intake from seeded data
- Classification view
- Deterministic routing engine with readable reasons
- Review queue for low-confidence tickets
- Work Distribution Visibility view derived from actual route output

### Should
- Worker profile cards with skills and current load
- One “bad outcome prevented” example
- One plain-language explanation of the routing rule

### Could
- One QA example
- One policy toggle: `prefer_specialist` vs `balance_load`
- One side panel with customer tier / VIP context

### Cut
- Marketplace
- Live customer integrations
- Full QA suite
- Full cooperative governance
- Payout simulation
- Fancy analytics
- Any fairness score we cannot defend

## Explicit non-goals
- We are **not** building a BPO marketplace
- We are **not** proving legal worker ownership
- We are **not** replacing Zendesk / Freshdesk / Intercom
- We are **not** building payroll, billing, or scheduling
- We are **not** claiming fairness optimization or co-op governance in MVP

## Impact hypothesis
If a small support pod can explain how work is classified, routed, and reviewed, then the team can trust AI-assisted triage more easily and operate with less opaque decision-making.

## Risks / assumptions / validation needs
### Risks
- Could still look like generic support tooling
- Work Distribution Visibility could still be read as surveillance if the copy is wrong
- The product may matter more to leads than to workers
- Switching cost may be real if the pod already inherits a client’s helpdesk

### Assumptions
- Customer support remains the sharpest demo wedge
- The best first user is not “MSMEs in general,” but a support pod already using lightweight digital tools
- Judges will respond better to operational clarity than flashy AI theater
- The secondary track should stay subordinate unless real worker value becomes more evidenced

### Validation Needed
- Ask support leads what still stays manual even if they already use a helpdesk
- Ask cold listeners whether the phrase **explainable routing layer** is immediately clear
- Ask mentors whether Screen 3 should stay, be renamed again, or be demoted
- Ask at what ticket volume manual routing actually becomes painful enough to matter
