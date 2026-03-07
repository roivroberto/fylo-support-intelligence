# 12_TEAM_REVIEW_PACKET

## Project summary
**Draft:** SharedShift is an **explainable routing layer for small support teams**. It starts from a seeded support inbox, turns emails into structured tickets, shows classification attributes, routes tickets using readable rules, sends non-high-confidence cases to review, and ends with a **Work Distribution Visibility** view. The point is **not** to claim new AI ticketing. The point is to prove that a small support pod can triage faster and more legibly when repetitive ticket-structuring work is cleared without removing human judgment.

## Primary track and why
**Primary track: Future of Work**

Why this is the strongest fit:
- The project is about how AI changes real service work, not just back-office automation.
- The user lives in a Philippine-relevant services / outsourcing context.
- The strongest value is **more legible, judgment-preserving work**, which fits the track better than a generic productivity story.

**Supporting lens only, not primary:** Collective Prosperity.

**Rule:** do not lead with ownership, co-op, or worker-led language unless a mentor explicitly says it helps.

## Exact target user
**Draft:** Team lead or operator of a **5–20 person outsourced support pod or e-commerce support micro-agency**.

Traits:
- already uses business email, shared inboxes, chat, or web forms
- still assigns at least some tickets manually
- urgent and specialist-heavy handling partly lives in the lead’s head
- not on a heavy enterprise support stack

**Secondary user — Hypothesis:** support worker in the same team who wants clearer assignment logic and less random escalation.

**Validation Needed:** whether worker-side value is real enough to say strongly in the pitch.

## Painful current workaround
Today’s likely workflow:
- support emails arrive in a shared inbox
- a lead scans the queue and mentally extracts what each ticket is
- urgent or severe cases depend on memory and attention
- the lead decides who gets what based on skill, habit, and guesswork
- escalations happen in chat threads
- visibility is handled through sheets, ad hoc notes, or guesswork
- QA usually happens after mistakes, not during triage

Why this hurts:
- triage is inconsistent
- assignment logic is hard to explain
- important tickets can get buried
- operations depend too much on one lead’s attention

## Sharp MVP definition
**Smallest demo that proves the idea:**
1. load seeded support emails and worker profiles
2. show request type, priority, severity, product area, required expertise, language, and confidence
3. route tickets with a deterministic rule and readable reasons
4. send medium-confidence tickets to manager verification
5. send low-confidence tickets to manual triage
6. show **Work Distribution Visibility** derived from actual routing output

### Must-have MVP
- seeded inbox intake
- classification view
- deterministic routing with readable reasons
- review states for medium / low confidence cases
- Work Distribution Visibility based on actual outputs

### Nice-to-have, not MVP
- one QA example
- one policy toggle: `prefer_specialist` vs `balance_load`
- one plain-language explainer panel
- one mocked LinkedIn skill-profile note

## Explicit non-goals
- not a new Zendesk / Freshdesk / Intercom replacement
- not a full helpdesk suite
- not a BPO marketplace
- not payroll, billing, or scheduling
- not worker ownership or co-op governance in MVP
- not fairness scoring we cannot defend
- not live inbox integration, auth, database, or LinkedIn OAuth on the critical path

## Why this is not just generic helpdesk software
Because the wedge is narrower and more specific:
- **Explainable routing:** every assignment has a visible reason
- **Readable “why not” logic:** the team can understand why one worker got the ticket instead of another
- **Human review as a first-class state:** medium-confidence and low-confidence cases visibly stop for review
- **Small-team fit:** designed for lightweight support pods, not enterprise admin-heavy workflows
- **Inbox-first clarity:** the product starts where these teams already work

**Assumption:** this legibility matters enough to users to be part of the core pitch.

**Validation Needed:** if users do not care about routing legibility, the idea collapses toward generic support tooling.

## Biggest risks
1. **Category collapse:** judges may see “AI helpdesk demo” instead of a sharp wedge.
2. **Worker claim risk:** current evidence is stronger for team-lead pain than worker benefit.
3. **Screen 3 risk:** Work Distribution Visibility could read as surveillance if the copy is wrong.
4. **Integration creep:** live inbox sync or LinkedIn skill bootstrap could waste time and sink reliability.
5. **Demo risk:** live AI, APIs, or deployment could break the story for no gain.

## What must be true for this to be worth building
1. **The first user is real and specific enough** that a judge can picture the buyer in under 10 seconds.
2. **Manual inbox routing is still painful** even when lightweight tools already exist.
3. **Readable routing reasons actually matter** for trust, not just for demo theatrics.
4. **Work Distribution Visibility helps coordination** and does not feel like employee scoring.
5. **The team can demo the full flow cleanly** without relying on live AI or integrations.

If these are not true, narrow further or reposition the story.

## 5 decisions the team must make now
### 1) Headline phrase
**Current recommendation:** use **“explainable routing layer for small support teams.”**

**Open Question:** is “AI-assisted routing and review layer” clearer for judges?

### 2) Review threshold logic
**Current recommendation:** keep the 3-state confidence rule.
- `> 0.80` auto-assignment allowed
- `0.50–0.80` manager verification
- `< 0.50` manual triage

### 3) Screen 3 label
**Current recommendation:** keep **Work Distribution Visibility**.

**Open Question:** does this still sound too managerial or surveillance-heavy?

### 4) Live integrations in the demo
**Current recommendation:** **No** on the critical path. Use seeded inbox messages and seeded worker profiles by default.

### 5) Scope lock for MVP
**Current recommendation:** lock the 3-screen flow only.

Anything beyond that is **Nice-to-have, not MVP**.

## Discussion stance for the team
The current strongest direction is:
- one primary track: **Future of Work**
- one concrete user: **small support pod team lead**
- one wedge: **explainable routing + visible review + visibility**
- one proof: **thin, deterministic, no-network demo**

Anything that weakens that should be challenged or cut.
