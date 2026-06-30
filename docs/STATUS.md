# OpenToli Project Status

**Last updated:** 2026-06-29
**Current milestone:** M5 - Calibration Batch
**Milestone status:** `IN_PROGRESS`
**Delivery state:** First five M5 terms completed, explicitly accepted, and have calibration outcomes; current prompt continues to the next controlled batch

## Executive Summary

OpenToli now has a buildable Next.js and Payload application plus its first complete
database-backed terminology slice. Terms, translations, references, examples, reviews, and
import batches are modeled. The published `authentication` reference term is searchable
in English and Mongolian, appears in its category, and has a responsive detail page.
Publication guards, clean migrations, seeding, integration tests, and browser checks pass.
M3 has private AI Draft and Generation Job persistence, versioned structured-output
contracts, provider-neutral staged execution, idempotent enqueueing, retry resumption,
risk routing, retained provenance, deterministic end-to-end evidence, and a completed live
OpenAI reference run for `authentication`. M4 now has an explicit safe public projection, registration,
authenticated pending feedback, moderation, and a deliberately simple Editor experience:
one Workspace menu, one Draft Inbox, four editable fields, optional references, background save, one
Publish action, and secondary Hide. Audit and AI provenance remain automatic in the
background, while unsafe reference URLs are omitted from public projections. Keyboard-only
critical flows and serious WCAG A/AA violations now have automated browser coverage. Stable
`/api/v1` read contracts now expose public search, terms, categories, public AI drafts, and
Editor Workspace summaries without leaking raw Payload records or private AI evidence. Editors
can inspect safe Agent Job detail and queue eligible failed/retry-scheduled jobs for retry
without exposing raw provider output or running the worker from the browser. The controlled
50-term Technology and Software calibration batch is fixed in a tracked manifest. The first five
jobs completed and their drafts were explicitly accepted by an Editor without recorded field
changes. Their calibration outcomes preserve those facts while language and domain assessments
remain `not_checked`; internal routes remain provenance and do not control Editor actions.
Editors can now open or close public draft feedback and optionally
manage background references from OpenToli web instead of Payload admin. Signed-in
contributors can now track their own comments, translation suggestions, moderation status, and
outcomes from an OpenToli web dashboard. Editors can record M5 human calibration outcomes,
edit-level notes, language/domain assessments, go/no-go hints, and safe job evidence from
`/workspace/calibration`. Editors can also update published canonical terms, translations,
examples, contexts, and optional references from `/workspace/terms` without Payload Admin.
Contributors can submit structured bilingual examples and reference suggestions alongside
comments and translation suggestions; Editors moderate all of them in one web queue.
Calibration reporting now derives first-five completion, quality rates, disagreement, token,
latency, cost, and decision-readiness evidence without automating the final M5 decision.
Editors can prepare manual or CSV imports, review each parsed row, resolve duplicates, and
explicitly queue accepted terms from `/workspace/imports` without executing the AI provider.
Agent Jobs can be searched and filtered by status or import batch, with paginated results
grouped by batch in both Workspace and the stable Editor API.

## Milestone Status

| ID  | Milestone                                    | Status        | Evidence                                                                  |
| --- | -------------------------------------------- | ------------- | ------------------------------------------------------------------------- |
| M0  | Product and architecture baseline            | `DONE`        | ADR-0001 and ADR-0002 record the accepted baseline                        |
| M1  | Application foundation                       | `DONE`        | Clean migration, seed, tests, build, HTTP, and browser evidence recorded  |
| M2  | Editorial data core                          | `DONE`        | Attributed reviewer/moderator workflow and public vertical slice verified |
| M3  | AI preparation pipeline                      | `DONE`        | Live OpenAI job 33 completed; draft 22 retained; idempotency verified     |
| M4  | Public draft feedback and simple editor flow | `DONE`        | All exit criteria pass with 27 integration and 15 browser tests           |
| M5  | Calibration batch                            | `IN_PROGRESS` | First five jobs and human outcomes complete; next controlled batch pending |
| M6  | Public dictionary                            | `PLANNED`     | Required pages are documented                                             |
| M7  | Search and discovery                         | `PLANNED`     | Ranking and filters are documented                                        |
| M8  | Community accounts and contributions         | `PLANNED`     | Rich contributor features extend the basic authenticated M4 feedback path |
| M9  | Launch readiness                             | `PLANNED`     | Launch content and quality gates are documented                           |

