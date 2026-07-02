# Living Résumé Knowledge System

A file-based résumé knowledge system for Tyler Stahl. Raw professional facts live in structured YAML; tailored résumé outputs are generated from that source of truth.

> Raw facts go in once. Tailored résumé outputs are generated from those facts.

## Quick Start

```bash
npm install
npm run validate     # Check YAML data integrity
npm run generate     # Generate Markdown, HTML, PDF, and portfolio JSON
npm run generate:pdf # Regenerate just the PDF exports
npm run build        # validate + generate
npm test             # Run validation and generation tests
npm run intake:list  # See which docs/intake/*.md notes are still pending
npm run intake:log -- <filename> "<summary>"   # Mark a note as processed
npm run tailor -- <path-to-job-description.md>  # Generate a résumé tailored to a job description
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
- **Milestone 5:** Portfolio site integration (`tylerstahl.dev`)
- **Milestone 6:** Optional Google Doc sync

## For Coding Agents

Read `AGENTS.md` before making changes. Never invent claims. Preserve raw facts. Validate before generating. Keep changes small and reviewable.
