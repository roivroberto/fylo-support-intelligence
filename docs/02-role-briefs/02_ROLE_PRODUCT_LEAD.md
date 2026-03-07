# Draft — Role: Product Lead / Team Lead

> **Major edits in this pass**
> - Updated the primary workflow around a **shared support inbox**.
> - Added the new classification schema and confidence-threshold logic.
> - Kept LinkedIn skill bootstrap and historical-performance signals as **validation-dependent**, not locked MVP value.
> - Kept Screen 3 framed as team coordination, not employee scoring.

## Mission
Protect scope. Keep the story sharp. Kill anything that does not improve the 3-screen demo or the first-sentence pitch.

## User persona draft
### Primary persona
**Name:** Mark, 29  
**Role:** Team lead for an 8-person outsourced support pod serving one e-commerce client  
**Context:** Uses Gmail/Outlook, a shared inbox, Slack/Discord, and Google Sheets. Support requests arrive by email. Ticket routing mostly lives in his head. The team gets enough daily volume that urgent and specialist-heavy cases can be missed if he gets distracted.  
**Pain:** Wants faster, cleaner triage without black-box automation and without jumping to enterprise tooling.

### Secondary persona
**Name:** Jessa, 24  
**Role:** Support specialist  
**Context:** Handles refunds, billing issues, and account escalations. Often gets tickets without understanding why they were assigned to her.  
**Pain:** Wants clearer routing logic and less random escalation.  
**Validation Needed:** whether she actually wants a visibility screen or would find it creepy.

## Jobs to be done
- When many support emails arrive, help me quickly understand what they are and who should take them.
- When something is urgent, severe, or language-sensitive, help me avoid missing it.
- When the system is unsure, let a human step in visibly.
- When the shift ends, help me see how work was distributed without turning the product into employee scorekeeping.

## Top 3 pains
1. Manual inbox triage is noisy and inconsistent.
2. Assignment logic is opaque and hard to explain.
3. High-priority or specialist-needed issues can be missed or handled by the wrong person.

## Feature prioritization
### Must
- Seeded inbox-derived ticket intake
- Ticket classification result with fixed schema
- Routing logic with visible reason
- Review states for manager verification and manual triage
- Work Distribution Visibility dashboard

### Should
- Worker cards with skills, language, and load
- One “bad outcome prevented” example
- Plain-language routing explainer

### Could
- One QA example
- One copy test for alternate Screen 3 labels
- One mocked LinkedIn-sourced skill profile card

### Cut
- Any fairness score
- Any payout model
- Any governance workflow
- Any live inbox integration
- Any LinkedIn OAuth complexity
- Any claim that worker ownership is already solved

## Success metrics
- A cold observer can explain the product in one sentence after seeing the demo
- A cold observer understands the phrase **explainable routing layer for small support teams** without extra explanation
- Routing reasons are readable in under 5 seconds
- The confidence threshold logic is understandable immediately
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
- Ask one user: “Would LinkedIn-based skill bootstrap sound useful here, or overkill?”

### Validation Needed
- Whether **worker-led** should stay out of spoken pitch language
- Whether Work Distribution Visibility is better than Assignment Visibility or Routing Visibility
- Whether customer support leads actually care about routing legibility enough to switch behavior
- Whether the first segment should stay “outsourced pod / micro-agency” instead of “internal SME team”
- Whether historical-performance routing sounds credible or too speculative in MVP

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
2. Approve the seeded inbox dataset structure and demo story.
3. Freeze the must-have screens and cut everything else.
4. Prepare 5–7 plain-language labels the whole team will reuse consistently.
5. Write one rejection rule: if Screen 3 feels more useful to managers than workers, stop overclaiming worker benefit in the main pitch.
6. Keep LinkedIn bootstrap and historical-performance claims out of the MVP unless a mentor strongly validates them.
