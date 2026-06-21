# OpenToli Project Status

**Last updated:** 2026-06-20
**Current milestone:** M1 - Application Foundation
**Milestone status:** `IN_PROGRESS`
**Delivery state:** Foundation implementation

## Executive Summary

OpenToli now has a buildable Next.js and Payload application, an initial public interface,
PostgreSQL configuration, CI, role-aware users, category and context collections, and an
idempotent category seed script. Static verification passes. Database-backed migrations,
seeding, and integration tests remain pending because the local Docker daemon could not
be started from the managed development session.

## Milestone Status

| ID | Milestone | Status | Evidence |
| --- | --- | --- | --- |
| M0 | Product and architecture baseline | `DONE` | ADR-0001 and ADR-0002 record the accepted baseline |
| M1 | Application foundation | `IN_PROGRESS` | Application builds; database verification and UI toolchain remain |
| M2 | Editorial data core | `PLANNED` | Users, Categories, and Contexts are started; complete term lifecycle remains |
| M3 | AI preparation pipeline | `PLANNED` | Workflow and provenance requirements are documented |
| M4 | Reviewer workspace | `PLANNED` | Review behavior is specified; no interface exists |
| M5 | Calibration batch | `PLANNED` | Target and sample ambiguous terms are documented |
| M6 | Public dictionary | `PLANNED` | Required pages are documented |
| M7 | Search and discovery | `PLANNED` | Ranking and filters are documented |
| M8 | Community contributions | `PLANNED` | Roles and contribution features are documented |
| M9 | Launch readiness | `PLANNED` | Launch content and quality gates are documented |

## Achievements

### 2026-06-20

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

| Check | Result | Evidence |
| --- | --- | --- |
| Payload type generation | Pass | `pnpm generate:types` |
| TypeScript | Pass | `pnpm typecheck` |
| ESLint | Pass | `pnpm lint` |
| Slug normalization tests | Pass | 2 tests in `formatSlug.int.spec.ts` |
| Production build | Pass | Next.js generated all current public and Payload routes |
| HTTP smoke test | Pass | `/` and `/search?q=authentication` returned `200` |
| Hydration smoke test | Pass | Clean Chrome profile produced no hydration warning |
| Database integration | Pending | Docker daemon unavailable in managed session |
| Visual browser QA | Pass | Desktop and mobile clean-Chrome renders inspected |

## Current Work

M1 still needs:

- Start PostgreSQL locally or connect an approved development database.
- Generate and apply the initial database migration.
- Run the category seed and database-backed integration test suite.
- Add Tailwind CSS and initialize the shared component system.
- Verify Payload admin and the public UI in a browser.

## Next Actions

1. Bring up PostgreSQL 17 and verify its health.
2. Generate the initial Payload migration and run the ten-category seed.
3. Run database-backed integration and admin tests.
4. Add Tailwind CSS and initialize the shared component system.
5. Complete browser accessibility and responsive checks.
6. Mark M1 `DONE` only after every roadmap exit criterion has evidence.

## Blockers

The installed Docker service is stopped and could not be started from the managed
development session. This blocks local migration, seed, and database integration checks.
Application compilation and static route verification are unaffected.

## Risks

| Risk | Impact | Current mitigation |
| --- | --- | --- |
| AI output sounds natural but is technically wrong | Loss of trust | Independent critique and domain review routes |
| AI pipeline cost grows during batch generation | Budget pressure | Calibration batch, idempotent jobs, and cost metrics |
| Conflicting status fields permit accidental publication | Data exposure | Formal publication state machine required in M0 |
| Search leaks drafts | Unreviewed content becomes public | Public-query and authorization tests required in M2 and M7 |
| Content work outpaces reviewer capacity | Large unreviewed backlog | Batches of 100 to 200 after calibration |

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
