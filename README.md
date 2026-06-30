# Living Résumé Knowledge System

A file-based résumé knowledge system for Tyler Stahl. Raw professional facts live in structured YAML; tailored résumé outputs are generated from that source of truth.

> Raw facts go in once. Tailored résumé outputs are generated from those facts.

## Quick Start

```bash
npm install
npm run validate   # Check YAML data integrity
npm run generate   # Generate Markdown, HTML, and portfolio JSON
npm run build      # validate + generate
npm test           # Run validation and generation tests
```

## Repository Structure

```txt
data/              Source-of-truth YAML (profile, experience, accomplishments, etc.)
docs/              Human-authored notes and intake files
schemas/           JSON Schema documentation for data shapes
templates/         Nunjucks templates for Markdown, HTML, portfolio JSON
scripts/           Validation and generation TypeScript scripts
output/            Generated résumés and portfolio content
tests/             Vitest tests
AGENTS.md          Instructions for coding agents maintaining this system
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

Milestone 1 produces:

```txt
output/resumes/tyler-stahl-frontend-engineer.md
output/resumes/tyler-stahl-frontend-engineer.html
output/resumes/tyler-stahl-nonprofit-tech.md
output/resumes/tyler-stahl-nonprofit-tech.html
output/portfolio/resume-content.json
```

Role-specific bullet selection uses each target's `bullet_variant` from `resume_targets.yaml`. The same atomic accomplishment can render different bullets for frontend vs. nonprofit résumés.

### 4. Add intake notes (Milestone 2+)

Drop raw notes in `docs/intake/` and ask an agent:

```txt
Read AGENTS.md and the resume data files. Process the newest intake note.
Propose YAML updates, generate updated résumé outputs, and explain what changed.
```

See `docs/intake/2026-06-29-example-update.md` for an example note already reflected in starter data.

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

- **Milestone 2:** Intake workflow script for `docs/intake/*.md`
- **Milestone 3:** PDF export via print-ready HTML
- **Milestone 4:** Job description tailoring
- **Milestone 5:** Portfolio site integration (`tylerstahl.dev`)
- **Milestone 6:** Optional Google Doc sync

## For Coding Agents

Read `AGENTS.md` before making changes. Never invent claims. Preserve raw facts. Validate before generating. Keep changes small and reviewable.
