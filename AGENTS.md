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
```

This is a deterministic, non-LLM matching step (no claims are invented): it matches the job description text against terms already present in `data/` (skill names/aliases, accomplishment themes/technologies, target emphasis) to recommend a `resume_target`, rank that target's accomplishments by relevance, emphasize mentioned skills, and flag "possible gaps" (reference terms in the JD not yet reflected in the résumé data). Output goes to `output/resumes/tailored/` — a `.md`/`.html` résumé plus a `-match-report.md`. Use `--target <target-id>` to override the recommended target.

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

- `output/resumes/tyler-stahl-{target-id}.md`
- `output/resumes/tyler-stahl-{target-id}.html`
- `output/resumes/tyler-stahl-{target-id}.pdf` — rendered from the `.html` output's print styles via `puppeteer-core` (`scripts/generate-pdf.ts`); skipped with a warning if no local Chrome/Chromium is found
- `output/portfolio/resume-content.json`

Bullet selection uses the target's `bullet_variant` key on accomplishments when available, falling back to `standard`.

## Cursor Cloud specific instructions

- This repo is a CLI generation pipeline, not a long-running service — there is no dev server, port, or web app to start. "Running the app" means invoking the npm scripts documented in the README (`validate`, `generate`, `build`, `test`, `tailor`, `intake:*`).
- There is no lint script/config in this repo; do not look for `npm run lint`. Correctness is enforced by `npm run validate` (Zod schema checks) plus `npm test` (Vitest).
- PDF export and the `generate`/`build` PDF step, plus the "PDF export" Vitest cases, need a local Chrome/Chromium. It is preinstalled at `/usr/bin/google-chrome` and auto-detected by `puppeteer-core`, so PDFs generate without extra config. If Chrome were missing, the PDF step is skipped with a warning (non-fatal) but the PDF tests would fail; point `PUPPETEER_EXECUTABLE_PATH` at a browser binary in that case.
- Generated files land in `output/` (gitignored). Regenerate anytime with `npm run build`.
