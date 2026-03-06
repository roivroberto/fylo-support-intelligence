# 12_TEAM_REVIEW_PACKET

## Project summary
**Draft:** SharedShift is an **explainable routing layer for small support teams**. It takes a seeded support queue, shows classification attributes, routes tickets using readable rules, sends low-confidence cases to human review, and ends with a **Work Distribution Visibility** view. The point is **not** to claim new AI ticketing. The point is to prove that a small support pod can triage faster and more legibly when AI clears repetitive structure but humans keep judgment.

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
- urgent and VIP handling partly lives in the lead’s head
- not on a heavy enterprise support stack

**Secondary user — Hypothesis:** support worker in the same team who wants clearer assignment logic and less random escalation.

**Validation Needed:** whether worker-side value is real enough to say strongly in the pitch.

## Painful current workaround
Today’s likely workflow:
- tickets arrive through email, chat, or forms
- a lead scans the queue and decides who gets what
- urgent or VIP cases depend on memory and attention
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
1. load seeded support tickets and worker profiles
2. show category, urgency, complexity, and confidence
3. route tickets with a deterministic rule and readable reasons
4. send low-confidence tickets to a review queue
5. show **Work Distribution Visibility** derived from actual routing output

### Must-have MVP
- seeded intake
- classification view
- deterministic routing with readable reasons
- review queue for low-confidence cases
- Work Distribution Visibility based on actual outputs

### Nice-to-have, not MVP
- one QA example
- one policy toggle: `prefer_specialist` vs `balance_load`
- one plain-language explainer panel
- one VIP context side panel

## Explicit non-goals
- not a new Zendesk / Freshdesk / Intercom replacement
- not a full helpdesk suite
- not a BPO marketplace
- not payroll, billing, or scheduling
- not worker ownership or co-op governance in MVP
- not fairness scoring we cannot defend
- not live integrations, auth, or database on the critical path

## Why this is not just generic helpdesk software
Because the wedge is narrower and more specific:
- **Explainable routing:** every assignment has a visible reason
- **Readable “why not” logic:** the team can understand why one worker got the ticket instead of another
- **Human review as a first-class state:** low-confidence cases visibly stop for review
- **Small-team fit:** designed for lightweight support pods, not enterprise admin-heavy workflows

**Assumption:** this legibility matters enough to users to be part of the core pitch.

**Validation Needed:** if users do not care about routing legibility, the idea collapses toward generic support tooling.

## Biggest risks
1. **Category collapse:** judges may see “AI helpdesk demo” instead of a sharp wedge.
2. **Worker claim risk:** current evidence is stronger for team-lead pain than worker benefit.
3. **Screen 3 risk:** Work Distribution Visibility could read as surveillance if the copy is wrong.
4. **Segment risk:** the first user is better defined now, but still needs live validation.
5. **Demo risk:** live AI, APIs, or deployment could break the story for no gain.

## What must be true for this to be worth building
1. **The first user is real and specific enough** that a judge can picture the buyer in under 10 seconds.
2. **Manual routing is still painful** even when lightweight tools already exist.
3. **Readable routing reasons actually matter** for trust, not just for demo theatrics.
4. **Work Distribution Visibility helps coordination** and does not feel like employee scoring.
5. **The team can demo the full flow cleanly** without relying on live AI or integrations.

If these are not true, narrow further or reposition the story.

## 5 decisions the team must make now
### 1) Headline phrase
**Current recommendation:** use **“explainable routing layer for small support teams.”**

**Open Question:** is “AI-assisted routing and review layer” clearer for judges?

### 2) Screen 3 label
**Current recommendation:** keep **Work Distribution Visibility**.

**Open Question:** does this still sound too managerial or surveillance-heavy?

### 3) Live AI in the demo
**Current recommendation:** **No** on the critical path. Use seeded classification by default.

### 4) Worker-benefit claim strength
**Current recommendation:** keep worker value as a **Hypothesis**, not a locked promise.

### 5) Scope lock for MVP
**Current recommendation:** lock the 3-screen flow only.

Anything beyond that is **Nice-to-have, not MVP**.

## Discussion stance for the team
The current strongest direction is:
- one primary track: **Future of Work**
- one concrete user: **small support pod team lead**
- one wedge: **explainable routing + review + visibility**
- one proof: **thin, deterministic, no-network demo**

Anything that weakens that should be challenged or cut.
