# 14_TEAM_DECISION_BOARD

## Decision board
| Decision | Current recommendation | Why | Confidence | Owner | Status |
|---|---|---|---|---|---|
| Primary track | **Future of Work** | Strongest fit to the actual problem and hackathon framing | High | Product Lead | Lock now |
| Secondary track use | Keep **Collective Prosperity** as supporting language only | Helps only if subordinate; leading with it makes the story messy | High | Pitch Lead | Lock now |
| First user | Team lead / operator of a **5–20 person outsourced support pod or e-commerce support micro-agency** | Most specific and plausible first segment | High | Product Lead | Lock now |
| Product category phrase | **Explainable routing layer for small support teams** | Narrower and more credible than “worker-led service team OS” | High | Product Lead | Lock now |
| Demo use case | Support emails entering a shared inbox | More believable than abstract ticket generation and matches the new workflow | High | Product Lead | Lock now |
| MVP flow | Inbox → classify → route → human review → Work Distribution Visibility | Cleanest thin slice that proves the concept | High | Product Lead + Tech Lead | Lock now |
| Core classification schema | Request type + priority + severity + product area + required expertise + sentiment + language + confidence | Makes the routing story legible and concrete | High | Backend/Data/AI | Lock now |
| Core routing logic | Deterministic rule with readable reasons | Makes the wedge visible and testable | High | Backend/Data/AI | Lock now |
| Review thresholds | `> 0.80` auto-assign, `0.50–0.80` manager verification, `< 0.50` manual triage | Clean, understandable human-review story | High | Backend/Data/AI | Lock now |
| Routing factors | Skill match + product expertise + workload + language compatibility | Enough sophistication without fake complexity | High | Tech Lead | Lock now |
| Historical performance | Seeded tie-breaker only, if time permits | Credible only as a light secondary signal | Medium | Backend/Data/AI | Discuss |
| Screen 3 label | **Work Distribution Visibility** | Safer than Contribution Visibility in the spoken demo | Medium | Design / UX | Discuss |
| Worker-benefit claim | Keep as **Hypothesis**, not a locked promise | Evidence is stronger for lead pain than worker value | High | Pitch Lead | Lock now |
| LinkedIn bootstrap | Park from MVP and pitch unless asked | High demo risk, low proof value | High | Product Lead + Tech Lead | Lock now |
| Live inbox integration | Do not build for MVP | High risk, low judging value | High | Tech Lead | Lock now |
| Auth / database | Do not build for MVP | Pure overhead for this demo | High | Tech Lead | Lock now |
| Ownership / co-op language | Do not lead with it | Too easy to overclaim and confuse judges | High | Pitch Lead | Lock now |
| Backup demo package | Required: local runbook + screenshots + recording | Demo reliability matters as much as code | High | Pitch Lead + Tech Lead | Lock now |

## What the team should challenge
- Is the phrase **“explainable routing layer”** immediately clear, or too abstract?
- Does **Work Distribution Visibility** feel genuinely helpful, or like soft surveillance?
- Are we still overestimating worker-side value because we want the story to sound more noble?
- Is the first user concrete enough that everyone describes the same person?
- Are we accidentally drifting back into “generic AI helpdesk” language?
- Is historical performance adding real clarity, or just decorative complexity?

## What would make judges skeptical
- the product sounds like a thinner Zendesk clone
- the novelty claim depends on AI triage or routing itself
- the worker-benefit claim is asserted without evidence
- Screen 3 looks like employee monitoring
- the demo depends on flaky live AI or broken integrations
- the pitch tries to cover too many tracks at once
- the team wastes time on LinkedIn auth or live inbox sync

## Smallest demo that proves the idea
1. Show a seeded support inbox.
2. Show request type, priority, severity, product area, language, and confidence.
3. Route tickets with visible reasons.
4. Flag one medium-confidence case into manager verification.
5. Flag one low-confidence case into manual triage.
6. Show how assignments changed team load in the final visibility screen.

That is enough. Anything beyond this is optional.

## Next 3 actions after the meeting
1. **Lock the language:** finalize the 1-sentence concept, banned claims, and Screen 3 label.
2. **Lock the build slice:** freeze seed data shape, routing logic, thresholds, and the no-network demo path.
3. **Lock owners and deadlines:** assign one person each to product/copy, routing/data, UI, and pitch/backup demo.
