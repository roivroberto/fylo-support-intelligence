# 13_TEAM_DECISION_MEETING

## Meeting goal
Lock the first serious team direction fast enough to start building without pretending the strategy is finished.

## Pre-read instructions
Read these before the meeting:
1. **Required:** [12_TEAM_REVIEW_PACKET](12_TEAM_REVIEW_PACKET.md)
2. **Skim only if needed:** [08_VALIDATION_RESEARCH](../03-research-validation/08_VALIDATION_RESEARCH.md), [09_COMPETITOR_AND_ANALOGS](../03-research-validation/09_COMPETITOR_AND_ANALOGS.md), [11_TECH_RISK_AND_PLAN_B](../04-risks-decisions/11_TECH_RISK_AND_PLAN_B.md)

Come prepared to answer only this:
- What part of the current direction is strongest?
- What part is still weak or misleading?
- What should be cut before build starts?

## 45-minute agenda
### 0:00–0:05 — Reset the room
- restate the goal
- confirm this is a **decision** meeting, not an ideation meeting
- confirm that broadening scope is off-limits

### 0:05–0:12 — Align on the project in one sentence
- read the current 1-sentence concept aloud
- test whether everyone can explain it back simply
- flag any word that sounds vague, fake, or overloaded

### 0:12–0:20 — Lock the user and pain
- confirm the exact first user
- confirm the painful current workaround
- decide whether the worker-benefit claim stays secondary

### 0:20–0:30 — Lock the MVP and cuts
- confirm the 3-screen MVP
- decide what is explicitly out of scope
- decide whether live AI is shown at all
- decide whether live inbox sync or LinkedIn bootstrap is parked

### 0:30–0:38 — Pressure-test the pitch risk
- ask what makes this look like generic helpdesk software
- ask what would make judges skeptical
- decide how strong the track framing should be

### 0:38–0:45 — Record decisions and owners
- lock the decisions
- assign owners
- record what gets parked for later
- define what must be done next

## Facilitator script
### Opening
"We are not here to invent a new project. We are here to decide whether this current direction is sharp enough to build and pitch. If something is weak, we either tighten it or cut it."

### Ground rule
"No one gets to add scope unless they can prove it makes the final demo clearer in under 30 seconds."

### During discussion
Use these prompts:
- "What is the smallest thing that proves the idea?"
- "Would a judge understand this without extra explanation?"
- "Is this real user value or are we projecting?"
- "Does this strengthen the wedge or drag us into generic helpdesk territory?"
- "Does this belong in MVP, or are we emotionally attached to it?"

### If the room starts ideating again
"Park it. We are locking the first serious version, not expanding the roadmap."

### Closing
"We leave this meeting with a locked user, locked MVP, locked cuts, clear owners, and one sentence we can all say the same way."

## Decision questions
Ask and answer these in order:
1. Is the first user locked as a **5–20 person outsourced support pod / e-commerce support micro-agency lead**?
2. Is **Future of Work** the only track we lead with?
3. What exact phrase replaces any vague or overloaded category language?
4. Does Screen 3 stay as **Work Distribution Visibility**, get renamed, or get demoted?
5. Is worker-side value strong enough to say directly, or does it stay a hypothesis?
6. Is the MVP strictly the 3-screen deterministic flow?
7. Is live AI removed from the critical path?
8. Are live inbox sync and LinkedIn bootstrap both out of MVP?
9. Do we lock the confidence thresholds now?
10. What one thing would make judges say, "This is just another helpdesk"?
11. What exact claims are banned from the pitch?
12. Who owns copy lock, seed data quality, routing logic, UI, and backup demo?

## Disagreement resolution rule
Use this order:
1. **Evidence beats opinion.** Prefer validation research and technical risk documents over taste.
2. **Demo clarity beats ambition.** Prefer the option that is easier to explain and ship.
3. **Primary track fit beats cleverness.** Prefer the option that makes Future of Work clearer.
4. **Product lead breaks ties.** If the room stalls, the product lead decides and the team moves.

## Scope lock rule
A feature stays out unless it passes all 3 tests:
1. it strengthens the final demo
2. it supports the main judging story
3. it can be built without threatening the no-network MVP

If any answer is no, it is out.

## What gets parked for later
Park these automatically unless the MVP is already stable:
- live AI classification
- QA scoring beyond one example
- policy toggles
- live integrations
- auth, database, multi-user state
- LinkedIn OAuth / skill extraction
- fairness scoring
- ownership / co-op mechanisms
- branding debates that do not affect comprehension

## Expected outputs by the end of the meeting
- locked 1-sentence concept
- locked first user
- locked MVP scope
- locked non-goals
- locked owner for each critical workstream
- parked list for later

## Suggested owner split for a 5-person team
- **Product Lead / Facilitator:** concept, scope, copy lock
- **Full-Stack Engineer 1:** routing logic, shared types, validation
- **Full-Stack Engineer 2:** UI implementation, seed-mode flow
- **Design / UX Engineer:** screen clarity, copy, review queue UX
- **Pitch & Demo Lead:** narration, skeptic handling, backup demo
