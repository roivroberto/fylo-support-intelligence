# Draft — Role: Frontend / UX / Design

## Mission
Make the demo legible in one pass. Avoid dashboard clutter.

## Core user flow
1. Load seeded support queue
2. Show ticket classification output
3. Route tickets and show why
4. Surface one low-confidence ticket for team lead review
5. End on Contribution Visibility

## Text wireframes for main screens
### Screen 1 — Intake + Classification
**Header:** SharedShift — Worker-led service team OS  
**Subheader:** Turn raw support tickets into structured work.  
**Main area:** table of seeded tickets with:
- subject
- category
- urgency
- customer tier
- confidence
- suggested next step

**Right rail or summary cards:**
- total tickets
- high / critical count
- VIP count
- low-confidence review count

### Screen 2 — Routing + Review
**Header:** Routing decisions  
**Main area:** assignment rows with:
- ticket
- assigned worker
- reason
- status
- review required? yes/no

**Secondary panel:** low-confidence review queue

### Screen 3 — Contribution Visibility
**Header:** Contribution Visibility  
**Supporting copy:** Ownership starts with visibility into how work is assigned and carried.  
**Main area:** worker cards with:
- starting load
- new assignments
- urgent / VIP tickets handled
- visible contribution note
- current load

## UX priorities
- One glance should explain what happened
- Routing reason must be plain language
- Review queue must be clearly human-owned
- Screen 3 must look like team visibility, not performance surveillance

## Key UI copy draft
- **Worker-led service team OS**
- **Classified with AI, reviewed by humans when needed**
- **Best skill match. Manageable workload. Human review when confidence is low.**
- **Contribution Visibility**
- **Ownership cue:** workers can see how work flows through the team

## Demo-first interaction notes
- Preload seeded data on page load
- Use one CTA per screen
- Animate only what improves comprehension
- Keep the live demo path linear

## What can be mocked safely
- Loading states
- AI explanation chips
- QA summary panel
- Historical trend mini-chart

## What should feel real
- Ticket rows
- Routing outcomes
- Review queue
- Worker contribution cards

## What this person must get done before the next checkpoint (4 hours)
1. Build the three-screen layout with placeholder data immediately.
2. Use the final field names from the seed files.
3. Make the routing reason readable without tooltips.
4. Keep Screen 3 sparse and credible.
