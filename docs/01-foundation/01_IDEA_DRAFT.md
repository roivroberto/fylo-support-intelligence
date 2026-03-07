# Draft — Idea Draft

> **Major edits in this pass**
> - Updated the workflow to start from a **shared support inbox / team email**.
> - Expanded the classification schema to include **request type, priority, severity, product area, required expertise, sentiment, language, and confidence**.
> - Updated routing to use **skill match, product expertise, workload, language compatibility, and optional historical performance**.
> - Added explicit **confidence thresholds** for auto-assignment, manager verification, and manual triage.
> - Kept live ingestion, LinkedIn bootstrap, and live AI **out of the MVP critical path**.

## Working title
- **Recommended:** SharedShift
- **Alternate:** QueueLight

## Status labels
- **Draft:** explainable routing layer for small support teams
- **Hypothesis:** small support teams benefit when routing logic is legible and repetitive ticket-structuring work is handled without hiding human decisions
- **Assumption:** workers will value visibility into work distribution if it is framed as coordination clarity, not scorekeeping
- **Open Question:** should any version of **LinkedIn skill bootstrap** appear in the pitch, or stay strictly post-MVP?
- **Validation Needed:** whether Work Distribution Visibility creates real worker trust or mostly reads as manager reporting
- **Nice-to-have, not MVP:** one QA example, one policy toggle, one plain-language explainer panel, one LinkedIn profile mock

## Problem statement
Small customer support pods often run on a shared inbox, chat escalations, spreadsheets, and lead intuition. Requests arrive as raw emails. Categorization is inconsistent. Urgent tickets can get buried. Routing decisions live in one person’s head. QA usually happens after mistakes, not during triage.

AI can reduce repetitive ticket-structuring work, but if it becomes a black box, fragile integration demo, or just another manager dashboard, the product collapses into generic helpdesk theater.

## Who the user is
### Recommended primary user
- **Draft:** team lead or operator of a **5–20 person outsourced support pod / e-commerce support micro-agency**
- Already uses **business email/shared inbox/web forms**
- Still assigns at least some tickets manually
- Feels routing, prioritization, and specialist matching mostly live in the lead’s head
- Needs faster triage, cleaner escalation, and more legible workload handling

### Secondary user
- **Hypothesis:** support worker inside the same team
- Wants less random assignment, clearer escalation logic, and more understandable workload distribution
- **Validation Needed:** whether this is real user value or a story we are projecting

## Current workaround
- Customers email a support inbox
- A lead or senior rep scans the inbox and mentally extracts what the request is about
- Urgent or VIP cases depend on attention and memory
- The lead decides who should take what based on gut feel, workload, and who “usually handles this”
- Escalations happen in chat threads
- Visibility is handled through sheets, ad hoc notes, or guesswork
- QA usually happens later, after errors or customer friction

## Why now
- The event’s **Future of Work** framing is explicitly about meaningful, equitable, empowering work in a Philippines context shaped by services, outsourcing, and overseas labor.
- The event also treats tracks as **lenses, not silos**, so a light secondary **Collective Prosperity** angle is acceptable only if it strengthens the primary story rather than replacing it.
- Bestsign and Softype both reinforce the pattern that matters here: AI should handle repetitive structure while humans retain judgment and oversight.

## Proposed solution direction
Build an **explainable routing layer for small support teams** with one thin vertical slice:
1. **Ingest:** represent inbound support emails as seeded inbox messages
2. **Structure:** extract and show ticket fields needed for triage
3. **Classify:** show request type, priority, severity, product area, required expertise, sentiment, language, and confidence
4. **Route:** assign each ticket using a readable deterministic rule
5. **Review:** send non-high-confidence tickets into manager verification or manual triage states
6. **Work Distribution Visibility:** show where work went, why, and how load changed

> **Draft framing note:** “worker-led” is not the product category. At most, it is optional supporting language if mentors confirm it helps instead of confusing.

## Core classification fields
### Request type
- billing issue
- refund request
- technical problem
- account access
- feature request
- complaint
- general inquiry

### Priority
- low
- medium
- high
- urgent

### Severity
- minor issue
- partial functionality broken
- major functionality broken
- system unusable

### Product area
- billing
- authentication
- API
- mobile app
- dashboard
- integrations

