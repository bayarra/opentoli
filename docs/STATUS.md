# OpenToli Project Status

**Last updated:** 2026-06-24
**Current milestone:** M5 - Calibration Batch
**Milestone status:** `IN_PROGRESS`
**Delivery state:** M5 calibration manifest and first five queued jobs are ready for controlled processing

## Executive Summary

OpenToli now has a buildable Next.js and Payload application plus its first complete
database-backed terminology slice. Terms, translations, sources, examples, reviews, and
import batches are modeled. The published `authentication` reference term is searchable
in English and Mongolian, appears in its category, and has a responsive detail page.
Publication guards, clean migrations, seeding, integration tests, and browser checks pass.
M3 has private AI Draft and Generation Job persistence, versioned structured-output
contracts, provider-neutral staged execution, idempotent enqueueing, retry resumption,
risk routing, retained provenance, deterministic end-to-end evidence, and a completed live
OpenAI reference run for `authentication`. M4 now has an explicit safe public projection, registration,
authenticated pending feedback, moderation, and a deliberately simple Editor experience:
one Workspace menu, one Draft Inbox, four editable fields, web source verification, background save, one
Publish action, and secondary Hide. Audit and AI provenance remain automatic in the
background, while unsafe source URLs cannot be verified for public citation. Keyboard-only
critical flows and serious WCAG A/AA violations now have automated browser coverage. The
controlled 50-term Technology and Software calibration batch is now fixed in a tracked
manifest, and the first five private preparation jobs are queued without provider calls.

## Milestone Status

| ID  | Milestone                                    | Status        | Evidence                                                                  |
| --- | -------------------------------------------- | ------------- | ------------------------------------------------------------------------- |
| M0  | Product and architecture baseline            | `DONE`        | ADR-0001 and ADR-0002 record the accepted baseline                        |
| M1  | Application foundation                       | `DONE`        | Clean migration, seed, tests, build, HTTP, and browser evidence recorded  |
| M2  | Editorial data core                          | `DONE`        | Attributed reviewer/moderator workflow and public vertical slice verified |
| M3  | AI preparation pipeline                      | `DONE`        | Live OpenAI job 33 completed; draft 22 retained; idempotency verified     |
| M4  | Public draft feedback and simple editor flow | `DONE`        | All exit criteria pass with 27 integration and 15 browser tests           |
| M5  | Calibration batch                            | `IN_PROGRESS` | Fixed 50-term manifest validates; first five jobs are queued              |
| M6  | Public dictionary                            | `PLANNED`     | Required pages are documented                                             |
| M7  | Search and discovery                         | `PLANNED`     | Ranking and filters are documented                                        |
| M8  | Community accounts and contributions         | `PLANNED`     | Rich contributor features extend the basic authenticated M4 feedback path |
| M9  | Launch readiness                             | `PLANNED`     | Launch content and quality gates are documented                           |

## Achievements

### 2026-06-24

