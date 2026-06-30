# OpenToli Delivery Roadmap

## Purpose

This roadmap converts [`../specs.md`](../specs.md) into gated implementation
milestones. It is ordered for an AI-first content operation: build the editorial and
generation path before investing heavily in the public experience.

## Status Convention

| Status        | Meaning                                                 |
| ------------- | ------------------------------------------------------- |
| `PLANNED`     | Defined but not started                                 |
| `READY`       | Dependencies and entry criteria are satisfied           |
| `IN_PROGRESS` | Active implementation work exists                       |
| `BLOCKED`     | Work cannot proceed; blocker is recorded in `STATUS.md` |
| `DONE`        | Exit criteria are verified and evidence is recorded     |
| `DEFERRED`    | Intentionally removed from the current delivery horizon |

Only one milestone should normally be `IN_PROGRESS`. Parallel work is acceptable when
it does not weaken an acceptance gate or create conflicting architectural decisions.

## Milestone Summary

| ID  | Milestone                                    | Depends on | Deliverable                                                    |
| --- | -------------------------------------------- | ---------- | -------------------------------------------------------------- |
| M0  | Product and architecture baseline            | None       | Approved technical baseline and development workflow           |
| M1  | Application foundation                       | M0         | Deployable Next.js, Payload, and PostgreSQL skeleton           |
| M2  | Editorial data core                          | M1         | Manually authored term can be reviewed and published           |
| M3  | AI preparation pipeline                      | M2         | Traceable draft can be generated, critiqued, and queued        |
| M4  | Public draft feedback and reviewer workspace | M3         | Public can safely review drafts and reviewers can resolve them |
| M5  | Calibration batch                            | M4         | Fifty terms processed and pipeline quality measured            |
| M6  | Public dictionary                            | M2, M5     | Published terms are discoverable and readable publicly         |
| M7  | Search and discovery                         | M6         | Ranked bilingual search with required filters                  |
| M8  | Community accounts and contributions         | M4, M7     | Attributed contributor workflow extends public feedback        |
| M9  | Launch readiness                             | M5-M8      | Production controls and launch content gates verified          |

## M0 - Product and Architecture Baseline

**Objective:** Remove high-cost uncertainty before scaffolding the application.

**Scope:**

- Confirm single-application Next.js and Payload topology.
- Select supported Node.js, package manager, Payload, and PostgreSQL versions.
- Select local and production database providers.
- Define environment, secrets, test, CI, and deployment strategy.
- Define the authoritative term publication state machine.
- Define English and Mongolian normalization rules.
- Record material decisions as ADRs.

**Exit criteria:**

- Development and production topology is documented.
- Reversible defaults are chosen for remaining non-blocking questions.
- Initial ADRs cover deployment topology and editorial state transitions.
- M1 can begin without an unresolved foundational decision.

## M1 - Application Foundation

**Objective:** Produce a reproducible, deployable development baseline.

**Scope:** Next.js App Router, TypeScript, Payload CMS, PostgreSQL, Tailwind CSS,
shadcn/ui, environment validation, migrations, seed runner, linting, tests, and CI.

**Exit criteria:**

- A clean checkout can install, migrate, seed, test, and start from documented commands.
- Payload admin and a public health page load against PostgreSQL.
- CI runs type checking, linting, and the initial automated test suite.
- Secrets are excluded from source control and required variables are validated.

## M2 - Editorial Data Core

**Objective:** Prove the human-controlled terminology lifecycle without AI.

**Scope:** Users, roles, Categories, Contexts, Terms, Translations, Examples, References,
Reviews, Import Batches, access control, drafts, versions, validation, and audit fields.

**Exit criteria:**

- An administrator can create a bilingual term with optional references.
- A reviewer can approve it through valid state transitions.
- Only an authorized human action can publish it.
- Unauthorized role and invalid-transition tests pass.
- The ten primary categories are seeded idempotently.

## M3 - AI Preparation Pipeline

**Objective:** Turn a headword into a traceable, review-ready draft.

**Scope:** CSV/manual input, optional reference capture, normalization, duplicate checks, research
packet, multiple translation candidates, independent critique, schema validation,
risk routing, background jobs, retries, and generation provenance.

**Exit criteria:**

- The `authentication` reference term completes the pipeline end to end.
- Re-running the same job does not create duplicate records or charges unexpectedly.
- Failures are retryable and visible without losing partial evidence.
- Provider, model, prompt, schema, optional reference input, and raw outputs are retained.
- No generated record can be presented as verified or become a canonical Term without M2 review and approval.
- Raw prompts, provider outputs, job errors, and private review evidence remain restricted.
- At least one configured non-test AI provider completes the reference term in a non-production environment.

