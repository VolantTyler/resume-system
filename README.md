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

This does not call an LLM or invent anything — it deterministically matches the job description's text against known terms already present in the résumé data (skill names/aliases, accomplishment themes/technologies, and target emphasis) to:

- Recommend the best-fitting `resume_target` (scored by matched emphasis, linked accomplishments, and linked skills).
- Rank that target's linked accomplishments by relevance and include the most relevant ones first.
- Emphasize skills that were actually mentioned in the job description.
- Flag "possible gaps" — reference terms (e.g. `React`, `WCAG`, `AWS`) mentioned in the JD but not currently reflected anywhere in the résumé data. This is informational only; it never claims Tyler lacks a skill, only that it isn't documented yet.

Output goes to `output/resumes/tailored/`:

- `tailored-<slug>.md` / `.html` — the tailored résumé, rendered with the same templates as every other résumé version.
- `tailored-<slug>-match-report.md` — the target ranking, matched terms, selected accomplishments, and possible gaps.

Optional flags: `--target <target-id>` to override the recommended target, `--label "Custom Label"`, and `--slug custom-output-slug`.

### 6. Judge and revise (LLM-as-judge)

After tailoring, you can run an evaluation loop that reads the produced résumé and sends critiques back for claim-safe revision:

```bash
npm run judge -- docs/job-descriptions/some-role.md
npm run judge -- docs/job-descriptions/some-role.md --stub   # offline, no API key
```

Flow:

1. Deterministic tailor (same as `npm run tailor`)
2. Render the résumé
3. LLM judge scores relevance, evidence alignment, coverage, and clarity; produces application-fit analysis and revision directives
4. Claim-safe reviser reorders accomplishments / adjusts skill emphasis / attaches `application_fit` — it never invents bullets, metrics, employers, or technologies
5. Repeat until pass or `--max-rounds` (default 2)

Environment:

| Variable | Purpose |
|----------|---------|
| `RESUME_JUDGE_API_KEY` or `OPENAI_API_KEY` | OpenAI-compatible API key (required unless `--stub`) |
| `RESUME_JUDGE_BASE_URL` / `OPENAI_BASE_URL` | API base URL (default `https://api.openai.com/v1`) |
| `RESUME_JUDGE_MODEL` / `OPENAI_MODEL` | Model id (default `gpt-4o-mini`) |

Additional outputs: `tailored-<slug>-judge-round-N.md` plus optional debug JSON under `output/debug/`.

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
