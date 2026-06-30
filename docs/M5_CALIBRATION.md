# M5 Calibration Batch Runbook

## Purpose

M5 validates OpenToli's AI preparation quality and cost before larger corpus generation.
The batch is intentionally fixed, traceable, and reviewed by humans before any
canonical publication decision.

This milestone must not create automated publishing. M5 produces private AI drafts,
metrics, and review evidence.

## Artifacts

- Manifest: [`../data/calibration/m5-technology-software.json`](../data/calibration/m5-technology-software.json)
- Validator: [`../src/scripts/validateM5Calibration.ts`](../src/scripts/validateM5Calibration.ts)
- Prepare script: [`../src/scripts/prepareM5Calibration.ts`](../src/scripts/prepareM5Calibration.ts)
- Worker: [`../src/scripts/runAIWorker.ts`](../src/scripts/runAIWorker.ts)
- Web outcome recorder: `/workspace/calibration`
- Aggregate quality, cost, first-five progress, and go/no-go rollup: `/workspace/calibration`
- Outcome migration: `20260625_044141_m5_calibration_outcomes`
- Reference cleanup migrations: `20260630_012122_optional_references_cleanup` and `20260630_012522_reference_enums`

## Fixed Input Set

The manifest contains exactly 50 Technology and Software terms. It includes the required
ambiguous calibration terms:

- `agent`
- `token`
- `session`
- `repository`

The set deliberately mixes straightforward, ambiguous, and domain-sensitive terms across:

- Web APIs and browser terminology
- Cybersecurity and identity terminology
- Version control terminology
- Databases
- Cloud, Kubernetes, and infrastructure
- General software architecture and packaging

Optional references point to material such as MDN, GitHub Docs, Kubernetes Docs, PostgreSQL
Docs, NIST CSRC, and Microsoft Learn. AI output and editors must not copy definitions verbatim.
References are optional background
provenance, not proof of Mongolian wording and not a publication gate.

## Preflight

Run the manifest validator before preparing jobs:

```powershell
npm run m5:validate
```

Expected result:

```text
M5 calibration manifest is valid
Terms: 50
References: 8
```

Confirm `.env` points at the intended provider before enqueueing jobs:

```powershell
Get-Content .env | Select-String "AI_PROVIDER|AI_MODEL"
```

Do not print or paste `AI_API_KEY`.

## Prepare Jobs

The prepare command creates or reuses private draft Terms, creates or reuses Reference
records, and enqueues Generation Jobs. It does not call the AI provider and does not spend
API credit.

Prepare the first five terms:

```powershell
npm run m5:prepare:first
```

Prepare the next ten after reviewing the first batch:

```powershell
npm run m5:prepare:next
```

Prepare all remaining terms only after the first batches look healthy:

```powershell
npm run m5:prepare:remaining
```

## Process Jobs

Process one queued job at a time:

```powershell
npm run ai:work
```

Repeat only when the previous job has been inspected. The worker records provider,
model, prompt versions, token usage, latency, raw outputs, validation result, and retry
state in `Generation Jobs`.

## Run Log

### 2026-06-29 - Second Batch Preparation and First Draft

| Field | Evidence |
| --- | --- |
| Prepared terms | Priorities 6-15: `branch` through `configuration` |
| Preparation result | 10 Terms, 13 References, and 10 Generation Jobs created; no provider call during preparation |
| Processed term | `branch` |
| Job / draft | Job 605 completed on attempt 2; draft 437 `needs_review` |
| Provider/model | `openai:gpt-5-mini` |
| Tokens | 2,953 input / 2,312 output |
| Latency | 27,398 ms |
| Visibility | `private` |
| Recommendation | `салбар`; alternative `брэнч` |
| Route/risk | Draft `fast_review` / `low`; critique recommends `language_review` |
| Remaining queue | 9 jobs, `build` through `configuration`, untouched |

The first attempt recorded a connection error and safely moved to `retry_scheduled`; the
controlled retry completed without losing provenance. Before another worker run, an Editor must
review whether `салбар` or `брэнч` should be preferred, check the Mongolian explanation and
examples for naturalness, resolve the route discrepancy, and record the outcome in
`/workspace/calibration`.

### 2026-06-29 - Branch Decision and Build Draft

| Field | Evidence |
| --- | --- |
| `branch` decision | Draft 437 `partially_accepted`; canonical recommendation changed from `салбар` to `мөчир` |
| `branch` calibration | Outcome 18: `accepted_with_edits`, edit level `rewrite`, language `natural`, domain `accurate` |
| Processed term | `build` |
| Job / draft | Job 606 completed on attempt 1; draft 438 `needs_review` |
| Provider/model | `openai:gpt-5-mini` |
| Tokens | 3,866 input / 3,242 output |
| Latency | 40,879 ms |
| Visibility | `private` |
| Recommendation | `билд / билдлэх` |
| Route/risk | `language_review` / `medium` |
| Remaining queue | 8 jobs, `cache` through `configuration`, untouched |

Before another worker run, an Editor must decide how noun and verb forms should differ, whether
OpenToli should retain the loanword or use a Mongolian equivalent, and record the factual outcome
in `/workspace/calibration`.

### 2026-06-29 - Second Batch Generation Complete

The Editor recorded `build` as `accepted_with_edits` with edit level `rewrite`, language
assessment `major_edits`, and domain assessment `needs_expert_review`. The remaining eight jobs
were then processed together by explicit operator request. All completed on attempt 1, created
private `needs_review` drafts, and reported no blocking issues.

