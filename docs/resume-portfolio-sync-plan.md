# Resume → Portfolio Sync Plan

Wiring [`VolantTyler/resume-system`](https://github.com/VolantTyler/resume-system) to
[`VolantTyler/portfolio`](https://github.com/VolantTyler/portfolio) so a new project, credential, or
role is entered once in YAML and flows to `tylerstahl.dev` through a reviewed pull request.

Status: **planned, not yet implemented.** Last updated 2026-08-13.

> This document is kept in both repos. Edit one copy and copy it across — the two should stay
> identical.

---

## Architecture

The resume system already generates `output/portfolio/resume-content.json` and commits it to a public
repo. Because it is public, this repo can pull it with **no shared credential** — the workflow runs
inside the repo it modifies, using the built-in `GITHUB_TOKEN`.

```
resume-system          resume-system         portfolio · CI        portfolio · CI       vercel
edit YAML       →      generate JSON    →    pull & render   →     open PR        →     preview,
add project,           committed to          cron or manual        built-in token       then merge
role, or skill         main, public          trigger               no secrets           you approve
```

### Why committed HTML, not a runtime fetch

The render step commits rendered HTML so Vercel keeps serving static files. A client-side `fetch()`
would populate the resume after page load, hiding it from the recruiters and crawlers the site
exists to reach.

---

## Scope

| Generated | Hand-authored |
| --- | --- |
| Project cards | Hero and section copy |
| Experience timeline | The Claim/Evidence/Artifact matrix |
| Filterable skills | The Agent-Ready Portfolio card + its live `<iframe>` preview |
| `agents.json`, `agents.md` | |

---

## Decisions — locked

### Which projects appear

| Project | Site | Note |
| --- | --- | --- |
| `cognitive-bridge` | **featured** | Keeps the large block; duplicate card removed |
| `openclaw-multi-agent-ecosystem` | show | Flag flips to true |
| `insummery-ai` | show | Card keeps its descriptive title |
| `agentos-chief-of-staff` | show | Also needs adding to `project_ids` |
| `development-knowledge-vault` | **new card** | The only addition to the live site |
| `glen-rock-ai-guild` | hide | Was flagged true; turning off |
| `stack-overlord` | hide | Held back as the pipeline test |
| `hybrid-inference-pilot` | hide | Strategy, not a shippable artifact |
| `iblueprint-embeddings` | hide | In progress |
| `nami-*`, `ccie-tm-*`, `cn-*` | hide | Six entries; stay as employment history |

### What visibly changes on tylerstahl.dev

| Area | Change | Why |
| --- | --- | --- |
| Project cards | +1 / −1 | Development Knowledge Vault added; duplicate Cognitive Bridge card removed |
| Experience timeline | 4 → 5 | Charity Navigator splits into two roles, surfacing the promotion |
| Volant Web Design | re-dated | Now 2017–2019 only; the 2024–present stint leaves the record entirely |
| Scale metrics | unchanged on site | YAML rises to match 11M+ users and 50,000+ clients |
| Skills | new section | Currently renders zero items; becomes chips filtering 48 skills by facet |

---

## Milestone 0 — Reconcile the data

**Repo:** `resume-system`. Changes nothing public.

- Set `portfolio_visible` across all fifteen projects per the table above.
- Add `agentos-chief-of-staff` to `portfolio-v1.project_ids` — without this it is filtered out silently.
- Add `volant-founder-2017` to `portfolio-v1.experience_ids`.
- Retire the Volant 2024 stint: delete `volant-founder-2024` from `experience.yaml`, drop its three
  references in `resume_versions.yaml`, and drop `volant-fullstack-client-delivery` from the same
  three versions. Its `timeframe` reads `2024-present`, so it retires with the stint rather than
  moving to 2017. Leave `volant-business-founding` untouched.
- Raise the Charity Navigator metrics to `11M+` annual users and `50,000+` clients.
- Give the export a real public headline — today it inherits `portfolio-v1.label`, which reads
  "Portfolio-Focused Software Engineer".
- Add a validation rule: `portfolio_visible: true` on a project missing from `project_ids` becomes an
  error, not a silent omission.

**Done when** `npm run generate:portfolio` emits exactly five `featuredProjects` and five experience
entries, and `npm run validate` passes.

---

## Milestone 1 — Extend the schema for presentation

**Repo:** `resume-system`.

- Add a `portfolio_` namespace to projects: `portfolio_headline`, `portfolio_blurb`,
  `portfolio_image`, `portfolio_links`, `portfolio_featured`. Anything without a headline falls back
  to `name`.
- Fill these in for the five visible projects — including
  `portfolio_headline: LLM Reasoning with Human Decisions & PII Masking` on `insummery-ai`, which
  keeps "InSummery.AI" as the card's subtitle.
- Add `portfolio_facets` to skills — a many-to-many list drawn from a fixed vocabulary
  (`applied-ai`, `front-end`, `back-end`, `devops`). Absent, a skill inherits its existing category,
  so only cross-listed skills need tagging.
- Flatten the export from `[{category, items}]` to one list of `{name, facets, proficiency}`, so the
  site can group by facet on the client.
- Add `npm run classify-skills` to keep facets current as the corpus grows: it finds skills missing
  `portfolio_facets`, asks the model to propose them from the fixed vocabulary, and prints them for
  confirmation rather than writing silently. Reuses the OpenAI-compatible client already in
  `scripts/lib/llm.ts` — no new dependency — following the same human-in-the-loop pattern as
  `interview-gaps` and `judge`.
- Move four files together: `data/projects.yaml`, `scripts/lib/schemas.ts`,
  `templates/portfolio.json.njk`, `schemas/portfolio.schema.json`.

**Watch for** `additionalProperties: false` in the JSON schema — it rejects every new field until
updated in the same commit.

---

## Milestone 2 — Add the render step

**Repo:** `portfolio`.

- Add a `package.json` and `scripts/build-site.mjs` — the site's first build tooling.
- Rewrite only the regions between marker comments (`<!-- generated:projects start -->` and friends),
  leaving hand-tuned markup and CSS untouched.
- Commit the rendered HTML (see "Why committed HTML" above).
- Regenerate `agents.json` by **merging**: refresh the resume-derived fields, preserve the site-owned
  ones — `privacy`, `documents`, `publicContact`, and the project fields with no source in the schema
  (`status`, `keyFocus`, `buildNarrative`).
- Regenerate `agents.md`, making the README's `sync-agents-md.mjs` instruction true for the first time.
- Keep the Agent-Ready Portfolio card outside the markers, and drop the hardcoded "Project 01–05"
  labels so the generator can number what it renders.
- Build the filterable skills section: render **every** skill into the HTML and let JavaScript filter
  visibility, so crawlers still see the full list. Chips are real `<button>` elements carrying
  `aria-pressed`, with a live count and an "All" default.

**Done when** running the script twice produces an empty `git diff`, and the skills section still
lists everything with JavaScript disabled.

---

## Milestone 3 — Automate the pull

**Repo:** `portfolio`, plus one doc update in `resume-system`.

- `.github/workflows/sync-resume.yml`, triggered by `workflow_dispatch` (manual button) and a weekly
  `schedule`.
- Fetch the public JSON, exit early if unchanged, otherwise render and open a PR with the built-in
  `GITHUB_TOKEN`.
- Enable **Allow GitHub Actions to create and approve pull requests** in repo settings first —
  otherwise the PR step fails with an opaque permissions error.
- Update `resume-system/docs/portfolio-integration.md`, which is now stale: it names build-time fetch
  as "the current recommendation" and still lists site-side wiring as out of scope. Replace the
  recommendation with the consumer-pull design above and tick the checklist. That file is the
  producer-side **contract** doc and should stay that — how the site fetches and renders belongs in
  the portfolio repo, matching the direction of the coupling.

**Note** raw.githubusercontent caches for a few minutes, so a manual run fired seconds after merging
can still fetch the previous copy.

---

## Milestone 4 — Prove it with Stack Overlord

- Flip `portfolio_visible: true` on `stack-overlord` and give it a headline, blurb, and image.
- Merge, trigger the workflow, review the Vercel preview, merge the PR. The card should appear having
  touched only the resume repo.
- Because `stack-overlord` already sits in `portfolio-v1.project_ids`, this exercises the flag but not
  the add-a-brand-new-project path — the validation rule from Milestone 0 covers that gap.

**Done when** a one-line YAML change reaches production without editing the portfolio repo by hand.

---

## Risks

- **Public claims.** The `11M+` and `50,000+` figures become canonical on resumes and the public site
  simultaneously. Confirmed accurate by Tyler, 2026-08-13.
- **Confidence.** `openclaw-multi-agent-ecosystem` carries a "~15% profit lift" outcome tagged
  *medium/low confidence* in the source data. Defensible on a resume read in context; more exposed as
  a standing public claim. _Deferred — look into filtering low-confidence outcomes from the export._
- **Side effect.** Retiring the Volant 2024 stint removes a full-stack client-delivery bullet from
  three tailored resume versions, not just the portfolio. Accepted.
- **Regression.** `agents.json` currently holds a better public headline and summary than the
  generated export. Merge carefully, or the machine-readable profile degrades once automated.
- **Thin facet.** DevOps holds three skills (Docker, CI/CD, GitHub Actions) against sixteen for
  Applied AI, so that chip will look sparse. Projects already demonstrate Vercel, Cloud Functions, and
  OpenTelemetry that never made it into `skills.yaml` — enriching the corpus is the fix; padding is not.
- **Employer work.** Prose describing roles at NAMI and Charity Navigator is standard practice.
  Screenshots of internal, staff-facing tools are the line to watch — keeping those roles as timeline
  entries rather than project cards avoids the question.

---

## The failure mode to remember

A project appears on the site only when it is in `portfolio-v1.project_ids` **and** marked
`portfolio_visible: true`. Miss either and there is no error — the card simply never renders. The
validation rule in Milestone 0 exists to turn that silence into a failed build.

---

## Commands

```bash
# resume-system — validate, then regenerate the portfolio export
npm run validate
npm run generate:portfolio
```

```bash
# portfolio — render, then confirm the render is idempotent
node scripts/build-site.mjs
git diff --stat
```