## Achievements

### 2026-06-29

- Completed the first-five M5 checkpoint: `agent`, `API`, `application`, `authorization`, and `access control` all have completed OpenAI jobs and explicit Editor acceptance.
- Backfilled five factual `accepted_as_is` calibration outcomes from attributed publication decisions with empty `modifiedFields`; language/domain assessments remain `not_checked` rather than inferred.
- Recorded the checkpoint rollup: 100% acceptance, 0% recorded edits, 16,625 input tokens, 15,020 output tokens, and 34.3-second average latency.
- Decision: continue the current prompt into the next controlled batch of ten; do not process all remaining 45 at once.
- Fixed leaked timestamp-suffixed terminology fixtures by moving integration tests from the development database to an automatically created and migrated `opentoli_test` database.
- Added guarded test-database URL resolution that rejects explicitly configured databases without an `_test` suffix, plus deterministic isolation tests.
- Added narrow preview/apply cleanup commands for known historical fixture prefixes and removed 11 leaked terms with their related drafts, jobs, and test categories from the development database.
- Verified the development cleanup preview reports zero fixtures after all 48 integration tests pass in the isolated database.
- Replaced the fixed Agent Jobs list with paginated headword, status, and Import Batch filtering plus visible grouping by batch.
- Expanded `GET /api/v1/editor/jobs` with the same stable filter and grouping contract while preserving safe summaries and private-output redaction.
- Added grouping/filter integration and browser coverage; all 46 integration tests, the production build, and all 18 browser tests pass.
- Added `/workspace/imports` with manual/CSV parsing, row-level validation, duplicate detection, Editor accept/reject review, and explicit queueing of accepted rows.
- Added the `import-batch-items` collection, stable Editor import read APIs, and migration `20260630_023959_web_import_preparation`, applied locally.
- Preserved controlled execution: browser queueing creates private Terms and Generation Jobs with batch/requester attribution but never calls the AI provider.
- Added parser and database integration coverage; TypeScript, ESLint, migration status, the production build, and all 12 Editor browser tests pass.
- Added aggregate M5 acceptance, edit, disagreement, failure, token, latency, and cost metrics to `/workspace/calibration` and the Editor v1 calibration response.
- Added first-five completion, recommendation counts, decision readiness, and a generated go/no-go summary that remains non-final until all 50 human outcomes are recorded.
- Added deterministic rollup coverage and browser expectations for the calibration metrics and go/no-go sections.
- Passed `npm run typecheck`, `npm run lint`, all 43 integration tests in 14 files, the production build, and all 17 browser tests after completing the three web-workflow slices.
- Expanded authenticated feedback with structured bilingual example suggestions and optional structured reference details for public drafts and published terms.
- Extended `/workspace/feedback` and `/contributions` to show the complete proposal while preserving approve/reject/hide moderation and the no-canonical-mutation boundary.
- Added and locally applied migration `20260630_021449_expanded_proposal_moderation`; targeted proposal, feedback, and contribution integration tests pass.
- Added `/workspace/terms` and `/workspace/terms/[id]` for Editor-only canonical term editing in OpenToli web.
- Added transactional published-term updates for wording, explanations, recommended and alternative translations, examples, categories, contexts, and optional references while preserving human attribution and publication guards.
- Added `PATCH /api/editor/terms/[id]`, integration coverage for Editor authorization and related-record replacement, and browser coverage for Workspace navigation.
- Passed `npm run typecheck`, `npm run lint`, and the published-term integration test.
- Removed the Source workflow completely: no verification state or endpoint, no evidence gate, no source-specific calibration outcome, and no source-based AI routing.
- Renamed active web and `/api/v1` contracts to References; manual reference management now contains only title and safe URL.
- Added and locally applied migrations `20260630_012122_optional_references_cleanup` and `20260630_012522_reference_enums`, preserving legacy storage and AI provenance keys only for backward compatibility.
- Reclassified sources as optional background references rather than evidence that proves a Mongolian translation.
- Removed reference verification and internal AI routes from canonical publication and public-feedback visibility gates; explicit Editor actions remain mandatory.
- Moved reference controls into a secondary collapsed section and retained safe URL redaction when optional references are shown publicly.
- Removed source-support decisions from the primary M5 calibration form and summary while retaining legacy provenance compatibility.
- Accepted ADR-0005 and updated the product specification, roadmap, and next-task handoff to prevent source gating from returning.
- Passed TypeScript, ESLint, 41 integration tests, the production build, and 16 browser tests; no migration was required.
- Passed TypeScript, ESLint, 40 integration tests, M5 manifest validation, the production build, and 16 browser tests after removing Source workflow behavior.

