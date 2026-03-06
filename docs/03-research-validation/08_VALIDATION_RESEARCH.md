# /08_VALIDATION_RESEARCH.md

## Draft idea being tested
A **worker-led service team OS** for small Filipino customer support teams that ingests tickets, classifies them, routes them with visible logic, adds human review when confidence is low, and ends with a **Contribution Visibility** view. Internal draft files define the target user as a **team lead or operator of a 5–20 person Filipino customer support team** using lightweight tools and manual assignment habits, with a secondary user of the support worker inside the team. The current story is anchored in **Future of Work** with an optional **Collective Prosperity** layer through visibility/ownership language. Source: `/00_README.md`, `/01_IDEA_DRAFT.md`, `/02_ROLE_PRODUCT_LEAD.md`, `/07_OPEN_QUESTIONS_AND_DECISIONS.md`.

This review is **validation research**, not product strategy. It is intentionally skeptical.

## Top claims to validate
1. **The problem is real:** small support teams actually struggle with manual triage, routing, and QA.
2. **The first user is specific enough:** “5–20 person Filipino customer support team” is a usable first segment, not just a broad category.
3. **The workflow pain is urgent enough:** missed priorities, routing opacity, and manager-heavy triage create enough pain to matter.
4. **The proposed value is strong enough:** explainable routing + human review + contribution visibility is more compelling than generic AI support tooling.
5. **The worker angle is credible:** workers care about assignment/contribution visibility, not just managers.
6. **The language helps rather than hurts:** “worker-led” improves the story instead of adding confusion or ideological overhead.

## Evidence found
### 1) Hackathon fit is real
- **Evidence:** Developer Camp explicitly frames **Future of Work** around meaningful, equitable, empowering work in a Philippines context shaped by services, outsourcing, and overseas labor. It also says the best projects can touch multiple tracks and asks builders to get specific about who benefits, who was previously excluded, and how relationships change. (`Exploring The Four Focus Tracks.txt`, lines 15–18, 40–47, 83–89)
- **Evidence:** The hackathon judges projects on **innovation, feasibility, impact potential, and how well the solution addresses real human needs within the chosen focus track**. (`Hackathon Details.pdf`, page 6)
- **Inference:** A support-workflow idea can fit the hackathon well, but only if the team proves it addresses a real operational pain and does not collapse into “AI helpdesk demo.”

### 2) Philippine market relevance is real
- **Evidence:** The Philippine IT-BPM sector grew from **USD 32.5 billion in 2022 to USD 35.5 billion in 2023**, and employment reached **1.7 million in 2023**, with **1.84 million projected in 2024**.[^apo-ai-ph]
- **Evidence:** In 2021, **customer relationship management activities** were the largest IT-BPM employment subclass at **465,248 workers (54.9% of total IT-BPM employment)**.[^apo-ai-ph]
- **Evidence:** The Philippine CC & BP services market is forecast to grow from **1.3 million FTEs in 2022** to **1.9 million baseline FTEs by 2028**, with customer service/technical support explicitly listed among the core service lines.[^ibpap-leap]
- **Inference:** Customer support is not a made-up wedge. It is one of the most defensible Philippine contexts for a Future of Work story.

### 3) Manual routing / triage is a real workflow pattern
- **Evidence:** HubSpot states that when routing is manual, **support reps scan the queue and assign themselves cases**, and positions this as a common pattern for smaller support teams.[^hubspot-routing]
- **Evidence:** HubSpot’s support-ticketing guide explicitly points to the **pitfalls of scattered emails and spreadsheets** and then recommends simple shared-inbox/ticketing tools for small businesses.[^hubspot-ticketing]
- **Evidence:** Intercom describes a support workflow where teams previously **manually collected triage details**, which hurt resolution time; after structured bot-based intake, the team reported **50% faster resolution time** and **39 minutes saved per issue**.[^intercom-custom-bot]
- **Evidence:** Zendesk describes recurring workforce-management pain around **poor visibility into what the team is working on** and **time-consuming spreadsheet-based planning**.[^zendesk-wfm]
- **Inference:** The draft’s “chat threads, spreadsheets, and lead intuition” story is plausible. But the exact current-tool stack in **Philippine 5–20 person support teams** is still indirect; it has not yet been directly validated with users.

