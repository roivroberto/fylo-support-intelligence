# 14_TEAM_DECISION_BOARD

## Decision board
| Decision | Current recommendation | Why | Confidence | Owner | Status |
|---|---|---|---|---|---|
| Primary track | **Future of Work** | Strongest fit to the actual problem and hackathon framing | High | Product Lead | Lock now |
| Secondary track use | Keep **Collective Prosperity** as supporting language only | Helps only if subordinate; leading with it makes the story messy | High | Pitch Lead | Lock now |
| First user | Team lead / operator of a **5–20 person outsourced support pod or e-commerce support micro-agency** | Most specific and plausible first segment | High | Product Lead | Lock now |
| Product category phrase | **Explainable routing layer for small support teams** | Narrower and more credible than “worker-led service team OS” | High | Product Lead | Lock now |
| Demo use case | Customer support | Most believable workflow and strongest Philippine services context | High | Product Lead | Lock now |
| MVP flow | Intake → classify → route → human review → Work Distribution Visibility | Cleanest thin slice that proves the concept | High | Product Lead + Tech Lead | Lock now |
| Live AI in demo | Seeded by default; live AI is bonus only | Reliability beats cleverness | High | Tech Lead | Lock now |
| Core routing logic | Deterministic rule with readable reasons | Makes the wedge visible and testable | High | Backend/Data/AI | Lock now |
| Review threshold | Low-confidence tickets go to human review | Critical to the human-judgment story | Medium | Backend/Data/AI | Discuss |
| Screen 3 label | **Work Distribution Visibility** | Better than Contribution Visibility, but still needs language testing | Medium | Design / UX | Discuss |
| Worker-benefit claim | Keep as **Hypothesis**, not a locked promise | Evidence is stronger for lead pain than worker value | High | Pitch Lead | Lock now |
| QA example | One seeded example only, if time permits | Useful garnish, weak core value | Medium | Backend/Data/AI | Park |
| Policy toggle | Only add `prefer_specialist` vs `balance_load` if MVP is already stable | Explains tradeoffs, but easy scope creep | Low | Tech Lead | Park |
| Live integrations | Do not build for MVP | High risk, low judging value | High | Tech Lead | Lock now |
| Auth / database | Do not build for MVP | Pure overhead for this demo | High | Tech Lead | Lock now |
| Ownership / co-op language | Do not lead with it | Too easy to overclaim and confuse judges | High | Pitch Lead | Lock now |
| Backup demo package | Required: local runbook + screenshots + recording | Demo reliability matters as much as code | High | Pitch Lead + Tech Lead | Lock now |

## What the team should challenge
- Is the phrase **“explainable routing layer”** immediately clear, or too abstract?
- Does **Work Distribution Visibility** feel genuinely helpful, or like soft surveillance?
- Are we still overestimating worker-side value because we want the story to sound more noble?
- Is the first user concrete enough that everyone describes the same person?
- Are we accidentally drifting back into “generic AI helpdesk” language?

## What would make judges skeptical
- the product sounds like a thinner Zendesk clone
- the novelty claim depends on AI triage or routing itself
- the worker-benefit claim is asserted without evidence
- Screen 3 looks like employee monitoring
- the demo depends on flaky live AI or broken integrations
- the pitch tries to cover too many tracks at once

## Smallest demo that proves the idea
1. Show a seeded queue of support tickets.
2. Show category, urgency, complexity, and confidence.
3. Route tickets with visible reasons.
4. Flag one low-confidence case into human review.
5. Show how assignments changed team load in the final visibility screen.

That is enough. Anything beyond this is optional.

## Next 3 actions after the meeting
1. **Lock the language:** finalize the 1-sentence concept, banned claims, and Screen 3 label.
2. **Lock the build slice:** freeze seed data shape, routing logic, and the no-network demo path.
3. **Lock owners and deadlines:** assign one person each to product/copy, routing/data, UI, and pitch/backup demo.