### 2026-06-27 (superseded source gate)

- Removed the blocked-draft dead end from the simple Editor workflow: an Editor can publish after reviewing and verifying at least one safe HTTP(S) source, while the original AI route remains in decision provenance.
- Added clear draft-page guidance for source verification and AI evidence warnings; no extra approval stage was introduced.
- Added integration coverage for missing or unverified source denial and human resolution of an AI-blocked draft.
- Passed TypeScript, ESLint, 41 integration tests, the production build, and 16 browser tests after the publication workflow fix.

### 2026-06-24

- Added a shared Workspace shell and menu so Editor tools are organized under Overview, Draft Inbox, Feedback, Agent Jobs, Calibration, public references, and admin maintenance.
- Moved the canonical Draft Inbox and draft editor routes to `/workspace/drafts` and `/workspace/drafts/[id]`, while keeping `/review/ai-drafts` and `/review/ai-drafts/[id]` as compatibility redirects.
- Added read-only `/workspace/jobs` and `/workspace/calibration` pages so Editors can inspect safe agent-job and M5 calibration status without opening Payload admin.
- Updated browser coverage for Workspace navigation, legacy Draft Inbox redirects, Agent Jobs, Calibration, and the new draft editor route.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:int`, `npm run test:e2e`, `npm run build`, and a final `npm run typecheck` after the Workspace menu restructure.
- Added stable public read endpoints: `GET /api/v1/search`, `GET /api/v1/terms/[slug]`, `GET /api/v1/categories`, `GET /api/v1/categories/[slug]`, `GET /api/v1/drafts`, and `GET /api/v1/drafts/[id]`.
- Added stable Editor read endpoints: `GET /api/v1/editor/workspace`, `GET /api/v1/editor/drafts`, `GET /api/v1/editor/drafts/[id]`, `GET /api/v1/editor/feedback`, `GET /api/v1/editor/jobs`, and `GET /api/v1/editor/calibration`.
- Added API v1 contract coverage proving public term/category shapes, public AI draft redaction, and unauthenticated Editor API denial.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:int` with 30 integration tests in 9 files, and `npm run build` after adding `/api/v1` read contracts.
- Added `/workspace/jobs/[id]` so Editors can inspect safe generation-job detail: state, attempts, timing, usage, cost, model/prompt versions, retained private evidence flags, and redacted diagnostics.
- Added `POST /api/editor/jobs/[id]` for the `retry-now` action and `GET /api/v1/editor/jobs/[id]` for stable job-detail reads.
- Restricted web retry to Editor users and only failed or retry-scheduled jobs with attempts remaining; retry-now only updates scheduling and does not run the worker or call the AI provider.
- Added integration coverage proving safe detail redaction, Editor-only retry, non-retryable state rejection, exhausted-attempt rejection, and unauthenticated route denial.
- Added browser coverage proving an Editor can open safe generation-job detail from OpenToli web and completed jobs cannot be retried.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:int` with 34 integration tests in 10 files, `npm run build`, and `npm run test:e2e` with 16 browser tests after adding Agent Job detail and retry-now.
- Processed the first live M5 calibration worker job with `npm run ai:work`: generation job 131 for `application` completed on attempt 1 with `openai:gpt-5-mini`.
- Retained private AI draft 189 as `needs_review/blocked` with high risk, recommendation `хэрэглээний програм (апп)`, six alternatives, two examples, and reviewer questions about register, dual-form policy, and separate web/mobile/desktop application entries.
- Recorded M5 job 131 evidence: 3,209 input tokens, 2,948 output tokens, 32,017 ms latency, estimated cost `$0.0000` as reported by the adapter, no validation errors, and required expertise `language`, `domain`, and `source_validation`.
- Added Editor-controlled public feedback visibility on `/workspace/drafts/[id]`, with server guards that only open active, non-blocked drafts that have at least one safe HTTP(S) source.
- Added draft source add/edit/remove controls on `/workspace/drafts/[id]`; source edits reset verification, and removing the last safe source automatically closes public feedback.
- Added `/api/editor/ai-drafts/[id]/sources` and `/api/editor/ai-drafts/[id]/sources/[sourceId]` for Editor-only source management backed by shared server helpers.
- Added integration coverage proving public visibility open/close, blocked and unsafe-source denial, Editor-only source CRUD, source deletion, and automatic public-feedback closure when source evidence is removed.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:int` with 38 integration tests in 10 files, `npm run build`, and `npm run test:e2e` with 16 browser tests after moving draft visibility and source management into OpenToli web.
- Added Draft Inbox source verification so Editors can mark draft sources verified from OpenToli web instead of opening Payload admin.
- Added `/api/editor/sources/[id]` and `verifySource`, which require Editor access and reject non-HTTP(S) source URLs before a source can become verified public evidence.
- Added integration coverage proving members cannot verify sources, Editors can verify safe sources idempotently, and unsafe URLs are rejected.
- Added browser coverage proving an Editor can verify a draft source from the web draft page.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:int`, `npm run test:e2e`, and `npm run build` after adding web source verification.
- Added `/contributions` so signed-in users can see their own comments, translation suggestions, moderation status, moderator notes, and safe links back to public targets from OpenToli web.
- Added account and Profile navigation to the contributor dashboard while keeping submissions as moderated proposals that never mutate canonical Terms, Translations, Examples, or AI Drafts directly.
- Added integration coverage proving the contribution dashboard returns only the signed-in contributor's own records with safe target links.
- Added browser coverage proving an authenticated user can open Contributions from Profile.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:int` with 39 integration tests in 11 files, `npm run build`, and `npm run test:e2e` with 16 browser tests after adding the contributor dashboard.
- Added the `calibration-outcomes` collection and migration `20260625_044141_m5_calibration_outcomes` for editor-only M5 review evidence.
- Expanded `/workspace/calibration` from read-only status into a 50-item manifest dashboard with safe job/draft evidence and inline human outcome recording.
- Added `/api/editor/calibration/outcomes` for Editor-only outcome saves and expanded `GET /api/v1/editor/calibration` with safe calibration item/outcome summaries.
- Added integration coverage proving members cannot record calibration outcomes, Editors can save and update one outcome per draft, and safe model/job evidence is retained.
- Added browser coverage proving the Calibration page exposes the Human calibration evidence section.
- Applied `20260625_044141_m5_calibration_outcomes`; `npx payload migrate:status` reports all six migrations ran.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:int` with 40 integration tests in 12 files, `npm run build`, and `npm run test:e2e` with 16 browser tests after adding calibration outcome recording.

### 2026-06-23

- Added a global OpenToli web header with explicit Home, Search, Workflow, Public drafts, and account-aware Profile/Draft Inbox navigation.
- Added web account navigation that shows Log in/Create account for visitors and Profile, plus Draft Inbox for Editors, after session detection.
- Added `/profile` with account role/status details, contributor/editor next actions, and web logout through Payload's session endpoint.
- Added a Playwright regression proving an authenticated user can open Profile, see editor links, log out, and then get redirected to sign-in when returning to Profile.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:e2e`, `npm run build`, and `npm run test:int` after adding profile/logout navigation.
- Simplified navigation by removing the header logout button and duplicate Contribute CTAs; logout now lives on Profile, while repeated actions use the main menu.
- Changed default already-authenticated login/register redirects to Profile so `/contribute` is no longer the account hub.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:e2e`, and `npm run build` after simplifying account and Contribute navigation.
- Added `/workspace` as the Editor-facing OpenToli web hub for terminology and agent work, with safe summaries for active drafts, public feedback, AI job status, import batches, and recently published terms.
- Moved editor navigation from direct Draft Inbox to Workspace while keeping Draft Inbox available as the primary action inside the Workspace.
- Added browser coverage proving an authenticated Editor can open the Workspace and see Draft Inbox, recent generation jobs, and terminology/agent status.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:e2e`, `npm run build`, and `npm run test:int` after adding the Workspace.
- Added `/workspace/feedback` so Editors can moderate pending comments and translation suggestions in OpenToli web.
- Added `/api/editor/feedback/[id]` for approve, reject, and hide moderation actions that update only Comment status and preserve the boundary that feedback cannot mutate Terms, Translations, or AI Drafts.
- Routed Workspace to Feedback Moderation and added browser coverage for opening the moderation page from Workspace.
- Reused the moderation helper in integration coverage so approved public feedback still records moderator attribution and appears only after approval.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:e2e`, `npm run build`, and `npm run test:int` after adding Feedback Moderation.
- Added `/workflow` to explain Visitor, Member, and Editor responsibilities and to state that normal terminology work should happen in OpenToli web, not Payload admin.
- Added `/drafts` as the contributor-facing list of public unverified AI drafts, including an empty state that explains what to do when no drafts are open.
- Added a persistent `Back to OpenToli` link to the Payload admin shell for users who enter admin maintenance screens.
- Reworked homepage, Contribute, Draft Inbox, and draft editor copy so contributors use public draft feedback and Editors use the web Draft Inbox for publish/hide decisions.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:int`, `npm run test:e2e`, and `npm run build` after the web workflow navigation changes.
- Started M5 with a fixed 50-term Technology and Software calibration manifest at `data/calibration/m5-technology-software.json`.
- Added `npm run m5:validate` and passed manifest validation: 50 terms, 8 source groups, 31 ambiguous terms, 9 domain-sensitive terms, and 10 straightforward terms.
- Added `npm run m5:prepare`, which creates or reuses private draft Terms, Sources, an Import Batch, and Generation Jobs without calling the AI provider.
- Prepared the first five M5 calibration terms with `npm run m5:prepare -- --limit=5`: 5 Terms, 7 Sources, and 5 Generation Jobs were created; no AI provider calls were made.
- Re-ran `npm run m5:prepare -- --limit=5` and verified idempotency: 0 new Terms, 0 new Sources, and 0 new Generation Jobs.
- Added `docs/M5_CALIBRATION.md` with run policy, review rubric, stop conditions, metrics, and go/no-go decision template.
- Passed `npm run typecheck` and `npm run lint` after adding the M5 workflow.
- Completed the live M3 OpenAI calibration for `authentication`: generation job 33 finished on attempt 2 with `openai:gpt-5-mini`, retained 3,365 input tokens, 3,025 output tokens, 35,002 ms latency, and no validation errors.
- Retained private AI draft 22 as `needs_review/blocked` with one source, five alternatives, three examples, human review required, and critique evidence requiring language, domain, and source-validation review.
- Verified idempotency with `npm run ai:prepare:authentication`: the command reused job 33 and draft 22 without changing the published Term or creating duplicate work.
- Verified the worker queue with `npm run ai:work`: no configured generation job remains ready.
- Marked M3 as `DONE` and moved the current milestone to M5 calibration readiness.