### 4) Routing failures create visible customer and operations pain
- **Evidence:** Zendesk reports that **60% of consumers say they are frequently transferred to another agent or department on phone calls**, and uses that as evidence for the need for better call routing.[^zendesk-call-routing]
- **Evidence:** HubSpot’s own AI routing use-case page states that manual triage causes **urgent issues to get buried**, important tickets to be missed, and time to be wasted sorting rather than solving.[^hubspot-ai-routing]
- **Evidence:** Intercom’s recent support-team research says manual processes such as **ticket triage, routing, translations, and repetitive responses** are exactly the kind of work AI systems are already taking over, with humans shifting toward monitoring or fine-tuning outputs and reviewing cases AI cannot resolve.[^intercom-team-evolution]
- **Inference:** There is enough evidence to say the workflow pain is real. What is still unproven is whether **small Filipino teams** experience it strongly enough to adopt a new tool versus continuing with a shared inbox or an existing helpdesk.

### 5) Small-business digital readiness is a real adoption constraint
- **Evidence:** DTI’s baseline survey on MSME digitalization found that among 400 surveyed MSMEs, **23% did not use ICT tools for business**, **51% were only at basic digital usage**, and only **6% used advanced tools** such as ERP, CRM, and analytics. The same study found **73% said they needed capacity building**.[^dti-baseline]
- **Evidence:** DTI’s roadmap says only a minority of MSMEs reach higher digitalization levels and repeatedly emphasizes simplification (“MADALI”) as the right posture for MSME digitalization.[^dti-baseline][^dti-roadmap]
- **Inference:** The idea should **not** target “MSMEs” in general. The first user needs to be a support team already using at least **business email/shared inbox/web forms** and experiencing enough inbound volume for routing to matter.

## Current workaround evidence
- **Evidence:** Small support teams often rely on a combination of **shared email, simple ticketing/shared inbox tools, or spreadsheets** before moving into more advanced automation.[^hubspot-ticketing]
- **Evidence:** Manual routing commonly means someone **scans the queue and decides who gets what**.[^hubspot-routing]
- **Evidence:** Teams often gather missing ticket context **manually before a specialist can act**, which slows resolution.[^intercom-custom-bot]
- **Evidence:** Visibility into who is doing what is commonly handled poorly or manually, often pushing leads toward either micromanagement or guesswork.[^zendesk-wfm]
- **Inference:** The most plausible current workaround for the target segment is not a full enterprise helpdesk. It is likely some combination of:
  - Gmail/Outlook/shared inbox
  - chat threads for escalations
  - Google Sheets or ad hoc dashboards
  - lead judgment for urgent/VIP assignment
  - QA after the fact, not as part of intake/routing
- **Assumption:** Filipino micro-agencies and small support pods behave similarly to the small-team support patterns described in the broader support-software market.

## Pain severity signals
- **Evidence:** Customer support / CRM is already the biggest employment subclass in Philippine IT-BPM, so even small efficiency or trust improvements matter in a large labor market.[^apo-ai-ph]
- **Evidence:** Routing and triage failures have visible service consequences: frequent transfers, buried priority tickets, and slower resolution.[^zendesk-call-routing][^hubspot-ai-routing]
- **Evidence:** Structured intake can produce measurable gains; Intercom’s example is not Philippines-specific, but it is concrete and operational, not theoretical.[^intercom-custom-bot]
- **Evidence:** AI is already reorganizing support work toward **automation + human review**, which matches the draft’s intended flow.[^intercom-team-evolution]
- **Inference:** The pain looks real for **team leads / operators**.
- **Assumption:** The pain is equally meaningful for **workers** because they want assignment logic and contribution visibility.
- **Weak point:** Current evidence is much stronger for **manager pain** than for **worker pain**.

