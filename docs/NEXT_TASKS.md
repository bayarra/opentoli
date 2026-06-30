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
- Editors can open/close public feedback and manage optional background references from `/workspace/drafts/[id]`.
- Editors can edit published wording, translations, examples, categories, contexts, and optional references from `/workspace/terms`.
- Editors can record M5 calibration outcomes, edit level, language/domain assessments, go/no-go hints, and safe job evidence at `/workspace/calibration`.
- Public AI drafts remain unverified and redacted.
- Contributors can comment or suggest translations only after sign-in.
- Contributors can track their own comments, translation suggestions, moderation status, and outcomes at `/contributions`.
- Contributors can propose bilingual examples and references on public drafts or published terms; Editors moderate them in `/workspace/feedback`.
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
  `src/editor/feedback.ts`, and `src/editor/references.ts`.

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
- Calibration: outcome recording, aggregate quality/cost metrics, first-five completion, and a
  generated go/no-go rollup are done inside `/workspace/calibration`. Remaining work is the
  actual human review of all 50 terms and the written final decision.
- References: optional draft reference management and contributor reference proposals are done.
  Add duplicate detection only when real editorial use requires it.
- Public draft visibility: done for active drafts explicitly opened by an Editor; references
  and internal AI routes do not gate visibility.
- Published terms: core web editing is done. Add revision comparison or specialized context management only when editorial use demonstrates a need.
- Contributions: own-proposal tracking plus translation, example, and reference proposals are done. Remaining work is term submissions, votes, ownership controls, saved terms, and profile history when M8 starts.
- Moderation: comments, translations, bilingual examples, and reference proposals share one web queue. Future proposal types should reuse this boundary.
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

1. Review draft 189 for `application` and record its human outcome in `/workspace/calibration`.
2. Record whether the internal route was useful calibration evidence; it does not control publication.
3. Process the remaining queued first-five M5 jobs one at a time only after draft 189 is inspected.
4. Add logged-in Editor success coverage for `/api/v1/editor/*` before mobile work begins.
5. Use `/workspace/terms` for canonical edits; keep Payload Admin for rare repair and destructive maintenance.

## Guardrails

- Public draft APIs must use the ADR-0003 redacted projection.
- Authenticated suggestions and comments never mutate canonical content directly.
- Worker/provider execution should stay controlled; avoid browser buttons that can accidentally
  spend money or run batches without an explicit policy.
- Keep tests proportional: API contract tests for new endpoints, browser tests for new web flows,
  integration tests for permissions and publication boundaries.
