# Draft — Role: Product Lead / Team Lead

> **Major edits in this pass**
> - Narrowed the primary persona to one concrete buyer/operator.
> - Reframed worker value as a **Hypothesis**, not a locked truth.
> - Added term-comprehension, surveillance-risk, and threshold-validation checks.
> - Cut anything that does not strengthen the 3-screen demo.

## Mission
Protect scope. Keep the story sharp. Kill anything that does not improve the 3-screen demo or the first-sentence pitch.

## User persona draft
### Primary persona
**Name:** Mark, 29  
**Role:** Team lead for an 8-person outsourced support pod serving one e-commerce client  
**Context:** Uses Gmail/Outlook, a shared inbox, Slack/Discord, and Google Sheets. Ticket routing mostly lives in his head. The team gets enough daily volume that urgent and VIP cases can be missed if he gets distracted.  
**Pain:** Wants faster, cleaner triage without black-box automation and without jumping to enterprise tooling.

### Secondary persona
**Name:** Jessa, 24  
**Role:** Support specialist  
**Context:** Handles refunds, shipping issues, and account escalations. Often gets tickets without understanding why they were assigned to her.  
**Pain:** Wants clearer routing logic and less random escalation.  
**Validation Needed:** whether she actually wants a visibility screen or would find it creepy.

## Jobs to be done
- When many tickets arrive, help me quickly understand what they are and who should take them.
- When something is urgent or VIP, help me avoid missing it.
- When the system is unsure, let a human step in visibly.
- When the shift ends, help me see how work was distributed without turning the product into employee scorekeeping.

## Top 3 pains
1. Manual triage is noisy and inconsistent.
2. Assignment logic is opaque and hard to explain.
3. High-priority issues can be missed or handled by the wrong person.

## Feature prioritization
### Must
- Seeded ticket intake
- Ticket classification result
- Routing logic with visible reason
- Team lead review state for low-confidence tickets
- Work Distribution Visibility dashboard

### Should
- Worker cards with skills and load
- One “bad outcome prevented” example
- Plain-language routing explainer

### Could
- One QA example
- One copy test for alternate Screen 3 labels
- One policy toggle if it helps explain tradeoffs

### Cut
- Any fairness score
- Any payout model
- Any governance workflow
- Any live inbox integration
- Any auth complexity beyond demo needs
- Any claim that worker ownership is already solved

## Success metrics
- A cold observer can explain the product in one sentence after seeing the demo
- A cold observer understands the phrase **explainable routing layer for small support teams** without extra explanation
- Routing reasons are readable in under 5 seconds
- Work Distribution Visibility feels like operations clarity, not surveillance
- Team can demo the full flow in under 90 seconds
- A new viewer can explain why 5 tickets were assigned the way they were in under 30 seconds

## Validation plan
### Fast checks before next checkpoint
- Show the 1-sentence pitch to 2 people and ask: “What do you think this does?”
- Show the routing screen and ask: “Can you tell why this ticket went there?”
- Show Screen 3 and ask: “Does this help the whole team, or mostly the lead?”
- Ask one support operator: “What manual step still exists even if you already use a helpdesk?”
- Ask one user: “At what ticket volume does manual routing start to break down?”

### Validation Needed
- Whether **worker-led** should be dropped from spoken pitch language
- Whether Work Distribution Visibility is better than Assignment Visibility or Routing Visibility
- Whether customer support leads actually care about routing legibility enough to switch behavior
- Whether the first segment should stay “outsourced pod / micro-agency” instead of “internal SME team”

## Decision log template
```md
### Decision
- Date:
- Decision:
- Why:
- What we cut:
- Owner:
- Revisit when:
```

## What this person must get done before the next checkpoint (4 hours)
1. Lock the exact 1-sentence pitch and 30-second explanation.
2. Approve the seeded dataset structure and demo story.
3. Freeze the must-have screens and cut everything else.
4. Prepare 5–7 plain-language labels the whole team will reuse consistently.
5. Write one rejection rule: if Screen 3 feels more useful to managers than workers, stop overclaiming worker benefit in the main pitch.