## User segment ranking
| Rank | Segment | Why this looks plausible first | What makes it risky |
|---|---|---|---|
| 1 | **Team lead of a 5–20 person outsourced support pod / e-commerce support micro-agency** | Strong Philippines fit with services/outsourcing; likely enough ticket volume to make routing matter; more likely than large BPOs to rely on lightweight/manual ops. | May already inherit the client’s tooling; switching cost may still be high. |
| 2 | **Team lead of a small internal support team at a growing PH e-commerce or service MSME** | Strong fit with DTI digital-readiness evidence: likely business email/shared inbox, not necessarily mature helpdesk ops; easy to explain in a demo. | “MSME” is broad; many firms may be too low-volume or too low-tech for routing pain to be acute. |
| 3 | **Support operations lead in a PH startup / SaaS team** | Workflow is obvious; demo is clean; shared inbox → ticket routing is believable. | Philippines relevance is weaker unless you can anchor it to local startup/service reality. |
| 4 | **Worker-led service collective / cooperative support team** | Strong story for Collective Prosperity and hackathon philosophy. | Almost no evidence yet that this is the right first segment or that it exists in a form ready to buy/use this MVP. |

### Most plausible first segment
**Best current bet:** a **team lead / operator of a 5–20 person outsourced support pod or e-commerce support micro-agency** that already uses business email/shared inbox workflows and still assigns tickets manually.

Why this wins over the broader MSME framing:
- it preserves the Philippine services/BPO relevance;
- it keeps the workflow pain believable;
- it avoids the “generic MSME digitization” trap;
- it is more likely to have enough ticket flow for routing logic to matter.

## What seems true
- **Evidence:** Customer support is a valid Philippine wedge, not a random demo use case.[^apo-ai-ph][^ibpap-leap]
- **Evidence:** Manual triage/routing exists in smaller support teams.[^hubspot-routing][^intercom-custom-bot]
- **Evidence:** Priority handling, routing, and visibility are recognized operational problems.[^zendesk-call-routing][^zendesk-wfm][^hubspot-ai-routing]
- **Inference:** The draft’s **intake → classify → route → human review** flow is directionally aligned with real support-work evolution.[^intercom-team-evolution]
- **Inference:** The strongest value in the current draft is **operational clarity + human oversight**, not “AI magic.”
- **Evidence:** The hackathon itself rewards practical, human-need-centered projects over flashy demos. (`Hackathon Details.pdf`, page 6; `Exploring The Four Focus Tracks.txt`, lines 7–8, 83–89)

## What seems shaky
- **“Worker-led” as a lead label is weakly supported.** There is track-level inspiration for shared-benefit models, but no direct evidence here that support-team buyers describe their pain this way or that the phrase improves comprehension. This is still mostly a narrative choice, not a validated user term. (`/01_IDEA_DRAFT.md`, `/07_OPEN_QUESTIONS_AND_DECISIONS.md`; `Exploring The Four Focus Tracks.txt`, lines 40–47, 445–457)
- **“Contribution Visibility” is only partly validated.** There is strong evidence that managers need visibility; there is not yet strong evidence that workers specifically want contribution dashboards rather than fearing surveillance.[^zendesk-wfm]
- **The user segment is still too broad.** “Micro-agency, startup support desk, subcontracting pod, or service collective” is not one user. Those segments have different buyers, existing tools, and definitions of success. (`/01_IDEA_DRAFT.md`)
- **Novelty is easy to overclaim.** AI classification, routing, and human review are already established support-software patterns. The idea cannot credibly claim uniqueness on routing automation alone.[^hubspot-ai-routing][^hubspot-ticketing][^intercom-team-evolution]
- **The threshold problem is unresolved.** There is no evidence yet for the minimum ticket volume / team size where routing legibility becomes painful enough to matter.

