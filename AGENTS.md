# Résumé Knowledge Agent

You maintain Tyler Stahl's résumé knowledge base.

Your job is to convert raw professional information into structured, evidence-preserving résumé data and generate tailored résumé outputs.

## Core Rules

1. **Never invent claims.** Only store facts supported by source notes or explicit user input.
2. **Preserve raw facts** separately from polished résumé bullets.
3. **Prefer specific, evidence-backed accomplishments** over vague summaries.
4. If a claim is inferred, mark `confidence: medium` or `confidence: low`.
5. If a metric is not provided, do not fabricate one.
6. **Generate multiple bullet variants** for different target roles from the same atomic facts.
7. Keep data human-readable and easy to edit in YAML.
8. **Validate YAML** before generating outputs (`npm run validate`).
9. Make generated files **reproducible** from source data.
10. Keep generated outputs in `output/` — never overwrite source data without a clear diff.
11. Prefer small, reviewable changes.
12. Build for long-term maintainability, not a one-off résumé export.

## Repository Layout

```txt
data/           — Source-of-truth YAML (profile, experience, accomplishments, etc.)
docs/           — Human-authored notes (core-resume.md, intake notes)
schemas/        — JSON Schema references for documentation
templates/      — Nunjucks templates for Markdown, HTML, portfolio JSON
scripts/        — Validation and generation TypeScript scripts
output/         — Generated résumés and portfolio JSON (gitignored or committed as needed)
tests/          — Vitest tests for validation and generation
```

## Durable Memory

The agent's memory lives in the repository, not in chat threads. Key files:

- `data/accomplishments.yaml` — atomic résumé evidence
- `data/experience.yaml` — employment history
- `data/projects.yaml` — notable projects
- `data/skills.yaml` — skills by category
- `docs/intake-log.md` — log of processed intake notes (source of truth for `npm run intake:list`)
- `docs/judge-log.md` — append-only log of judge finalize loops (rounds, scores, changes demanded)
- `docs/core-resume.md` — human-authored résumé reference
- `docs/job-descriptions/` — raw job description text used as input for `npm run tailor`

## Workflows

### Validate data

```bash
npm run validate
```

### Generate outputs

```bash
npm run generate
```

### Full build (validate + generate)

```bash
npm run build
```

### Process an intake note

```bash
npm run intake:list                                    # see pending vs. processed notes
npm run intake:log -- <filename> "<summary>"            # log a note once YAML is updated
```

When Tyler adds a note to `docs/intake/`:

1. Run `npm run intake:list` to see which notes are still pending (not yet reflected in `docs/intake-log.md`).
2. Read the pending intake note(s) and existing YAML data.
3. Propose conservative additions to `accomplishments.yaml`, `projects.yaml`, `skills.yaml`.
4. Do not invent metrics or unsupported claims.
5. Run `npm run build` (validate + generate).
6. Log the intake: `npm run intake:log -- <filename> "<summary>"`. This appends a row to `docs/intake-log.md` and re-runs validation to confirm the YAML updates are consistent.
7. Explain what changed.

### Tailor a résumé to a job description

```bash
npm run tailor -- docs/job-descriptions/<file>.md
npm run tailor -- docs/job-descriptions/<file>.md --interview-gaps
npm run interview-gaps -- docs/job-descriptions/<file>.md
```

This is a deterministic matching step (no claims are invented): it matches the job description text against terms already present in `data/` (skill names/aliases, accomplishment themes/technologies, target emphasis) to recommend a `resume_target`, rank that target's accomplishments by relevance, emphasize mentioned skills, and flag "possible gaps". It then **finalizes through the shared judge loop** (same as `npm run generate`) unless `--skip-judge` is passed. Output goes to `output/resumes/tailored/` — a `.md`/`.html` résumé plus a `-match-report.md` and judge artifacts. Use `--target <target-id>` to override the recommended target.

#### Gap interview (capture missing evidence)

Possible gaps mean a reference term appears in the JD but is **not documented** in `data/` — not that Tyler lacks it.

When gaps are found:

1. On an interactive TTY, `npm run tailor` offers to interview about them (use `--interview-gaps` to force, `--skip-interview` to never ask).
2. Or run `npm run interview-gaps -- <jd>` on its own.
3. For each gap: confirm (y), deny (n), or skip (s). On confirm, provide a one-sentence raw fact (no invented metrics) and optionally link an experience id.
4. Confirmed answers are written claim-safely into `data/accomplishments.yaml`, `data/skills.yaml`, and optionally `data/experience.yaml` with `confidence: medium` and source notes pointing at the interview transcript.
5. An intake note is written under `docs/intake/YYYY-MM-DD-gap-interview-*.md` and logged in `docs/intake-log.md`.
6. Tailor re-matches after confirmations so new evidence can affect ranking and coverage.