### 2026-06-21

- Completed M4 after adding automated serious WCAG A/AA scans and keyboard-only coverage for public drafts, sign-in, moderated feedback, background editing, and Editor secondary actions.
- Corrected homepage and public-draft color contrast failures found by axe-core.
- Fixed feedback confirmation by retaining the form element across the asynchronous request before resetting it.
- Made `axe-core` an explicit test dependency and changed Playwright's web-server command from unavailable global pnpm to `npm run dev`.
- Passed 26 integration tests, 9 Chromium browser tests, ESLint, TypeScript, and the production build; no migration was required.
- Removed the visible high-risk label and publication confirmation from the Draft Inbox and Editor page; AI risk metadata remains internal provenance only.
- Replaced the risk-confirmation integration scenario with a source-gate scenario proving unsourced drafts cannot publish and sourced drafts publish with one explicit Editor action. This gate was later removed by ADR-0005.
- Verified the simplified workflow with 26 integration tests, 6 browser tests, ESLint, TypeScript, and a production build; no schema change or migration was required.
- Accepted ADR-0004 and replaced the multi-action reviewer experience with `AI Draft -> Editor edits -> Publish`.
- Reduced the private workspace to one Draft Inbox, four editable fields, background save, one Publish button, sources, and community suggestions.
- Moved Hide under a secondary `More` control and retained all AI evidence instead of deleting hidden drafts.
- Made Publish an atomic, attributed human action that approves the selected translation and publishes the canonical Term.
- Replaced route-specific reviewer requirements with one Editor permission concept; granular stored roles remain compatibility aliases.
- Kept blocked and unsourced publication guards without exposing risk or routing controls. This decision was later superseded by ADR-0005.
- Added explicit Editor-controlled public visibility for sourced, non-blocked active AI Drafts.
- Added a narrow public projection that excludes raw research, generated payloads, critique, jobs, provider and prompt metadata, and unsafe citation URLs.
- Added `/drafts/[id]` with persistent `Unverified AI Draft` labeling and `noindex` metadata.
- Added public contributor registration and sign-in without exposing Payload's post-bootstrap Users create endpoint.
- Added friendly duplicate-email registration handling with a race-safe `409` response instead of logging an expected database error.
- Added a session-aware `/contribute` page and redirected authenticated users away from login and registration forms.
- Added pending-by-default comments and translation suggestions with owner access, moderator decisions, duplicate screening, and a five-per-ten-minute contributor limit.
- Added and locally applied `20260621_185717_m4_public_draft_feedback`.
- Clean-database forward migration and the M4 down migration passed against a disposable PostgreSQL database.
- Expanded database integration coverage to 7 files and 23 passing tests.
- Verified `/`, `/register`, and `/login` return `200`, while a nonexistent public draft returns `404`.
- Added and passed an authenticated Playwright regression proving logged-in users see contribution guidance rather than a create-account prompt.
- Added a private `/review/ai-drafts` queue and detail workspace with candidates, sources, research, confidence, critique, feedback, and decision history.
- Added atomic accept, modify, reject, reroute, and merge actions with immutable actor, route, field-outcome, reason, and resulting-record evidence.
- Enforced language-expert, category-expert, moderator, and high-risk review-route requirements server-side.
- Materialized accepted AI wording only into attributed canonical Term and Translation drafts; review actions cannot publish.
- Added and locally applied `20260621_193929_m4_reviewer_workspace`.
- Expanded database integration coverage to 8 files and 27 passing tests.
- Passed 5 authenticated browser tests, including the private reviewer queue.