## What has no evidence yet
- Direct interviews with **Filipino support team leads** in the proposed first segment.
- Direct interviews with **support workers** about whether assignment logic/contribution visibility feels useful or punitive.
- Evidence that “worker-led” is a phrase users understand or like.
- Evidence that **contribution visibility** changes trust, morale, retention, or fairness perceptions.
- Evidence that a **5–20 person** band is the right band; that number is currently a design choice, not a validated threshold.
- Evidence that likely first users are **not already satisfied** with existing shared inbox/helpdesk solutions.

## Fast user validation questions
Use these during the hackathon. Keep them short and operational.

1. **Walk me through the last time 10+ tickets came in quickly. Who decided what went where?**
2. **What tools are you actually using today: Gmail/Outlook, shared inbox, Slack/Discord, Sheets, Zendesk, Freshdesk, HubSpot, something else?**
3. **At what ticket volume does manual assignment start to break down?**
4. **How do urgent/VIP cases get noticed right now? What gets missed?**
5. **When a ticket gets assigned, can the assignee usually tell why it went to them? Does that matter?**
6. **What part of triage is still manual even if you already use a helpdesk?**
7. **If a tool showed “who handled what” and “why this ticket was routed here,” would your team find that useful or creepy? Why?**
8. **If the tool made one decision you would definitely want to override, what would it be?**
9. **What would make you trust routing suggestions: skill tags, workload, priority, prior history, or something else?**
10. **When you hear “worker-led service team OS,” what do you think it means?**
11. **What would make you reject this immediately?**
12. **Would you rather see this as a new dashboard, or as something inside tools you already use?**

## Recommended edits to /01_IDEA_DRAFT.md
- Narrow the primary user from a broad category to one concrete first segment, e.g. **“team lead of a 5–20 person outsourced support pod / e-commerce support micro-agency already using business email/shared inbox workflows.”**
- Change **“worker-led”** from a default lead phrase to a **validation-dependent label**. Treat it as a hypothesis, not a locked framing.
- Reword the problem statement so the **manager/ops pain** is clearly primary and the **worker visibility benefit** is clearly secondary/hypothesis-level.
- Add one explicit sentence acknowledging that **AI routing itself is not novel**; the current wedge is **explainability + human review + lightweight-team fit**.
- Add one explicit constraint that the first user likely has **basic/intermediate digital maturity**, not zero-tool adoption.
- Add one explicit validation gap: **worker benefit is not yet evidenced; only team-lead pain is currently well supported.**
- Remove or soften any line that implies contribution visibility is already known to be empowering.

## Recommended edits to /02_ROLE_PRODUCT_LEAD.md
- Replace the current primary persona with a more specific operator profile:
  - current tools;
  - approximate ticket volume;
  - whether the team serves one client or several;
  - whether routing decisions currently live in the lead’s head.
- Add a validation question to the persona: **“What manual step still exists even if they already use a helpdesk?”**
- Add a success metric about **term comprehension**, e.g. “Cold listener understands the product without needing the phrase ‘worker-led’ explained.”
- Add a risk metric around surveillance perception, e.g. “Contribution Visibility is interpreted as team operations visibility, not scorekeeping.”
- Add one rejection test: **if users say Screen 3 feels more useful to managers than workers, stop pretending the worker benefit is validated.**
- Add one explicit check on **team size / ticket threshold** so the product lead does not assume 5–20 is automatically correct.

