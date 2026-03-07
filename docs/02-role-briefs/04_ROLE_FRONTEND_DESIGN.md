# Draft — Role: Frontend / UX / Design

> **Major edits in this pass**
> - Updated the flow to start from a **shared support inbox**.
> - Added the richer ticket-classification schema to Screen 1.
> - Added explicit **threshold states** to Screen 2.
> - Kept Screen 3 focused on coordination visibility, not employee scoring.

## Mission
Make the demo legible in one pass. Avoid dashboard clutter. The user should understand inbox → ticket → route → review → visibility without needing a tour.

## Core user flow
1. Load seeded support inbox
2. Show extracted ticket classification output
3. Route tickets and show why
4. Surface one manager-verification case and one manual-triage case
5. End on Work Distribution Visibility

## Text wireframes for main screens
### Screen 1 — Inbox + Classification
**Header:** SharedShift — Explainable routing for small support teams  
**Subheader:** Turn raw support emails into structured work.  
**Main area:** table of seeded inbox messages with:
- sender / customer
- subject
- request type
- priority
- severity
- product area
- required expertise
- language
- confidence

**Right rail or summary cards:**
- total emails
- urgent count
- manual-triage count
- manager-verification count

### Screen 2 — Routing + Review
**Header:** Routing decisions  
**Main area:** assignment rows with:
- ticket
- assigned worker
- reason
- matched expertise
- language fit
- status
- threshold state

**Secondary panel:**
- manager verification queue
- manual triage queue

### Screen 3 — Work Distribution Visibility
**Header:** Work Distribution Visibility  
**Supporting copy:** See how work moved across the team after routing and review.  
**Main area:** worker cards with:
- starting load
- new assignments
- urgent tickets assigned
- expertise areas used
- current load
- plain-language work distribution note

## UX priorities
- One glance should explain what happened
- Routing reason must be plain language
- Review states must be clearly human-owned
- Screen 3 must look like team visibility, not performance surveillance

## Key UI copy draft
- **Explainable routing for small support teams**
- **Raw support emails, structured for faster triage**
- **Best expertise match. Manageable workload. Human review when confidence is not high enough.**
- **Manager verification required**
- **Manual triage required**
- **Work Distribution Visibility**

## Demo-first interaction notes
- Preload seeded data on page load
- Use one CTA per screen
- Animate only what improves comprehension
- Keep the live demo path linear
- Make confidence thresholds visible without needing a tooltip

## What can be mocked safely
- Loading states
- AI explanation chips
- QA summary panel
- Historical trend mini-chart
- LinkedIn source badge on worker cards

## What should feel real
- Inbox message rows
- Classification chips
- Routing outcomes
- Review queues
- Worker visibility cards

## What this person must get done before the next checkpoint (4 hours)
1. Build the three-screen layout with placeholder data immediately.
2. Use the final field names from the seed files.
3. Make the routing reason readable without tooltips.
4. Keep Screen 3 sparse and credible.
5. Make the threshold states visually obvious and non-scary.
