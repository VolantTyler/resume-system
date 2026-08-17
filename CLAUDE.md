# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A file-based résumé knowledge system for Tyler Stahl. Raw professional facts live as structured YAML in `data/`; every résumé file (Markdown, HTML, PDF) and the portfolio JSON are generated from that source of truth via TypeScript scripts + Nunjucks templates. `AGENTS.md` is the canonical agent-instructions file (Core Rules, Durable Memory, Workflows) — read it before making changes; this file covers commands and architecture.

## Commands

```bash
npm run validate            # Zod-schema + cross-reference checks on data/*.yaml (no lint script exists)
npm run generate            # Render all résumé versions + portfolio JSON + PDFs (judged)
npm run generate:pdf        # Regenerate just the PDF exports (needs local Chrome/Chromium)
npm run generate:portfolio  # Regenerate just output/portfolio/resume-content.json
npm run build                # validate && generate
npm test                     # vitest run (all tests)
npx vitest run tests/judge.test.ts        # single test file
npx vitest run -t "test name substring"   # single test by name
npm run intake:list                        # pending vs. processed docs/intake/*.md notes
npm run intake:log -- <filename> "<summary>"
npm run tailor -- docs/job-descriptions/<file>.md [--target <id>] [--interview-gaps|--skip-interview] [--skip-judge]
npm run interview-gaps -- docs/job-descriptions/<file>.md
npm run judge -- docs/job-descriptions/<file>.md [--stub]
```

PDF export uses `puppeteer-core` against a local Chrome/Chromium (auto-detected, or set `PUPPETEER_EXECUTABLE_PATH`/`CHROME_PATH`). If none is found, the PDF step is skipped with a non-fatal warning during `generate`/`build`.

This is a CLI generation pipeline, not a service — there's no dev server to run.

## Architecture

**Data flow:** `data/*.yaml` (source of truth) → validated by `scripts/lib/schemas.ts` (Zod) → loaded by `scripts/lib/load-data.ts` → selected into a `ResumeVersion` → rendered through `templates/*.njk` → **finalized through a shared judge loop** → written to `output/`.

### Data model (`data/`)

- `profile.yaml`, `experience.yaml`, `projects.yaml`, `skills.yaml` — facts.
- `accomplishments.yaml` — the atomic unit. Each entry has `raw_fact` (unpolished truth), `resume_bullets` (per-target-role polished variants keyed by `bullet_variant`, e.g. `standard`/`frontend`/`qa`/`nonprofit`), `evidence`, `confidence` (high/medium/low), `target_roles`.
- `resume_targets.yaml` — target role definitions (emphasis, `bullet_variant` key).
- `resume_versions.yaml` — curated résumés: which accomplishment/project/experience IDs to include per target, `output_folder` (groups related résumés under `output/resumes/<folder>/`, e.g. `deloitte`, `google`, `frontend`, `nonprofit`).

Experience/projects reference accomplishments by ID; résumé versions select which IDs to include. Never edit `output/` by hand — it's fully regenerable from `data/` + templates. `npm run intake:log` and the tailor/gap-interview flows are the sanctioned ways YAML gets updated by an agent; never invent metrics, employers, dates, or technologies.

### Script layout (`scripts/`)

Entry points (`npm run <script>`) are thin `main()` wrappers; real logic lives in `scripts/lib/`:

- `lib/schemas.ts` / `lib/validate.ts` — Zod schemas and cross-reference validation (unique IDs, references resolve, versions have enough content).
- `lib/load-data.ts`, `lib/paths.ts` — load + validate YAML; central path constants (`DATA_FILES`, `TEMPLATE_FILES`, output dirs). Always import paths from here rather than hardcoding.
- `generate-resume.ts` — renders curated `resume_versions.yaml` entries with Nunjucks (`templates/resume.md.njk` / `resume.html.njk`).
- `lib/build-resume-context.ts` — assembles the template context (selects accomplishments/bullets/skills for a version).
- `generate-pdf.ts` / `lib/chrome.ts` / `lib/pdf.ts` — headless-Chrome render of the HTML output's `@media print` styles.
- `generate-portfolio-json.ts` — renders `templates/portfolio.json.njk` from the dedicated `portfolio-focused` target into `output/portfolio/resume-content.json` (shape documented in `schemas/portfolio.schema.json`; consumed externally by `tylerstahl.dev`, see `docs/portfolio-integration.md`).
- `lib/tailor.ts` / `tailor-resume.ts` — deterministic JD matching: scores `resume_targets` by matched emphasis/accomplishments/skills, ranks accomplishments by relevance, emphasizes mentioned skills, flags "possible gaps" (terms in the JD not yet documented in `data/` — informational, not a claim of missing skill). Writes to `output/resumes/tailored/`.
- `lib/gap-interview.ts` / `gap-interview-session.ts` / `interview-gaps.ts` / `lib/persist-gap-evidence.ts` — interactive Q&A over tailor's "possible gaps"; confirmed answers are written claim-safely into `data/` (`confidence: medium`, sourced to the interview transcript) and logged as an intake note under `docs/intake/`.
- `lib/judge.ts`, `lib/revise.ts`, `lib/finalize-resume.ts`, `lib/judge-log.ts`, `lib/role-brief.ts`, `lib/llm.ts`, `judge-resume.ts` — the shared judge/revise loop (see below).
- `lib/intake.ts` / `process-intake.ts` — diffs `docs/intake/*.md` against `docs/intake-log.md` to report pending notes; `log` subcommand appends a row and re-validates.

