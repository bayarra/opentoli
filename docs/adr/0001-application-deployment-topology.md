# ADR-0001: Application and Deployment Topology

- Status: Accepted
- Date: 2026-06-20
- Owners: Project maintainers

## Context

OpenToli needs a public dictionary, editorial administration, authenticated APIs,
PostgreSQL persistence, and background AI preparation. The initial team benefits more
from one deployable application and shared types than from independently operated
services.

## Decision

- Use one Next.js App Router application containing Payload CMS and the public frontend.
- Use Node.js 22, pnpm 10.34.4, Payload 3.85.1, and PostgreSQL 17.
- Use Payload's PostgreSQL adapter and migration tooling.
- Use Docker PostgreSQL for local development.
- Target Vercel for the web application and Neon PostgreSQL for the first hosted
  environment. Keep standard PostgreSQL and Node interfaces so either can be replaced.
- Use Payload's job system for durable AI work; web requests enqueue jobs rather than
  waiting for model calls.
- Use GitHub Actions, Vitest, and Playwright for delivery gates.
- Store secrets only in environment-specific secret stores. Commit examples, never
  operational credentials.

## Consequences

The public UI and CMS can share generated types and deploy together. The repository is
easier to operate during the MVP. Application and admin releases remain coupled, and
serverless execution limits must be considered when M3 background jobs are designed.

## Alternatives Considered

- Separate frontend and CMS deployments: rejected for initial operational overhead.
- MongoDB: rejected because the specification requires PostgreSQL and relational search.
- Synchronous AI generation in API handlers: rejected because timeouts and retries would
  make batch processing unreliable.

## References

- [`../ROADMAP.md`](../ROADMAP.md)
- [`../../specs.md`](../../specs.md)