| Term | Job | Draft | Recommendation | Route / risk |
| --- | ---: | ---: | --- | --- |
| `cache` | 607 | 439 | `кэш` | `language_review` / `medium` |
| `callback` | 608 | 440 | `callback (коллбэк) / дуудлагын функц` | `language_review` / `medium` |
| `certificate` | 609 | 441 | `гэрчилгээ / сертификат` | `language_review` / `medium` |
| `client` | 610 | 442 | `клиент` | `language_review` / `medium` |
| `cluster` | 611 | 443 | `кластер` | `language_review` / `medium` |
| `commit` | 612 | 444 | `коммит (коммит хийх)` | `community_discussion` / `medium` |
| `component` | 613 | 445 | `компонент` | `language_review` / `medium` |
| `configuration` | 614 | 446 | `тохиргоо` | `fast_review` / `low` |

Combined evidence for these eight jobs is 26,767 input tokens, 23,404 output tokens, and
252,951 ms provider latency. The Generation Job queue is empty. These drafts still require
individual human decisions and calibration outcomes; batch generation does not authorize
publication.

### 2026-06-29 - First-Five Checkpoint

| Field | Evidence |
| --- | --- |
| Terms | `agent`, `API`, `application`, `authorization`, `access control` |
| Jobs | 5 completed |
| Draft decisions | 5 explicitly accepted by Editor `Bayar Dem` |
| Recorded field changes | None across the five decisions |
| Calibration outcomes | 5 `accepted_as_is`, edit level `none` |
| Language/domain fields | `not_checked`; no assessment was inferred |
| Tokens | 16,625 input / 15,020 output |
| Average latency | 34,332 ms |
| Checkpoint decision | Continue current prompt into the next controlled batch of ten |

The backfill records only facts already present in the attributed publication decisions. It does
not claim linguistic or domain validation that was not separately recorded.

### 2026-06-24 - First Live M5 Worker Job

| Field | Evidence |
| --- | --- |
| Command | `npm run ai:work` |
| Term | `application` |
| Job | 131 |
| Draft | 189 |
| Provider/model | `openai:gpt-5-mini` |
| Status | Job `completed`; draft `needs_review` |
| Route/risk | `blocked` / `high` |
| Tokens | 3,209 input / 2,948 output |
| Latency | 32,017 ms |
| Cost | `$0.0000` as reported by the adapter |
| Validation | No validation errors |
| Draft visibility | `private` |
| Recommendation | `хэрэглээний програм (апп)` |
| Output shape | 6 alternatives, 2 examples |
| Required expertise | `language`, `domain`; the legacy `source_validation` value has no workflow effect |

Reviewer notes to resolve before continuing:

- Confirm whether `хэрэглээний програм (апп)` should be the recommended dual form or whether
  OpenToli should prefer one formal canonical wording and list the other as an alternative.
- Validate Mongolian usage evidence for `апп` versus `програм`.
- Decide whether web application, mobile application, and desktop application need separate
  context-specific entries or translations.
- Record whether the internal route is useful calibration evidence; it does not control public
  feedback or publication.

## Review Rubric

For each generated draft, an editor should record the human outcome in
`/workspace/calibration`:

| Field | Record |
| --- | --- |
| Term | English headword |
| Job | Generation Job ID |
| Draft | AI Draft ID |
| Reference count | Optional background references used during preparation |
| Route | Review route after validation |
| Status | `needs_review`, `blocked`, `accepted`, `hidden`, or published outcome |
| Tokens | Input and output tokens |
| Latency | Milliseconds from the job |
| Cost | Provider-estimated cost when available |
| Recommendation quality | Acceptable, needs edit, wrong, or unusable |
| Human edits | Fields changed before publication |
| Reviewer notes | Naturalness, domain accuracy, ambiguity, and edit patterns |

The same page derives acceptance, edit, disagreement, cost, latency, and recommendation
metrics from those records. Its preliminary signal is descriptive only. The page cannot
make the final go/no-go decision, and reports `not ready` until all 50 outcomes exist.

## Stop Conditions

Pause the batch and inspect the pipeline if any of these happen:

- More than one job fails for the same validation reason.
- A job loses provider, prompt, schema, or supplied-reference provenance.
- A draft appears public, verified, or published without an explicit editor action.
- The critique repeatedly blocks drafts for the same prompt or schema weakness.
- Average latency or token usage is materially higher than the `authentication` reference run.

## M5 Done Criteria

M5 is done only when:

- All 50 terms have generated drafts or recorded failed outcomes.
- Each term has a human outcome recorded.
- Acceptance, edit, rejection, disagreement, duplicate, cost, and latency metrics exist.
- Prompt, schema, or routing changes are evaluated against the fixed set.
- A written go/no-go decision exists for future 100 to 200 term batches.

## Go/No-Go Decision Template

```markdown
## M5 Go/No-Go Decision

Date:
Model:
Prompt versions:
Schema version:
Terms processed:
Drafts accepted with no edit:
Drafts accepted with edits:
Drafts hidden or rejected:
Blocked drafts:
Average input tokens:
Average output tokens:
Average latency:
Estimated cost:
Common edit patterns:
Common failure patterns:
Decision: Go / Tune and retry / Stop
Reason:
```