### Required expertise
- billing specialist
- technical support
- customer success
- compliance

### Additional signals
- customer sentiment
- language detection
- AI confidence score

## Locked routing formula
> Each ticket goes to the available worker with the best combination of skill match, product expertise, manageable workload, and language compatibility. Historical performance can be used only as a light seeded tie-breaker. The confidence threshold determines whether the assignment is automatic, manager-verified, or manually triaged.

## Human review thresholds
- **confidence > 0.80** → auto-assignment allowed
- **confidence 0.50–0.80** → manager verification required
- **confidence < 0.50** → manual triage

## Why this could matter
- Makes small service teams look more reliable without enterprise tooling
- Reduces manager-heavy triage work without hiding the rule
- Keeps AI in an assistive role rather than a black box
- Gives teams a more legible workflow, which is the only credible opening toward the secondary lens

## What makes it plausibly innovative
- **Draft:** do not claim novelty on AI ticketing, smart routing, or human review
- The defensible wedge is:
  - explainable routing
  - readable “why this ticket / why this worker” logic
  - confidence-based review as a visible workflow state
  - lightweight-team fit for support pods without enterprise tooling
  - inbox-first demo flow rather than abstract ticket simulation
- **Validation Needed:** whether workers actually care about this visibility enough for it to be part of the core pitch

## What makes it plausibly feasible in a hackathon
- Seeded support emails and worker profiles can be controlled for demo clarity
- Routing can be deterministic and testable
- Live AI can be removed without breaking the core proof
- Three screens are enough to tell the story
- No database, auth, live inbox integration, or live LinkedIn auth are required for the first strong demo

## Demoable MVP
### End-to-end demo flow
1. Load seeded customer support emails
2. Show extracted ticket attributes already attached to each message
3. Route tickets with visible reasons
4. Send one mid-confidence case to manager review
5. Send one low-confidence case to manual triage
6. End on Work Distribution Visibility

### Must
- Inbox-derived ticket intake from seeded data
- Classification view
- Deterministic routing engine with readable reasons
- Review states for manager verification and manual triage
- Work Distribution Visibility derived from actual route output

### Should
- Worker profile cards with skills, language, and current load
- One “bad outcome prevented” example
- One plain-language explanation of the routing rule

### Could
- One QA example
- One policy toggle: `prefer_specialist` vs `balance_load`
- One side panel with customer tier / VIP context
- One mocked LinkedIn-source note for worker skill profile

### Cut
- Marketplace
- Live customer integrations
- Full QA suite
- Full cooperative governance
- Payout simulation
- Fancy analytics
- Any fairness score we cannot defend
- Real LinkedIn OAuth
- Live historical-performance model

## Explicit non-goals
- We are **not** building a BPO marketplace
- We are **not** proving legal worker ownership
- We are **not** replacing Zendesk / Freshdesk / Intercom
- We are **not** building payroll, billing, or scheduling
- We are **not** claiming fairness optimization or co-op governance in MVP
- We are **not** building live email parsing or LinkedIn authentication in MVP

## Impact hypothesis
If a small support pod can explain how inbound emails are structured, classified, routed, and reviewed, then the team can trust AI-assisted triage more easily and operate with less opaque decision-making.

## Risks / assumptions / validation needs
### Risks
- Could still look like generic support tooling
- Work Distribution Visibility could still be read as surveillance if the copy is wrong
- The product may matter more to leads than to workers
- LinkedIn skill bootstrap could sound flashy but unnecessary
- Historical-performance signals could look fake if they are not clearly demoted in MVP

### Assumptions
- Customer support remains the sharpest demo wedge
- The best first user is not “MSMEs in general,” but a support pod already using lightweight digital tools
- Judges will respond better to operational clarity than flashy AI theater
- The secondary track should stay subordinate unless real worker value becomes more evidenced

### Validation Needed
- Ask support leads what still stays manual even if they already use a helpdesk
- Ask cold listeners whether the phrase **explainable routing layer** is immediately clear
- Ask mentors whether Screen 3 should stay, be renamed again, or be demoted
- Ask whether LinkedIn-based skill bootstrap sounds useful or distracting
- Ask at what ticket volume manual routing actually becomes painful enough to matter