## M4 - Public Draft Feedback and Simple Editor Workflow

**Objective:** Let anyone inspect clearly unverified AI drafts, let authenticated
contributors improve them, and let an Editor edit and publish from one simple Draft Inbox.

**Scope:** Safe public draft projection, `Unverified AI Draft` labeling, basic public
registration and sign-in, authenticated comments and translation suggestions, moderation,
rate limits and anti-abuse controls, one Draft Inbox, direct field editing, background save,
explicit Publish, secondary Hide, and automatic attribution.

**Exit criteria:**

- Anyone can view an explicitly public AI draft without receiving raw or private generation evidence.
- Authenticated users can submit comments or translation suggestions that enter a pending moderation queue.
- Anonymous users attempting to contribute are directed to register or sign in.
- Public feedback cannot directly modify a draft, select a translation, or publish a Term.
- Rejected, failed, and private drafts are not publicly visible.
- Editors can edit and publish from one page without managing routes or review types.
- Editing saves in the background and Publish is the only primary decision action.
- Hide removes an unusable draft from the active inbox without deleting its provenance.
- Publication records the editor and field changes automatically.
- Internal AI routes and optional references do not add publication stages or override an Editor's explicit Publish action.
- Keyboard operation and critical accessibility checks pass.

## M5 - Calibration Batch

**Objective:** Validate quality and cost before scaling corpus generation.

**Scope:** Process approximately 50 Technology and Software terms, including ambiguous
terms such as `agent`, `token`, `session`, and `repository`.

**Exit criteria:**

- All 50 terms have a recorded human outcome.
- Acceptance, edit, rejection, disagreement, duplicate, cost, and latency metrics exist.
- Prompt, schema, and routing changes are evaluated against a fixed reference set.
- A written go/no-go decision exists for batches of 100 to 200 terms.

## M6 - Public Dictionary

**Objective:** Present approved content as a trustworthy bilingual reference while keeping
public unverified drafts unmistakably separate.

**Scope:** Homepage, term detail, category pages, new terms, review badges, references,
related terms, revision summaries, responsive UI, metadata, and accessibility basics.

**Exit criteria:**

- Only published Terms appear as canonical dictionary entries through public pages and APIs.
- Explicitly public AI draft projections may appear with an `Unverified AI Draft` label and `noindex` metadata.
- A term displays translation, context, explanation, examples, optional references, and review state.
- AI-prepared and human-reviewed states are visually distinct.
- Critical pages pass responsive, accessibility, and metadata checks.

## M7 - Search and Discovery

**Objective:** Provide fast, predictable bilingual terminology lookup.

**Scope:** PostgreSQL exact, prefix, translation, related-term, and explanation search;
ranking; normalization; category, context, and review filters; pagination; analytics.

**Exit criteria:**

- Ranking follows the priority defined in the product specification.
- English and Mongolian fixtures cover exact, prefix, and alternative matches.
- Query plans use appropriate indexes at representative data volume.
- Search may return explicitly public AI draft projections below canonical results, but never leaks restricted drafts or editorial records.

## M8 - Community Accounts and Contributions

**Objective:** Add richer identity, ownership, reputation, and contribution tools on top of
the authenticated moderated feedback path delivered in M4.

**Scope:** Contributor profiles, attributed term submissions, translation and explanation
suggestions, examples, references, comments, votes, contributor dashboard, history,
reputation signals, and expanded moderation tooling.

**Exit criteria:**

- Contributors can manage only their own drafts and proposals.
- Community input cannot directly mutate or publish canonical content.
- Moderation, abuse controls, rate limits, and ownership tests pass.
- Votes remain advisory and cannot select a recommended translation automatically.

## M9 - Launch Readiness

**Objective:** Verify production reliability, security, portability, and content gates.

**Scope:** Backups and restore, exports, monitoring, rate limits, security review,
performance, accessibility, SEO, operational runbooks, and launch corpus verification.

**Exit criteria:**

- Backup restoration and CSV/JSON export are exercised successfully.
- Security, accessibility, and performance release checks pass.
- Monitoring and incident ownership are documented.
- At least 300 terms are human reviewed and published.
- At least 100 additional drafts are clearly labeled and non-public unless approved.
- At least five primary categories are active.

## Global Definition of Done

A deliverable is done only when behavior, tests, documentation, migrations, security
impact, accessibility impact, and operational impact have been addressed. A milestone
is done only when every exit criterion has evidence in [`STATUS.md`](STATUS.md).