### 2026-06-20

- Added the official OpenAI SDK and a `gpt-5-mini` Responses API adapter with strict structured outputs.
- Added provider selection from server-only environment variables and switched both AI CLI scripts to it.
- Added mocked request, schema, usage, failure, and provider-factory coverage without paid CI calls.
- Retained live OpenAI job 33 after a strict-schema rejection, fixed inferred `const`/`enum` types, and left it retryable.
- Expanded database integration coverage to 6 files and 19 passing tests.
- Added a provider-neutral AI interface and deterministic provider with versioned prompt metadata.
- Added atomic job claiming, staged output retention, retry resumption, usage accounting, and crash recovery.
- Added risk routing that blocks unsourced drafts and requires domain review for high-risk categories.
- Ran `authentication` end to end: job 11 and private draft 5 are `needs_review/language_review`.
- Re-ran `authentication` idempotently and reused job 11 and draft 5 without provider work.
- Expanded database integration coverage to 5 files and 16 passing tests.
- Accepted ADR-0003: anyone may view an unverified redacted AI draft, while contributing requires authentication and moderation.
- Added private AI Drafts and Generation Jobs collections with provenance, retry, and idempotency fields.
- Added versioned research, generation, and critique JSON Schemas with runtime validation.
- Enforced completed-job evidence before AI draft creation and retained the human publication boundary.
- Disabled automatic database schema push so committed migrations are authoritative in development and CI.
- Generated and clean-database validated the M3 AI foundation migration.
- Expanded database integration coverage to 4 files and 12 passing tests.
- Made editorial integration tests self-contained on a migrated database; seed data is no longer a test prerequisite.
- Added Terms, Translations, Sources, Examples, Reviews, and Import Batches collections.
- Added server-side publication guards and public draft isolation.
- Generated and clean-database validated the editorial-core migration.
- Seeded a sourced `authentication` reference term with translations and an example.
- Replaced placeholder search and category pages with PostgreSQL-backed results.
- Added the responsive `/terms/[slug]` detail page.
- Verified English and Mongolian search-to-term navigation in clean Chrome with no console issues.
- Verified attributed reviewer/moderator publication and contributor denial.
- Expanded database integration coverage to 3 files and 8 passing tests.
- Switched seeding to Payload's supported script runner so the command exits without lingering processes.
- Fixed standalone seed environment loading and seeded all 10 primary categories.
- Ran the database-backed integration suite successfully: 2 files and 3 tests passed.
- Verified homepage, search, category, and admin routes in clean Chrome at desktop and mobile sizes.
- Added the OpenToli app icon and confirmed its SVG response returns `200`.
- Removed invalid nested `main` landmarks from the public layout.
- Verified the homepage in a clean Chrome profile with no hydration warnings.
- Scaffolded the official Payload 3.85.1 blank application with Next.js 16 and PostgreSQL.
- Added a responsive OpenToli homepage, search placeholder, and category placeholders.
- Added role-aware Users plus Categories and Contexts Payload collections.
- Added an idempotent bilingual seed definition for all ten primary categories.
- Added PostgreSQL 17 Docker configuration and environment examples.
- Added GitHub Actions quality gates, runtime pins, Vitest, and Playwright configuration.
- Recorded application topology and editorial state decisions in ADR-0001 and ADR-0002.
- Verified generated Payload types, TypeScript, ESLint, two domain tests, and production build.
- Smoke-tested `/` and `/search?q=authentication` over HTTP with successful `200` responses.
- Created the English-to-Mongolian terminology product specification.
- Defined ten primary terminology categories and a 1,300-candidate content target.
- Defined a launch target of 300 human-reviewed terms and 100 additional drafts.
- Changed the corpus strategy to AI-first, source-grounded preparation.
- Defined research, multi-candidate generation, independent critique, and risk routing.
- Defined AI provenance, dimensional confidence, and human publication safeguards.
- Defined a 50-term calibration batch before larger generation runs.
- Established milestone gates and an AI-agent operating guide.