### The judge/revise loop

`finalizeResumeWithJudge` (`scripts/lib/finalize-resume.ts`) is the shared path used by `generate`, `tailor`, and the standalone `judge` command — final files are only written after the loop completes:

1. Render a draft (markdown/html) for the current version.
2. Judge it (`lib/judge.ts`) against a `RoleBrief` (target emphasis for curated versions, JD text for tailored) — scores relevance/evidence/coverage/clarity, returns a verdict + revision directives.
3. If it fails and rounds remain, `lib/revise.ts` applies a **claim-safe** revision (reorder accomplishments, adjust skill emphasis, attach `application_fit`) — never invents bullets, metrics, employers, or technologies — and loops.
4. Append a row to `docs/judge-log.md` and write per-run detail to `output/judge-runs/<timestamp>-<slug>.md`.
5. Save the final résumé only once the loop terminates (pass, or max rounds exhausted).

Judge mode resolution (`resolveJudgeMode`): live LLM if `RESUME_JUDGE_API_KEY`/`OPENAI_API_KEY` is set, otherwise an automatic stub judge (still logs rounds/changes); `RESUME_JUDGE=off` skips judging entirely and renders once. Other env vars: `RESUME_JUDGE_BASE_URL`/`OPENAI_BASE_URL`, `RESUME_JUDGE_MODEL`/`OPENAI_MODEL` (default `gpt-4o-mini`), `RESUME_JUDGE_MAX_ROUNDS` (default 2), `RESUME_JUDGE_PASS_SCORE` (default 7). The LLM client (`scripts/lib/llm.ts`) is a minimal fetch-based OpenAI-compatible client (no SDK dependency) — works with OpenAI, OpenRouter, Groq, Azure, or local proxies.

### Output (`output/`)

Committed to git (only `output/debug/` is gitignored — scratch JSON dumps of judge rounds). Regenerate anytime with `npm run build`; never hand-edit. Layout: `output/resumes/<output_folder>/<slug>.{md,html,pdf}` for curated versions, `output/resumes/tailored/` for JD-tailored runs (plus `-match-report.md`), `output/portfolio/resume-content.json`, `output/judge-runs/`.

### Validation (`schemas/*.json`)

JSON Schema files exist for documentation/external consumers; the actual enforcement at runtime is the Zod schemas in `scripts/lib/schemas.ts`, run via `npm run validate`.

## Conventions

- Never invent claims, metrics, employers, or technologies — this applies to hand-edits, tailor, gap-interview persistence, and judge revisions alike. If a metric is missing, keep it qualitative and mark `confidence: medium`/`low`.
- Source data (`data/`) and generated output (`output/`) are strictly separate; only ever regenerate the latter.
- Keep changes small and reviewable; run `npm run build` after any `data/` edit to confirm it's still consistent and regenerates cleanly.
- When Tyler drops a note in `docs/intake/`, use `npm run intake:list` to see what's pending, propose conservative YAML additions, `npm run build`, then `npm run intake:log -- <filename> "<summary>"` to close the loop (this also re-validates).
- `.cursor/rules/tailored-resume-fit-analysis.mdc` (applies to Cursor, but the intent applies here too): when tailoring a résumé to a JD, always include a short fit analysis (2–3 strongest JD criteria with a resume-section pointer, 2–3 weakest with how the background addresses them indirectly), and interview the user about any "possible gaps" before treating them as real weaknesses.
- No lint script/config exists in this repo — correctness is enforced by `npm run validate` (Zod) and `npm test` (Vitest); don't look for `npm run lint`.
- CI (`.github/workflows/ci.yml`) runs `npm run validate && npm test` on push to `main` and on PRs — mirror that before considering work done.