- Added a shared Workspace shell and menu so Editor tools are organized under Overview, Draft Inbox, Feedback, Agent Jobs, Calibration, public references, and admin maintenance.
- Moved the canonical Draft Inbox and draft editor routes to `/workspace/drafts` and `/workspace/drafts/[id]`, while keeping `/review/ai-drafts` and `/review/ai-drafts/[id]` as compatibility redirects.
- Added read-only `/workspace/jobs` and `/workspace/calibration` pages so Editors can inspect safe agent-job and M5 calibration status without opening Payload admin.
- Updated browser coverage for Workspace navigation, legacy Draft Inbox redirects, Agent Jobs, Calibration, and the new draft editor route.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:int`, `npm run test:e2e`, `npm run build`, and a final `npm run typecheck` after the Workspace menu restructure.
- Added Draft Inbox source verification so Editors can mark draft sources verified from OpenToli web instead of opening Payload admin.
- Added `/api/editor/sources/[id]` and `verifySource`, which require Editor access and reject non-HTTP(S) source URLs before a source can become verified public evidence.
- Added integration coverage proving members cannot verify sources, Editors can verify safe sources idempotently, and unsafe URLs are rejected.
- Added browser coverage proving an Editor can verify a draft source from the web draft page.
- Passed `npm run typecheck`, `npm run lint`, `npm run test:int`, `npm run test:e2e`, and `npm run build` after adding web source verification.

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
- Replaced the risk-confirmation integration scenario with a source-gate scenario proving unsourced drafts cannot publish and sourced drafts publish with one explicit Editor action.
- Verified the simplified workflow with 26 integration tests, 6 browser tests, ESLint, TypeScript, and a production build; no schema change or migration was required.
- Accepted ADR-0004 and replaced the multi-action reviewer experience with `AI Draft -> Editor edits -> Publish`.
- Reduced the private workspace to one Draft Inbox, four editable fields, background save, one Publish button, sources, and community suggestions.
- Moved Hide under a secondary `More` control and retained all AI evidence instead of deleting hidden drafts.
- Made Publish an atomic, attributed human action that approves the selected translation and publishes the canonical Term.
- Replaced route-specific reviewer requirements with one Editor permission concept; granular stored roles remain compatibility aliases.
- Kept blocked and unsourced publication guards without exposing risk or routing controls.
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
| Database integration      | Pass        | 27 self-contained integration tests in 8 files pass against PostgreSQL without requiring seed data                     |
| Public draft feedback     | Pass        | 4 scenarios verify projection redaction, registration roles, pending moderation, throttling, and resolved-draft hiding |
| Simple Editor workflow    | Pass        | 4 scenarios verify background save, member denial, source verification, sourced one-action publication, Hide, and provenance |
| OpenAI adapter contract   | Pass        | 3 mocked tests verify strict Responses API requests, parsing, usage, and failures                                      |
| OpenAI live calibration   | Pass        | Job 33 completed with `openai:gpt-5-mini`: 3,365 input tokens, 3,025 output tokens, 35,002 ms latency, no validation errors |
| M5 manifest validation    | Pass        | `npm run m5:validate` passed for 50 terms and 8 source groups                                                          |
| M5 first enqueue          | Pass        | First run created 5 Terms, 7 Sources, and 5 Generation Jobs; second run reused all records without provider calls      |
| Migration reproducibility | Pass        | All 5 migrations apply from zero; both M4 down migrations pass in isolation                                            |
| Local HTTP smoke          | Pass        | `/`, `/register`, and `/login` return `200`; an unknown draft returns `404`                                            |
| M4 browser regression     | Pass        | 15 browser tests pass, including public/auth/feedback/Editor keyboard flows, source verification, and serious WCAG A/AA scans |
| Web workflow navigation   | Pass        | Global web navigation, `/workflow`, `/drafts`, `/workspace`, `/workspace/drafts`, `/workspace/feedback`, `/workspace/jobs`, `/workspace/calibration`, and admin Back link build successfully; 15 browser tests pass |
| Web account workflow      | Pass        | `/profile`, header account links, editor Workspace visibility, and Profile-only Payload-backed logout pass in 15 browser tests |
| Editor web Workspace      | Pass        | `/workspace` and Workspace menu organize draft, feedback, generation job, calibration, batch, and published-term summaries without raw AI outputs |
| Feedback Moderation       | Pass        | `/workspace/feedback` and `/api/editor/feedback/[id]` let Editors approve, reject, or hide pending feedback without canonical mutations |
| Source Verification       | Pass        | Draft source verification works from `/workspace/drafts/[id]`; member access and unsafe source URLs are rejected       |
| Historical full rollback  | Known issue | M2 `editorial_core` down migration has an existing lock-relation drop-order defect                                     |

## Current Work

M3 and M4 are complete. Normal Editor work for drafts, feedback moderation, source
verification, agent-job status, and calibration status now lives under the Workspace menu
in OpenToli web. M5 is in progress: the fixed 50-term manifest is tracked and validated,
and the first five jobs are queued for controlled one-at-a-time processing. No M5 AI
provider call has been run yet.

## Next Actions

1. Process one queued M5 job with `npm run ai:work`, then record token, latency, cost, validation, route, and reviewer-quality evidence before continuing.
2. Review the first five drafts before preparing or processing terms 6-15.
3. Repair and separately validate the historical M2 down migration ordering defect.

## Blockers

No active blocker is recorded.

## Risks

| Risk                                                    | Impact                                    | Current mitigation                                                                             |
| ------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| AI output sounds natural but is technically wrong       | Loss of trust                             | Required sources, explicit Editor publication, and retained provenance                         |
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