## Recommended edits to /07_OPEN_QUESTIONS_AND_DECISIONS.md
- Move **exact first user segment** into the top set of open questions. It is not resolved yet.
- Add a new open product question: **What minimum ticket volume / urgency mix makes routing pain acute enough to matter?**
- Add a new open product question: **If a team already uses Zendesk/Freshdesk/HubSpot/shared inbox tooling, what remains manual and painful?**
- Add a new open product question: **Does Screen 3 primarily help the worker, the lead, or both?**
- Add a new mentor question: **Does this still feel differentiated once you assume routing automation already exists in the market?**
- Add a new mentor question: **What language sounds clearer than “worker-led” without losing the human-empowerment angle?**
- Tighten kill criteria:
  - if the team cannot identify one concrete first user segment, narrow;
  - if worker-side value stays unvalidated, drop the stronger Collective Prosperity claim from the core story;
  - if the demo depends on pretending routing automation is novel, reposition the wedge.

## Sources
### Internal files
- `/00_README.md`
- `/01_IDEA_DRAFT.md`
- `/02_ROLE_PRODUCT_LEAD.md`
- `/07_OPEN_QUESTIONS_AND_DECISIONS.md`
- `Exploring The Four Focus Tracks.txt`
- `Hackathon Details.pdf`

### External sources
- [IBPAP, *IT-BPM LEAP: The Philippine IT-BPM Industry Roadmap 2028*](https://admin.ibpap.org/storage/hub-resources/1fntWJGQKvZg4CfwP4yfXs0Jr1n85DVR1vYXJvSn.pdf)
- [Asian Productivity Organization / UA&P, *AI in the Philippine IT-BPM Sector* (2025)](https://www.apo-tokyo.org/wp-content/uploads/2025/04/AI-in-the-Philippine-Information-Technology-and-Business-Process-Management-Sector_PUB.pdf)
- [DTI, *e-Commerce Philippines 2022 Roadmap*](https://ecommerce.dti.gov.ph/madali/images/eCommerce_Philippines_Roadmap_2022.pdf)
- [DTI, *Baseline Survey on Digitalization of MSME*](https://ecommerce.dti.gov.ph/madali/baseline_survey.html)
- [HubSpot, *How to Automate Ticket Routing for a Speedy Helpdesk*](https://blog.hubspot.com/service/ticket-routing)
- [HubSpot, *21 Support Ticketing Tools Your Service Team Will Love You For*](https://blog.hubspot.com/service/support-ticketing)
- [HubSpot, *Review and Route Tickets*](https://www.hubspot.com/products/artificial-intelligence/use-cases/review-and-route-tickets)
- [Intercom, *How a chatbot sped up our tech support resolution time by 50%*](https://www.intercom.com/blog/custom-bots-for-support/)
- [Intercom, *New research: Customer service team evolution*](https://www.intercom.com/blog/new-research-customer-service-team-evolution/)
- [Zendesk, *10 WFM pain points*](https://www.zendesk.com/blog/wfm-pain-points/)
- [Zendesk, *Call center management: Definition, best practices, and KPIs*](https://www.zendesk.com/blog/call-center-management/)

[^apo-ai-ph]: APO/UA&P, *AI in the Philippine IT-BPM Sector* (2025), pp. 34–35 and 37–38.
[^ibpap-leap]: IBPAP, *IT-BPM LEAP: The Philippine IT-BPM Industry Roadmap 2028*, p. 31.
[^hubspot-routing]: HubSpot, *How to Automate Ticket Routing for a Speedy Helpdesk*.
[^hubspot-ticketing]: HubSpot, *21 Support Ticketing Tools Your Service Team Will Love You For*.
[^intercom-custom-bot]: Intercom, *How a chatbot sped up our tech support resolution time by 50%*.
[^zendesk-wfm]: Zendesk, *10 WFM pain points*.
[^zendesk-call-routing]: Zendesk, *Call center management: Definition, best practices, and KPIs*.
[^hubspot-ai-routing]: HubSpot, *Review and Route Tickets*.
[^intercom-team-evolution]: Intercom, *New research: Customer service team evolution*.
[^dti-baseline]: DTI, *Baseline Survey on Digitalization of MSME*.
[^dti-roadmap]: DTI, *e-Commerce Philippines 2022 Roadmap*, pp. 48–50.
