# OpenToli

OpenToli is an AI-first, human-reviewed English-to-Mongolian terminology platform.
AI prepares sourced research and translation candidates; authorized people make every
publication decision.

## Project Status

Read [`docs/STATUS.md`](docs/STATUS.md) for current progress and
[`docs/ROADMAP.md`](docs/ROADMAP.md) for milestone gates. AI agents should begin with
[`AGENTS.md`](AGENTS.md).

## Stack

- Next.js App Router
- TypeScript
- Payload CMS
- PostgreSQL
- pnpm
- Vitest and Playwright

Exact runtime and package decisions are recorded in
[`docs/adr/0001-application-deployment-topology.md`](docs/adr/0001-application-deployment-topology.md).

## Local Development

Requirements:

- Node.js 22.13 or newer within major version 22
- pnpm 10.34.4 through Corepack
- PostgreSQL 17, locally or through Docker

Setup:

```powershell
corepack enable
corepack prepare pnpm@10.34.4 --activate
Copy-Item .env.example .env
docker compose up -d postgres
pnpm install
pnpm generate:types
pnpm payload migrate
pnpm seed
pnpm dev
```

After dependencies are installed, the equivalent npm commands are:

```powershell
npm run generate:types
npm run payload -- migrate
npm run seed
npm run dev
```

Open `http://localhost:3000` for the public application and
`http://localhost:3000/admin` for Payload. The first account is promoted to `admin` by
a server-side collection hook.

Do not reuse the local database password or Payload secret in another environment.
Automatic development schema push is disabled. Apply committed migrations before starting
the application; create a new migration whenever collection fields change.

## Quality Commands

```powershell
pnpm typecheck
pnpm lint
pnpm test:int
pnpm test:e2e
pnpm build
```

## AI Preparation

Configure the provider in `.env`. The current OpenAI configuration uses the Responses API
with strict structured outputs and makes separate research, generation, and critique calls:

```powershell
npm run ai:prepare:authentication
npm run ai:work
```

The first command idempotently prepares the seeded `authentication` term. The second
processes one ready job and exits. Generated records remain private `needs_review` AI
Drafts and cannot publish Terms. API keys are server-only and must never use a
`NEXT_PUBLIC_` environment variable.

## Public Draft Feedback

Moderators can open a sourced, non-blocked `needs_review` AI Draft by setting its
`publicVisibility` to `public` in Payload. Its redacted page is then available at
`/drafts/{id}` with an `Unverified AI Draft` warning and `noindex` metadata. Raw research,
critique, job, provider, prompt, and private review data are never included in that page.

Anyone can read an explicitly public draft. Contributors register at `/register` or sign
in at `/login` before submitting feedback. New comments and translation suggestions are
always `pending`; moderators approve or reject them in the Payload `Comments` collection.
Feedback never changes an AI Draft, Term, or Translation directly.

To exercise the pipeline without paid API calls in the current PowerShell session:

```powershell
$env:AI_PROVIDER = 'deterministic'
npm run ai:prepare:authentication
Remove-Item Env:AI_PROVIDER
```

## Repository Map

```text
src/app/(frontend)  Public Next.js application
src/app/(payload)   Payload admin and API routes
src/collections     Editorial collections
src/access          Reusable access-control policies
src/utilities       Shared domain utilities
docs/adr            Architecture Decision Records
tests               Integration and browser tests
```

## Product Rules

- Public queries may return published Terms and explicitly public, redacted AI draft projections; never raw or private drafts.
- AI output must retain source, model, prompt, and schema provenance.
- AI output cannot transition itself to published status.
- Community votes are advisory and cannot select the recommended translation.