## Verification

| Check                     | Result      | Evidence                                                                                                               |
| ------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| Payload type generation   | Pass        | `npm run generate:types`                                                                                               |
| TypeScript                | Pass        | `npm run typecheck`                                                                                                    |
| ESLint                    | Pass        | `npm run lint`                                                                                                         |
| Slug normalization tests  | Pass        | 2 tests in `formatSlug.int.spec.ts`                                                                                    |
| Production build          | Pass        | Next.js generated all current public and Payload routes                                                                |
| HTTP smoke test           | Pass        | `/` and `/search?q=authentication` returned `200`                                                                      |
| Hydration smoke test      | Pass        | Clean Chrome profile produced no hydration warning                                                                     |
| Database integration      | Pass        | 48 integration tests in 16 files pass against isolated `opentoli_test` without touching development content           |
| API v1 read contracts     | Pass        | Public search, term, category, public draft redaction, and Editor auth-denial contract tests pass                     |
| Agent Job Detail          | Pass        | Safe job detail and retry-now tests cover redaction, Editor authorization, retryable states, and route auth denial     |
| Optional References       | Pass        | Editor reference add/edit/remove and verification work without gating publication; unsafe URLs stay redacted          |
| Public draft feedback     | Pass        | 4 scenarios verify projection redaction, registration roles, pending moderation, throttling, and resolved-draft hiding |
| Simple Editor workflow    | Pass        | Tests cover background save, member denial, explicit Editor publication, optional references, Hide, and provenance |
| OpenAI adapter contract   | Pass        | 3 mocked tests verify strict Responses API requests, parsing, usage, and failures                                      |
| OpenAI live calibration   | Pass        | Job 33 completed with `openai:gpt-5-mini`: 3,365 input tokens, 3,025 output tokens, 35,002 ms latency, no validation errors |
| M5 manifest validation    | Pass        | `npm run m5:validate` passed for 50 terms and 8 source groups                                                          |
| M5 first enqueue          | Pass        | First run created 5 Terms, 7 Sources, and 5 Generation Jobs; second run reused all records without provider calls      |
| M5 first worker job       | Pass        | Job 131 for `application` completed; draft 189 retained as private blocked/high-risk review evidence                  |
| M5 first-five checkpoint  | Pass        | Five completed jobs, five explicit Editor acceptances, and five factual calibration outcomes; preliminary signal `continue` |
| Migration status          | Pass        | `npm run payload -- migrate:status` reports all ten tracked migrations ran locally                                |
| Local HTTP smoke          | Pass        | `/`, `/register`, and `/login` return `200`; an unknown draft returns `404`                                            |
| M4 browser regression     | Pass        | Browser tests cover public/auth/feedback/Editor keyboard flows, optional references, job detail, and serious WCAG A/AA scans              |
| Web workflow navigation   | Pass        | Global navigation plus Workspace drafts, terms, feedback, imports, filtered jobs, calibration, and admin maintenance build successfully; 18 browser tests pass |
| Web account workflow      | Pass        | `/profile`, header account links, Editor Workspace visibility, contributions, and Profile-only logout pass in 18 browser tests |
| Editor web Workspace      | Pass        | `/workspace` and Workspace menu organize draft, feedback, generation job, calibration, batch, and published-term summaries without raw AI outputs |
| Feedback Moderation       | Pass        | `/workspace/feedback` and `/api/editor/feedback/[id]` let Editors approve, reject, or hide pending feedback without canonical mutations |
| Contributor Dashboard     | Pass        | `/contributions` shows signed-in users only their own comments, suggestions, statuses, moderator notes, and safe target links |
| M5 Calibration Outcomes   | Pass        | `/workspace/calibration` records Editor-only human outcomes with safe job evidence; migration `20260625_044141_m5_calibration_outcomes` is applied |
| Published term editing    | Pass        | `/workspace/terms` updates canonical wording and related records transactionally with Editor-only integration coverage |
| Proposal moderation       | Pass        | Translation, example, and reference proposals stay pending and advisory; migration `20260630_021449_expanded_proposal_moderation` is applied |
| Calibration reporting     | Pass        | First-five progress, aggregate quality/cost metrics, and non-automatic go/no-go readiness are derived and browser-tested |
| Import preparation        | Pass        | Manual/CSV rows are validated, reviewed, and explicitly queued without provider execution; migration is applied locally |
| Agent Job organization    | Pass        | Headword/status/batch filters, pagination, and safe Import Batch grouping pass integration and browser coverage |
| Historical full rollback  | Known issue | M2 `editorial_core` down migration has an existing lock-relation drop-order defect                                     |

