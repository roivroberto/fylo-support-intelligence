# Fylo

### An AI-driven ticket management and routing system built for high-performance support teams.

[![Language](https://img.shields.io/github/languages/top/roivroberto/fylo-support-intelligence)](https://github.com/roivroberto/fylo-support-intelligence)
[![Repo size](https://img.shields.io/github/repo-size/roivroberto/fylo-support-intelligence)](https://github.com/roivroberto/fylo-support-intelligence)
[![Last commit](https://img.shields.io/github/last-commit/roivroberto/fylo-support-intelligence)](https://github.com/roivroberto/fylo-support-intelligence)
[![Stars](https://img.shields.io/github/stars/roivroberto/fylo-support-intelligence?style=social)](https://github.com/roivroberto/fylo-support-intelligence)
[![Forks](https://img.shields.io/github/forks/roivroberto/fylo-support-intelligence?style=social)](https://github.com/roivroberto/fylo-support-intelligence)
[![License](https://img.shields.io/github/license/roivroberto/fylo-support-intelligence)](https://github.com/roivroberto/fylo-support-intelligence)

## Demo

![Demo](assets/demo.png)

## About

Fylo is a modern, full-stack support operations platform that leverages artificial intelligence to streamline ticket ingestion, classification, and resolution. Built with a focus on speed and scalability, it automates the heavy lifting of triage so support teams can focus on high-impact customer interactions.

This project showcases a robust monorepo architecture, integrating real-time backend functions with a highly responsive frontend, all powered by a cutting-edge AI stack.

## Tech Stack

- **Frontend:** Next.js (App Router), React 19, Tailwind CSS v4, Framer Motion, Shadcn UI
- **Backend:** Convex (Real-time database & serverless functions)
- **Authentication:** Better Auth
- **AI/ML:** Google Gemini (Classification, Draft Generation, Resume Parsing)
- **Infrastructure:** Turborepo, Bun
- **Communication:** Resend (Email Infrastructure)
- **Testing:** Vitest, Playwright (E2E)

## Features

- **🚀 AI-Powered Triage:** Automatically classifies and routes incoming tickets based on sentiment, priority, and intent.
- **✍️ Intelligent Drafts:** Generates context-aware reply drafts using Gemini to accelerate response times.
- **📄 Resume Parsing:** Extracts key agent skills and experience from resumes to optimize team assignments.
- **⏱️ Real-time Queue:** A live-updating ticket dashboard that reflects routing state and workload distribution instantly.
- **🛡️ Multi-tier Workflow:** Structured review and visibility layers for managers to ensure quality and balance across the team.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) `1.3.9`
- [Node.js](https://nodejs.org/) `22+`
- A [Convex](https://www.convex.dev/) account

### Installation & Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment variables:**
   See [Detailed Setup](#detailed-setup) for the required `.env.local` configurations.

3. **Initialize Convex and database:**
   ```bash
   bun run dev:setup
   ```

### Running Locally

To start the full development environment:
```bash
bun run dev
```
The app will be available at `http://localhost:3001`.

---

<details>
<summary><b>Detailed Setup & Technical Documentation</b></summary>

## Detailed Setup

### 1. Root/shared env (`.env.local`)

Create `.env.local` in the repository root:

```bash
BETTER_AUTH_SECRET=<generate-a-long-random-secret>
BETTER_AUTH_URL=http://localhost:3001
SITE_URL=http://localhost:3001
```

### 2. Web env (`apps/web/.env.local`)

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://<your-deployment>.convex.site
```

### 3. Backend env (Convex deployment)

After running `bun run dev:setup`, set these on your Convex deployment:

```bash
bunx convex env set SITE_URL http://localhost:3001
bunx convex env set BETTER_AUTH_URL http://localhost:3001
bunx convex env set BETTER_AUTH_SECRET <generate-a-long-random-secret>
bunx convex env set AI_PROVIDER_API_KEY <your-google-ai-api-key>
```

## Tests and Verification

### Unit Tests
```bash
bun run test
```

### E2E Tests (Playwright)
```bash
bunx playwright install --with-deps chromium
bunx playwright test
```

## Project Structure

```text
.
├── apps/
│   └── web/                # Next.js app
├── packages/
│   ├── backend/            # Convex functions, schema, auth integration
│   ├── config/             # Shared TS configs
│   └── env/                # Web env validation
├── .env.example            # Env variable checklist
└── docs/                   # Extended documentation
```

</details>

## License

This project is licensed under the MIT License.
