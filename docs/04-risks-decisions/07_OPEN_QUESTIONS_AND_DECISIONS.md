# Draft — Open Questions and Decisions

> **Major edits in this pass**
> - Locked the workflow harder around **support inbox → classify → route → review → visibility**.
> - Added the new classification schema and threshold logic.
> - Re-opened whether LinkedIn skill bootstrap belongs anywhere near MVP.
> - Kept live integrations and live auth out of the critical path.

## Locked decisions
- **Stage:** refinement
- **Checkpoint:** next 4 hours
- **Primary track:** Future of Work
- **Secondary track:** Collective Prosperity (**supporting lens only; do not lead with it**)
- **Demo use case:** customer support from a shared inbox / support email
- **Core category:** explainable routing layer for small support teams
- **First user:** team lead / operator of a 5–20 person outsourced support pod or e-commerce support micro-agency
- **MVP flow is:**
  1. inbox-derived intake
  2. classify
  3. route
  4. human review if needed
  5. work distribution visibility
- **Core classification fields:** request type, priority, severity, product area, required expertise, sentiment, language, confidence
- **Routing factors:** skill match, product expertise, current workload, language compatibility, optional seeded historical performance as tie-breaker only
- **Review thresholds:**
  - `> 0.80` auto-assign allowed
  - `0.50–0.80` manager verification
  - `< 0.50` manual triage
- No marketplace
- No full cooperative governance
- No fairness score unless clearly justified
- No live inbox integrations on the critical path
- No database on the critical path
- No real LinkedIn OAuth on the critical path

## Open product questions
- Is **explainable routing layer** still the clearest lead phrase, or should it become **AI-assisted routing and review layer**?
- Does **Work Distribution Visibility** feel useful to workers or mostly useful to leads?
- Does the support-email-first entry point make the product clearer, or too narrow?
- Should LinkedIn skill bootstrap appear anywhere in the product story, or stay strictly post-MVP?
- Does historical performance improve the demo story, or just add fake-looking complexity?

## Open technical questions
- Will classification be fully seeded in the first stable demo, with live AI only as bonus?
- Should routing run entirely client-side for the demo?
- Do we need any API boundary at all before the demo is stable? Probably not.
- What is the exact shared object shape for inbox row, ticket row, routing decision, and worker card?
- Should historical performance exist only as a seed field and not as visible UI?

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
5. **Any operator mentor:** Does LinkedIn-based skill bootstrap sound useful here, or just like unnecessary startup garnish?

## What must be decided now vs later
### Decide now
- final 1-sentence pitch
- exact Screen 3 label
- whether QA is MVP or backup-only
- whether live classification is shown at all
- who owns seed data quality
- whether LinkedIn bootstrap is completely parked from MVP

### Decide later
- stronger branding
- live model integration
- any broader ownership mechanism
- live inbox sync
- LinkedIn auth / profile parsing
- any post-hackathon roadmap

## Kill criteria
Pivot or narrow further if:
- the 3-screen flow cannot be demoed cleanly
- the routing reasons are too complicated to explain quickly
- the first user segment stays fuzzy
- Screen 3 feels bolted on or surveillance-heavy
- the main story depends on pretending AI routing is novel
- “worker-led” confuses more people than it helps
- LinkedIn bootstrap becomes more expensive than useful
- the secondary track starts making the pitch feel ideological or messy