## Current Work

M3 and M4 are complete. Normal Editor work for drafts, feedback moderation, optional references,
published terms, agent-job status, and calibration status now lives under the Workspace menu
in OpenToli web. Stable `/api/v1` read contracts now cover the public dictionary/draft
surfaces and Editor Workspace summaries for future mobile use. Editors can inspect safe job
detail and queue eligible failed/retry-scheduled jobs for retry without starting provider work
from the browser. Editors can also manage draft public feedback visibility and optional references
from the web draft page. Contributors can track their own moderated comments, translations,
examples, and reference proposals from `/contributions` without opening Payload admin.
`/workspace/calibration` records human outcomes and derives quality, cost, progress, and
decision-readiness metrics. M5 is in progress: the fixed 50-term manifest is tracked and
validated, and the first five jobs, Editor decisions, and calibration outcomes are complete.
The checkpoint supports continuing the current prompt, but language and domain assessment
fields remain `not_checked`. The next run should prepare ten terms and process them one at a
time. See
[`NEXT_TASKS.md`](NEXT_TASKS.md) for the brief next-agent handoff covering admin/web
separation, remaining admin-to-web moves, and remaining milestones.

## Next Actions

1. Prepare the next ten terms with `npm run m5:prepare -- --offset=5 --limit=10`.
2. Process one job with `npm run ai:work`, inspect its draft, and record the human outcome before running another.
3. Fill language/domain assessments when a human performs those checks; do not infer them from publication alone.
4. Add logged-in Editor success coverage for `/api/v1/editor/*` before mobile work begins.
5. Repair and separately validate the historical M2 down migration ordering defect.

## Blockers

No active blocker is recorded.

## Risks

| Risk                                                    | Impact                                    | Current mitigation                                                                             |
| ------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| AI output sounds natural but is technically wrong       | Loss of trust                             | Explicit Editor publication, human calibration, and retained provenance                        |
| AI pipeline cost grows during batch generation          | Budget pressure                           | Calibration batch, idempotent jobs, and cost metrics                                           |
| Conflicting status fields permit accidental publication | Data exposure                             | Formal publication state machine required in M0                                                |
| Search leaks drafts                                     | Unreviewed content becomes public         | Public-query and authorization tests required in M2 and M7                                     |
| Content work outpaces reviewer capacity                 | Large unreviewed backlog                  | Batches of 100 to 200 after calibration                                                        |
| Public feedback attracts spam or abuse                  | Moderation load and unsafe public content | Authentication, pending-by-default submissions, rate limits, screening, and moderator controls |

## Update Log Template

Add new entries above older entries under `Achievements`:

```markdown
### YYYY-MM-DD

- Completed: <observable outcome>
- Evidence: <test, command, file, page, migration, or deployment>
- Decision: <ADR link, when applicable>
- Remaining: <next incomplete acceptance criterion>
```

Do not report an achievement as complete when only its design or scaffold exists.
