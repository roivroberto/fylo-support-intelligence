# Draft — Open Questions and Decisions

> **Major edits in this pass**
> - Locked the project harder to **Future of Work**.
> - Demoted **Collective Prosperity** to a supporting lens only.
> - Re-opened the headline language and Screen 3 label.
> - Added validation gaps, kill criteria, and “decide now” items based on research.

## Locked decisions
- **Stage:** refinement
- **Checkpoint:** next 4 hours
- **Primary track:** Future of Work
- **Secondary track:** Collective Prosperity (**supporting lens only; do not lead with it**)
- **Demo use case:** customer support
- **Core category:** explainable routing layer for small support teams
- **First user:** team lead / operator of a 5–20 person outsourced support pod or e-commerce support micro-agency
- **MVP flow is:**
  1. intake
  2. classify
  3. route
  4. human review if needed
  5. work distribution visibility
- No marketplace
- No full cooperative governance
- No fairness score unless clearly justified
- No live integrations on the critical path
- No database on the critical path

## Open product questions
- Is **explainable routing layer** the clearest lead phrase, or should it become **visibility-first support ops layer**?
- Does **Work Distribution Visibility** feel useful to workers or mostly useful to leads?
- What minimum ticket volume / urgency mix makes manual routing painful enough to matter?
- If a team already uses Zendesk / Freshdesk / HubSpot / a shared inbox, what still stays manual and painful?
- Should the review step stay inline in the routing table or open as a separate review queue screen?

## Open technical questions
- Will classification be fully seeded in the first stable demo, with live AI only as bonus?
- Should routing run entirely client-side for the demo?
- Do we need any API boundary at all before the demo is stable? Probably not.
- What is the exact shared object shape for ticket row, routing decision, and worker card?

## Open team/process questions
- Who owns seed data quality?
- Who approves final demo copy?
- What is the scope-lock rule when someone wants to add a “cool” feature?
- Who owns the backup demo package: screenshots + recording + local runbook?

## Mentor questions to ask
1. **Nana Luz / Softype:** Does this feel like real Future of Work for small support teams, or still generic support tooling?
2. **Bestsign team:** What is the minimum explanation users need to trust classification + routing + review?
3. **YGG Pilipinas / Mon Villareal:** If we keep a worker-benefit claim, what exact outcome sounds credible?
4. **Groupmuse / Kyle Schmolze:** Are we overstating “worker-led” or ownership if MVP only shows legible routing and visibility?

## Sponsor / judge / partner relevance
- **Bestsign:** best model for AI as structure + oversight, not black-box automation (sources: [10_MENTOR_SPONSOR_MAP](../03-research-validation/10_MENTOR_SPONSOR_MAP.md), [09_COMPETITOR_AND_ANALOGS](../03-research-validation/09_COMPETITOR_AND_ANALOGS.md)).
- **Softype / Nana Luz:** best for pressure-testing whether the product upgrades work or just automates triage (sources: [10_MENTOR_SPONSOR_MAP](../03-research-validation/10_MENTOR_SPONSOR_MAP.md), [08_VALIDATION_RESEARCH](../03-research-validation/08_VALIDATION_RESEARCH.md)).
- **YGG Pilipinas:** useful if you keep any worker-upside language around access, growth, or inclusion (sources: [10_MENTOR_SPONSOR_MAP](../03-research-validation/10_MENTOR_SPONSOR_MAP.md), [08_VALIDATION_RESEARCH](../03-research-validation/08_VALIDATION_RESEARCH.md)).
- **Groupmuse:** useful only if you keep ownership language and need help not overclaiming it (source: [10_MENTOR_SPONSOR_MAP](../03-research-validation/10_MENTOR_SPONSOR_MAP.md)).

## What must be decided now vs later
### Decide now
- final 1-sentence pitch
- exact Screen 3 label
- whether QA is MVP or backup-only
- whether live classification is shown at all
- who owns seed data quality

### Decide later
- stronger branding
- live model integration
- any broader ownership mechanism
- any post-hackathon roadmap

## Kill criteria
Pivot or narrow further if:
- the 3-screen flow cannot be demoed cleanly
- the routing reasons are too complicated to explain quickly
- the first user segment stays fuzzy
- Screen 3 feels bolted on or surveillance-heavy
- the main story depends on pretending AI routing is novel
- “worker-led” confuses more people than it helps
- the secondary track starts making the pitch feel ideological or messy
