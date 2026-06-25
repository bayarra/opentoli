# OpenToli Next Task Map

This is the short handoff for the next AI agent. The product behavior still lives in
[`../specs.md`](../specs.md), delivery gates in [`ROADMAP.md`](ROADMAP.md), and current
evidence in [`STATUS.md`](STATUS.md).

## Current Baseline

- M0-M4 are complete.
- M5 is active: calibration manifest exists, first-five jobs were queued, and job 131 for
  `application` completed as private draft 189.
- Normal Editor work now starts in `/workspace`.
- Stable `/api/v1` read contracts now exist for public dictionary/draft data and Editor Workspace summaries.
- Editors can open safe Agent Job detail pages and queue eligible failed/retry-scheduled jobs for retry without running the worker from the browser.
- Editors can open/close public feedback and add/edit/remove draft sources from `/workspace/drafts/[id]`.
- Public AI drafts remain unverified and redacted.
- Contributors can comment or suggest translations only after sign-in.
- Contributors can track their own comments, translation suggestions, moderation status, and outcomes at `/contributions`.
- No AI output may publish without an explicit Editor `Publish` action.

## API, Web, and Admin Separation

- **`/api/v1`** should become the stable product API for web and future mobile clients.
- **Web pages** should provide user experience and may reuse server helpers, but important
  read/write contracts should move behind stable APIs when they are mobile-relevant.
- **Payload admin** should remain for rare maintenance only: users, raw collection repair,
  migrations, destructive deletes, settings, and emergency inspection.
- **Never expose raw Payload records directly** as the mobile/public contract. Return
  OpenToli-shaped responses that enforce redaction, role checks, and safe public projections.
- **Mutations must keep business logic in server helpers** such as `src/editor/drafts.ts`,
  `src/editor/feedback.ts`, and `src/editor/sources.ts`.

## API Layer Status

Completed read contracts:

- Public reads:
   - `GET /api/v1/search`
   - `GET /api/v1/terms/[slug]`
   - `GET /api/v1/categories`
   - `GET /api/v1/categories/[slug]`
   - `GET /api/v1/drafts`
   - `GET /api/v1/drafts/[id]`
- Editor reads:
   - `GET /api/v1/editor/workspace`
   - `GET /api/v1/editor/drafts`
   - `GET /api/v1/editor/drafts/[id]`
   - `GET /api/v1/editor/feedback`
   - `GET /api/v1/editor/jobs`
   - `GET /api/v1/editor/calibration`
- Contract tests cover public response shape, public AI draft redaction, and Editor auth denial.

Remaining API tasks:

1. Keep existing mutation endpoints for now, then normalize names under `/api/v1` only after
   the read contracts settle.
2. Add logged-in Editor success coverage for `/api/v1/editor/*` over HTTP/browser context before
   mobile work begins.
3. Add pagination/filter contracts when M7 search and discovery work starts.

## Remaining Admin-To-Web Moves

- Agent Jobs: safe job detail and retry-now are done. Remaining work is richer filtering,
  batch grouping, and any future operational diagnostics that still avoid raw provider output.
- Calibration: record human outcomes, edit-rate notes, cost/latency evidence, and go/no-go
  decision inside `/workspace/calibration`.
- Sources: basic draft source add/edit/remove is done. Remaining work is richer source notes,
  duplicate detection, and source proposal moderation.
- Public draft visibility: done for active, non-blocked, safely sourced drafts.
- Published terms: add web editing for term wording, examples, alternatives, and sources.
- Contributions: basic own-comments/suggestions dashboard is done. Remaining work is richer submissions, votes, ownership controls, saved terms, and profile history when M8 starts.
- Moderation: expand from comment moderation to contributor proposals, examples, and source notes.
- Imports: add web preparation review for CSV/manual batches, but keep provider execution controlled.

## Remaining Milestones

- **M5 Calibration Batch:** process one queued job at a time, review first five drafts, record
  quality/cost/latency, finish all 50 outcomes, and write the go/no-go decision.
- **M6 Public Dictionary:** improve canonical term/category pages, review badges, metadata,
  revision summaries, responsive polish, and public trust separation from AI drafts.
- **M7 Search and Discovery:** ranked bilingual search, filters, pagination, indexes, and safe
  inclusion of public AI drafts below canonical terms.
- **M8 Community Accounts:** contributor dashboard, submissions, votes, ownership controls, and
  expanded moderation. Community input remains advisory.
- **M9 Launch Readiness:** backups/restore, export, monitoring, security review, performance,
  accessibility, SEO, and launch corpus gates.

## Suggested Next Sequence

1. Review draft 189 for `application` and decide whether blocked/high-risk routing is acceptable.
2. Expand `/workspace/calibration` to track human outcomes, job evidence, edit notes, and go/no-go evidence.
3. Process the remaining queued first-five M5 jobs one at a time only after draft 189 is inspected.
4. Add logged-in Editor success coverage for `/api/v1/editor/*` before mobile work begins.
5. Add published-term web editing for wording, examples, alternatives, and sources.

## Guardrails

- Public draft APIs must use the ADR-0003 redacted projection.
- Authenticated suggestions and comments never mutate canonical content directly.
- Worker/provider execution should stay controlled; avoid browser buttons that can accidentally
  spend money or run batches without an explicit policy.
- Keep tests proportional: API contract tests for new endpoints, browser tests for new web flows,
  integration tests for permissions and publication boundaries.
