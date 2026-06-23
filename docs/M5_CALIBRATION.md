# M5 Calibration Batch Runbook

## Purpose

M5 validates OpenToli's AI preparation quality and cost before larger corpus generation.
The batch is intentionally fixed, source-grounded, and reviewed by humans before any
canonical publication decision.

This milestone must not create automated publishing. M5 produces private AI drafts,
metrics, and review evidence.

## Artifacts

- Manifest: [`../data/calibration/m5-technology-software.json`](../data/calibration/m5-technology-software.json)
- Validator: [`../src/scripts/validateM5Calibration.ts`](../src/scripts/validateM5Calibration.ts)
- Prepare script: [`../src/scripts/prepareM5Calibration.ts`](../src/scripts/prepareM5Calibration.ts)
- Worker: [`../src/scripts/runAIWorker.ts`](../src/scripts/runAIWorker.ts)

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

Source references point to trusted concept sources such as MDN, GitHub Docs, Kubernetes
Docs, PostgreSQL Docs, NIST CSRC, and Microsoft Learn. They are concept-grounding sources;
AI output and editors must not copy source definitions verbatim.

## Preflight

Run the manifest validator before preparing jobs:

```powershell
npm run m5:validate
```

Expected result:

```text
M5 calibration manifest is valid
Terms: 50
Sources: 8
```

Confirm `.env` points at the intended provider before enqueueing jobs:

```powershell
Get-Content .env | Select-String "AI_PROVIDER|AI_MODEL"
```

Do not print or paste `AI_API_KEY`.

## Prepare Jobs

The prepare command creates or reuses private draft Terms, creates or reuses Source
records, and enqueues Generation Jobs. It does not call the AI provider and does not spend
API credit.

Prepare the first five terms:

```powershell
npm run m5:prepare -- --limit=5
```

Prepare the next ten after reviewing the first batch:

```powershell
npm run m5:prepare -- --offset=5 --limit=10
```

Prepare all remaining terms only after the first batches look healthy:

```powershell
npm run m5:prepare -- --offset=15 --all
```

## Process Jobs

Process one queued job at a time:

```powershell
npm run ai:work
```

Repeat only when the previous job has been inspected. The worker records provider,
model, prompt versions, token usage, latency, raw outputs, validation result, and retry
state in `Generation Jobs`.

## Review Rubric

For each generated draft, an editor should record:

| Field | Record |
| --- | --- |
| Term | English headword |
| Job | Generation Job ID |
| Draft | AI Draft ID |
| Source count | Number of source records used |
| Route | Review route after validation |
| Status | `needs_review`, `blocked`, `accepted`, `hidden`, or published outcome |
| Tokens | Input and output tokens |
| Latency | Milliseconds from the job |
| Cost | Provider-estimated cost when available |
| Recommendation quality | Acceptable, needs edit, wrong, or unusable |
| Human edits | Fields changed before publication |
| Reviewer notes | Naturalness, domain accuracy, source support, ambiguity |

## Stop Conditions

Pause the batch and inspect the pipeline if any of these happen:

- More than one job fails for the same validation reason.
- A job loses source, provider, prompt, or schema provenance.
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
