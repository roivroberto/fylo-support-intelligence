# Fylo

An explainable routing and review layer for small support teams.

![Fylo ticket queue showing routed and review-needed support requests](assets/demo-cropped.png)

Fylo turns inbound support email into structured tickets, classifies each request, routes it against team skills and workload, and sends uncertain cases to human review. The product is designed around a simple premise: automation is more useful when the people operating it can see why a decision was made and change the policy behind it.

The project was developed as a collaborative Developer Camp hackathon build in the Future of Work track.

## Product workflow

1. An inbound email is validated and stored as a support ticket.
2. Gemini extracts classification fields such as intent, urgency, and sentiment.
3. The routing engine scores eligible teammates using skills, workload, and workspace policy.
4. High-confidence assignments enter the live queue; uncertain cases move to review.
5. An agent can inspect the ticket, add notes, generate or revise a reply draft, and send an approved response.
6. Leads can review workload distribution and adjust routing thresholds.

## Implemented system

- live ticket, review, and workload views backed by Convex;
- email and password authentication with protected routes;
- inbound Resend webhook validation, idempotent ingestion, and failure records;
- Gemini-backed classification, draft generation, and resume parsing;
- deterministic fallback metadata when an AI provider is unavailable;
- skill- and workload-aware routing with readable assignment reasons;
- ticket notes, lead review actions, and approved outbound replies;
- role-aware policy settings and workspace membership support;
- unit, integration, and Playwright coverage for the core workflow.

## Architecture

```text
Inbound email
    -> Resend webhook
    -> Convex ingestion and validation
    -> Gemini classification
    -> routing policy and candidate scoring
    -> live queue or human review
    -> ticket workspace
    -> approved reply
```

The repository is a Bun and Turborepo monorepo:

```text
apps/web/           Next.js application and Playwright flows
packages/backend/   Convex schema, functions, integrations, and tests
packages/config/    shared TypeScript configuration
packages/env/       environment validation
docs/               product decisions, research, plans, and verification notes
```

The web application uses Next.js, React, Tailwind CSS, shadcn/ui, Framer Motion, Better Auth, and Convex. The backend integrates Google Gemini and Resend.

## Run locally

### Requirements

- Bun `1.3.9`
- Node.js `22` or newer
- a Convex project
- optional Google AI and Resend credentials for provider-backed flows

Install dependencies and initialize Convex:

```bash
bun install
bun run dev:setup
```

Create the environment files described in [`.env.example`](.env.example), then start the workspace:

```bash
bun run dev
```

The web app runs at `http://localhost:3001` by default.

## Verification

```bash
bun run check-types
bun run test
bun run build
bunx playwright install chromium
bunx playwright test
```

The latest recorded verification and known gaps are maintained in [`docs/current-codebase-checklist.md`](docs/current-codebase-checklist.md). The workspace and membership backend does not yet have a complete administration interface, and live provider-to-app inbound email verification remains an opt-in environment check.

## Team

Fylo was co-built by [Roi Victor Roberto](https://github.com/roivroberto), [Vincent Ferrer](https://github.com/vinnyy-ph), and [Miguel Kalaw](https://github.com/Miguel2604).

## License

Licensed under the [MIT License](LICENSE).
