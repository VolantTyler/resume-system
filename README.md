# Living Résumé Knowledge System

A file-based résumé knowledge system for Tyler Stahl. Raw professional facts live in structured YAML; tailored résumé outputs are generated from that source of truth.

> Raw facts go in once. Tailored résumé outputs are generated from those facts.

## Quick Start

```bash
npm install
npm run validate     # Check YAML data integrity
npm run generate     # Generate Markdown, HTML, PDF, and portfolio JSON
npm run generate:pdf # Regenerate just the PDF exports
npm run generate:portfolio # Regenerate just output/portfolio/resume-content.json
npm run build        # validate + generate
npm test             # Run validation and generation tests
npm run intake:list  # See which docs/intake/*.md notes are still pending
npm run intake:log -- <filename> "<summary>"   # Mark a note as processed
npm run tailor -- <path-to-job-description.md>  # Generate a résumé tailored to a job description
npm run judge -- <path-to-job-description.md>   # Tailor, then LLM-judge + claim-safe revise
```

PDF export renders the print-ready HTML in a local headless Chrome via [`puppeteer-core`](https://pptr.dev/). It looks for Chrome/Chromium in common install locations, or you can point it at a specific binary with `PUPPETEER_EXECUTABLE_PATH` (or `CHROME_PATH`). If no browser is found, `npm run generate`/`npm run build` skip the PDF step with a warning rather than failing.

## Repository Structure

```txt
data/                    Source-of-truth YAML (profile, experience, accomplishments, etc.)
docs/                    Human-authored notes, intake files, and job descriptions
docs/job-descriptions/   Raw job description text used as input for tailoring
schemas/                 JSON Schema documentation for data shapes
templates/               Nunjucks templates for Markdown, HTML, portfolio JSON
scripts/                 Validation, generation, and tailoring TypeScript scripts
output/                  Generated résumés, tailored résumés, and portfolio content
tests/                   Vitest tests
AGENTS.md                Instructions for coding agents maintaining this system
```

## Workflow

### 1. Edit source data

Update YAML files in `data/`:

| File | Purpose |
|------|---------|
| `profile.yaml` | Name, headline, links, summary variants |
| `experience.yaml` | Employment history with accomplishment references |
| `accomplishments.yaml` | Atomic résumé evidence with bullet variants |
| `projects.yaml` | Notable projects |
| `skills.yaml` | Skills grouped by category |
| `resume_targets.yaml` | Target role definitions and emphasis |
| `resume_versions.yaml` | Curated résumé versions and selected content |

Each accomplishment stores:

- `raw_fact` — unpolished source truth
- `resume_bullets` — role-specific polished variants (`standard`, `frontend`, `qa`, `nonprofit`, etc.)
- `evidence`, `confidence`, `target_roles`

### 2. Validate

```bash
npm run validate
```

Validation checks:

- Required fields and unique IDs
- Cross-references between experience, projects, accomplishments, and versions
- Summary variant references exist
- Résumé versions have enough content to generate

### 3. Generate outputs

```bash
npm run generate
```

Every curated résumé version is **judged before it is finalized**: the generator renders a draft, runs the LLM-as-judge loop against that version's target emphasis, applies claim-safe revisions if needed, appends a row to `docs/judge-log.md`, and only then keeps the final `.md` / `.html`.

- With `RESUME_JUDGE_API_KEY` / `OPENAI_API_KEY`: live OpenAI-compatible judge
- Without a key: automatic stub judge (still logs rounds/changes)
- Escape hatch: `RESUME_JUDGE=off` skips judging and renders once

This produces, per résumé version defined in `resume_versions.yaml`:

```txt
output/resumes/tyler-stahl-frontend-engineer.md
output/resumes/tyler-stahl-frontend-engineer.html
output/resumes/tyler-stahl-frontend-engineer.pdf
output/resumes/tyler-stahl-nonprofit-tech.md
output/resumes/tyler-stahl-nonprofit-tech.html
output/resumes/tyler-stahl-nonprofit-tech.pdf
output/resumes/tyler-stahl-portfolio.md
output/resumes/tyler-stahl-portfolio.html
output/resumes/tyler-stahl-portfolio.pdf
output/portfolio/resume-content.json
```

Role-specific bullet selection uses each target's `bullet_variant` from `resume_targets.yaml`. The same atomic accomplishment can render different bullets for frontend vs. nonprofit résumés.

The PDF is a direct render of the `.html` output's `@media print` styles — edit `templates/resume.html.njk` to change how either one looks.

### 4. Add and process intake notes

Drop raw notes in `docs/intake/` as Markdown files named `YYYY-MM-DD-slug.md`. Then either run the intake workflow yourself or ask an agent to.

Check what's pending:

```bash
npm run intake:list
```

This diffs `docs/intake/*.md` against `docs/intake-log.md` and prints any notes that haven't been reflected in the YAML data yet, along with next steps.

Ask an agent to process a pending note:

```txt
Read AGENTS.md and the resume data files. Process the newest intake note.
Propose YAML updates, generate updated résumé outputs, and explain what changed.
```

Once the YAML updates are made and `npm run build` passes, mark the note as processed:

```bash
npm run intake:log -- 2026-07-02-some-note.md "Short summary of what changed."
```

`intake:log` appends a row to `docs/intake-log.md` and re-validates the résumé data so the log only ever reflects notes that are actually reflected in YAML. See `docs/intake/2026-06-29-example-update.md` for an example note already reflected in starter data.

### 5. Tailor a résumé to a job description

Drop the job description text as a Markdown or plain-text file anywhere (conventionally `docs/job-descriptions/`), then run:

```bash
npm run tailor -- docs/job-descriptions/some-role.md
```

This does not invent anything — it deterministically matches the job description's text against known terms already present in the résumé data (skill names/aliases, accomplishment themes/technologies, and target emphasis) to:

- Recommend the best-fitting `resume_target` (scored by matched emphasis, linked accomplishments, and linked skills).
- Rank that target's linked accomplishments by relevance and include the most relevant ones first.
- Emphasize skills that were actually mentioned in the job description.
- Flag "possible gaps" — reference terms (e.g. `React`, `WCAG`, `AWS`, `Go`, `customer discovery`) mentioned in the JD but not currently reflected anywhere in the résumé data. This is informational only; it never claims Tyler lacks a skill, only that it isn't documented yet.
- **Optionally interview about gaps** — on a TTY, tailor offers an interactive Q&A; confirmed answers are written into `data/` (`confidence: medium`) and an intake transcript. Force with `--interview-gaps`, skip with `--skip-interview`, or run `npm run interview-gaps -- <jd>` alone.
- **Finalize through the same judge loop as `npm run generate`** (unless `--skip-judge`), so critiques can reorder/emphasize before the tailored files are saved.

Output goes to `output/resumes/tailored/`:

- `tailored-<slug>.md` / `.html` — the tailored résumé, rendered with the same templates as every other résumé version.
- `tailored-<slug>-match-report.md` — the target ranking, matched terms, selected accomplishments, and possible gaps.

Optional flags: `--target <target-id>` to override the recommended target, `--label "Custom Label"`, `--slug custom-output-slug`, `--interview-gaps`, `--skip-interview`.

### 6. Judge and revise (built into generate + tailor)

The LLM-as-judge finalize step is **automatic** in:

- `npm run generate` / `npm run build` — every curated résumé version
- `npm run tailor` — every tailored résumé (use `--skip-judge` to bypass)

On-demand (same shared loop):

```bash
npm run judge -- docs/job-descriptions/some-role.md
npm run judge -- docs/job-descriptions/some-role.md --stub
```

Flow inside generation/tailoring:

1. Build/select the résumé version (YAML curation or deterministic tailor)
2. Render a draft
3. Judge scores relevance, evidence alignment, coverage, and clarity; produces application-fit analysis and revision directives
4. Claim-safe reviser reorders accomplishments / adjusts skill emphasis / attaches `application_fit` when appropriate — never invents bullets, metrics, employers, or technologies
5. Repeat until pass or max rounds, then save the final résumé
6. Append a summary row to `docs/judge-log.md` and write a detail file under `output/judge-runs/`

Environment:

| Variable | Purpose |
|----------|---------|
| `RESUME_JUDGE_API_KEY` or `OPENAI_API_KEY` | OpenAI-compatible API key (live judge) |
| `RESUME_JUDGE_BASE_URL` / `OPENAI_BASE_URL` | API base URL (default `https://api.openai.com/v1`) |
| `RESUME_JUDGE_MODEL` / `OPENAI_MODEL` | Model id (default `gpt-4o-mini`) |
| `RESUME_JUDGE=stub` | Force stub judge |
| `RESUME_JUDGE=off` | Skip judge (render only) |
| `RESUME_JUDGE_MAX_ROUNDS` | Max revise rounds (default `2`) |
| `RESUME_JUDGE_PASS_SCORE` | Pass threshold (default `7`) |

Look back later in `docs/judge-log.md` (rounds, scores, changes demanded) and `output/judge-runs/` (per-run detail).

### 7. Portfolio site integration

`output/portfolio/resume-content.json` is generated from a dedicated `portfolio-v1`
résumé version (`target_id: portfolio-focused`) so it's driven by an intentional
selection of content rather than reusing another résumé's version by coincidence.
Its shape is documented at `schemas/portfolio.schema.json`.

See `docs/portfolio-integration.md` for the recommended way for `tylerstahl.dev` (or
any other portfolio site) to consume this file — this repo does not push to the site
directly.

## Design Principles

1. **Source data is separate from generated outputs** — never edit `output/` by hand.
2. **Accomplishments are atomic** — store raw facts and multiple bullet variants, not just final copy.
3. **No invented claims** — if a metric is missing, keep statements qualitative.
4. **Reproducible generation** — any output can be regenerated from YAML + templates.
5. **Agent-friendly** — `AGENTS.md` documents rules for future maintenance.

## Tech Stack

- TypeScript
- [yaml](https://eemeli.org/yaml/) — YAML parsing
- [zod](https://zod.dev/) — runtime validation
- [nunjucks](https://mozilla.github.io/nunjucks/) — template rendering
- [vitest](https://vitest.dev/) — tests

## Future Milestones

- ~~**Milestone 2:** Intake workflow script for `docs/intake/*.md`~~ — done (`npm run intake:list` / `npm run intake:log`)
- ~~**Milestone 3:** PDF export via print-ready HTML~~ — done (`npm run generate:pdf`, via `puppeteer-core`)
- ~~**Milestone 4:** Job description tailoring~~ — done (`npm run tailor -- <job-description.md>`)
- ~~**Milestone 5:** Portfolio site integration (`tylerstahl.dev`)~~ — done on this repo's side (dedicated `portfolio-focused` version, documented JSON contract, `npm run generate:portfolio`); see `docs/portfolio-integration.md` for how `tylerstahl.dev` should consume it
- ~~**Milestone 6:** LLM-as-judge evaluation + claim-safe revision loop~~ — done (`npm run judge`)
- **Milestone 7:** Optional Google Doc sync

## For Coding Agents

Read `AGENTS.md` before making changes. Never invent claims. Preserve raw facts. Validate before generating. Keep changes small and reviewable.