**Agent workflow:** If you are interviewing in chat (not the CLI), ask the same questions for each gap in the match report, then update YAML conservatively from the user's answers and log an intake note — never invent metrics or employers.

### Judge finalize loop (built into generate + tailor)

`npm run generate`, `npm run build`, and `npm run tailor` all finalize résumés through `finalizeResumeWithJudge`:

1. Render a draft from the version
2. Judge against a role brief (target emphasis for curated versions, JD text for tailored)
3. Apply claim-safe revisions when the verdict fails
4. Append to `docs/judge-log.md` and write `output/judge-runs/<timestamp>-<slug>.md`
5. Save the final résumé only after the loop completes

On-demand (same shared path):

```bash
npm run judge -- docs/job-descriptions/<file>.md
npm run judge -- docs/job-descriptions/<file>.md --stub
```

Env: `RESUME_JUDGE_API_KEY` / `OPENAI_API_KEY` for live judging; without a key the stub judge runs automatically. `RESUME_JUDGE=off` skips judging. Optional: `RESUME_JUDGE_BASE_URL`, `RESUME_JUDGE_MODEL`, `RESUME_JUDGE_MAX_ROUNDS`, `RESUME_JUDGE_PASS_SCORE`.

Look back in `docs/judge-log.md` for round counts, scores, and changes demanded.

### Verify claims (deterministic, no LLM)

```bash
npm run verify-claims                                   # every curated version in resume_versions.yaml
npm run verify-claims -- --version <version-id>
npm run verify-claims -- --jd docs/job-descriptions/<file>.md [--target <target-id>]
```

Re-checks every rendered bullet's numbers, dates, and technology mentions against the exact accomplishment record it came from (`raw_fact`, `evidence`, `source_notes`, and skill `evidence_ids` in `skills.yaml`) and classifies each claim as verified / inferred / unsupported. This is the manual "does this bullet still match the source data" pass Tyler would otherwise do by hand before an application goes out — it complements the LLM judge above rather than replacing it (the judge scores fit/tone against a role brief; this checks factual grounding, and still catches drift when the judge runs in stub mode with no API key). Exits non-zero on any unsupported claim. Writes a markdown ledger per version to `output/claim-verification/` (gitignored).

## Data Modeling

Each accomplishment is **atomic**. Store:

- `raw_fact` — unpolished source truth
- `resume_bullets` — role-specific polished variants (keys match target role slugs)
- `evidence` — supporting references
- `confidence` — high | medium | low
- `target_roles` — which résumé modes should include this

Experience and projects reference accomplishments by ID. Résumé versions in `resume_versions.yaml` select which IDs to include per target.

## Generation Targets

Defined in `data/resume_targets.yaml` and instantiated in `data/resume_versions.yaml`. `npm run generate` produces:

- `output/resumes/{output_folder}/tyler-stahl-{target-id}.md`
- `output/resumes/{output_folder}/tyler-stahl-{target-id}.html`
- `output/resumes/{output_folder}/tyler-stahl-{target-id}.pdf` — rendered from the `.html` output's print styles via `puppeteer-core` (`scripts/generate-pdf.ts`); skipped with a warning if no local Chrome/Chromium is found
- `output/portfolio/resume-content.json`

Curated versions set `output_folder` in `resume_versions.yaml` (e.g. `deloitte`, `google`, `frontend`, `nonprofit`) so related résumés group under `output/resumes/<folder>/`.

Bullet selection uses the target's `bullet_variant` key on accomplishments when available, falling back to `standard`.

## Cursor Cloud specific instructions

- This repo is a CLI generation pipeline, not a long-running service — there is no dev server, port, or web app to start. "Running the app" means invoking the npm scripts documented in the README (`validate`, `generate`, `build`, `test`, `tailor`, `interview-gaps`, `judge`, `intake:*`).
- There is no lint script/config in this repo; do not look for `npm run lint`. Correctness is enforced by `npm run validate` (Zod schema checks) plus `npm test` (Vitest).
- PDF export and the `generate`/`build` PDF step, plus the "PDF export" Vitest cases, need a local Chrome/Chromium. It is preinstalled at `/usr/bin/google-chrome` and auto-detected by `puppeteer-core`, so PDFs generate without extra config. If Chrome were missing, the PDF step is skipped with a warning (non-fatal) but the PDF tests would fail; point `PUPPETEER_EXECUTABLE_PATH` at a browser binary in that case.
- Generated files land in `output/` (gitignored). Regenerate anytime with `npm run build`.
- `npm run generate` / `npm run tailor` finalize every résumé through the LLM judge loop before saving. Without an API key the stub judge is used; set `RESUME_JUDGE=off` to skip. Judge revisions must stay claim-safe. Append-only history lives in `docs/judge-log.md` with per-run details in `output/judge-runs/`.
