# Operational Core Pilot Design

## Context
The existing repository has strong product docs and realistic seed data, but the app itself is mostly scaffold-level. The goal is to move beyond a bare MVP into a pilot-ready product with real auth, real persistence, live email flow, and operationally safe AI assistance.

## Confirmed scope decisions
- Product maturity: pilot-ready (not demo-only)
- Auth + identity: Better Auth (Convex integration)
- Database + app backend: Convex
- Inbound email: Resend receives customer emails and forwards to the app
- Outbound email: sent from the app after human approval
- AI mode: live AI with strict validation and deterministic fallback
- Roles: lead + human support agent
- Tenant model: single workspace for v1
- Inbox model: one shared support inbox for v1
- Workflow depth: routing plus human agent workspace
- Policy control: basic routing policy settings
- Visibility model: team-visible, framed for coordination (not ranking)

## Architecture
1. Better Auth handles identity and session management through the Convex Better Auth integration.
2. Next.js App Router renders role-aware UI and calls Convex queries/mutations/actions.
3. Convex owns domain state (tickets, messages, routing decisions, policies, team visibility aggregates).
4. Resend inbound webhook sends incoming customer email payloads to a Convex HTTP route.
5. Inbound processing stores message + ticket records, runs classification, and triggers routing workflow.
6. Human agents work tickets in-app, generate/edit AI drafts, and send approved replies through Resend.

## Domain model (v1)
- `workspaces`: single v1 workspace record, inbox metadata, status
- `memberships`: workspace role (`lead` or `agent`) linked to Better Auth user id
- `tickets`: normalized support ticket state, classification fields, routing/review state, assignment
- `messages`: inbound and outbound email messages linked to tickets
- `routing_decisions`: explainable reason trail and scoring snapshot for each routing event
- `routing_policies`: thresholds, escalation owner, load-balancing preference
- `ticket_notes`: internal collaboration notes
- `draft_replies`: AI-generated summary/action/reply drafts with human edits
- `activity_log`: auditable event stream for ticket lifecycle and policy changes
- `ingest_failures`: dead-letter records for malformed or failed inbound events

## Workflow design
### Inbound flow
1. Resend forwards inbound message payload to Convex webhook route.
2. Signature + payload checks run before writes.
3. Idempotency check prevents duplicate processing.
4. Message is persisted, ticket created/updated, then classification action runs.
5. Classification output is schema-validated; fallback path marks `classification_source = "fallback"` and queues lead review.
6. Routing function computes deterministic assignment or review state and stores explanation.

### Human workspace flow
1. Agent sees shared queue with reasons and confidence.
2. Agent opens ticket detail, reviews message thread, edits status/notes.
3. Agent requests AI summary + draft reply (optional assistive action).
4. Agent edits and approves draft.
5. System sends outbound message via Resend and appends outbound message record.

### Lead workflow
1. Lead sees review queue for uncertain cases.
2. Lead can approve suggested assignment or reassign.
3. Lead updates routing policy thresholds and escalation owner.
4. Lead views team visibility metrics that focus on workload clarity, not ranking.

## Error handling and fallback strategy
- Inbound signature failure: reject and log structured error
- Inbound parse/schema failure: write dead-letter row with payload digest and reason
- AI classification failure: deterministic fallback labels + manager review state
- Routing tie/ambiguity: deterministic tie-break order and explicit `why_not_top_alternative`
- Outbound send failure: mark reply as `send_failed`, keep retry metadata, surface banner in UI
- Convex function errors: return typed app errors with stable error codes for UI handling

## Security and data safety
- Every query/mutation/action validates workspace membership + role
- Role boundaries: lead-only actions for policy changes and review overrides
- Webhook signature verification and replay protection
- Minimal PII storage and explicit field whitelisting from inbound payload
- Audit events for assignment changes, policy updates, and outbound sends

## Testing strategy
- Unit tests for classification parsing, routing engine, policy threshold logic, and authz guards
- Integration tests for inbound webhook ingestion and outbound send workflow
- Component tests for queue and ticket workspace states
- End-to-end smoke flow: inbound ticket appears, route decision visible, human-approved reply sent
- Type + build checks required before merge

## Delivery sequence
1. Harden Better Auth + Convex auth wiring across app and API routes
2. Define Convex schema and authz helpers
3. Implement inbound webhook + ingestion reliability
4. Add AI classification with strict schema and fallback
5. Add deterministic routing and review workflow
6. Build queue + ticket workspace + reply workflow
7. Add policy settings + visibility dashboard
8. Harden with retries, dead-letter handling, audit logs, and e2e checks

## Success criteria for pilot readiness
- Real inbound and outbound email loop works with one shared inbox
- Lead and agent can sign in and operate role-specific workflows
- Routing behavior is explainable, stable, and adjustable through basic settings
- AI assistive features improve speed but never remove human approval controls
- Operational failures are visible and recoverable without data loss
