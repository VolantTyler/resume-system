---
name: process-intake
description: Turn raw notes, README pastes, PDFs, transcripts, or "here's what I built" messages into validated résumé YAML in data/, then log the intake. Use this whenever Tyler drops a file in docs/intake/, pastes project or job details he wants captured, asks what intake is pending, or says anything like "add this to my resume data", "I built X", "capture this", "log this project", or "process the newest note" — even if he doesn't mention intake or YAML by name. Also use when adding a new accomplishment, project, or skill to data/ from any source, since the claim-safety and ID conventions here apply to every write into data/.
---

# Process intake into résumé data

Intake is the only sanctioned way new facts enter `data/`. The job is to convert an unstructured source — a note, a README, a PDF, a chat message — into structured YAML that a résumé generator can select from, **without ever adding a claim the source doesn't support.**

The hard part is not the bookkeeping (there are scripts for that). It's the judgment: deciding what's genuinely new, choosing the right granularity for an accomplishment, and writing polished bullets that stay strictly inside what the source actually says.

## Why claim-safety dominates everything here

This data ends up on résumés Tyler sends to employers, and he has to be able to defend every line of it in an interview. A fabricated metric isn't a style problem — it's a claim he'll get caught not being able to back up.

So the discipline is: **`raw_fact` is the truth, `resume_bullets` are only rephrasing.** A bullet may compress, reorder, or sharpen the language of its `raw_fact`. It may never introduce a number, a technology, an employer, a date, or an outcome that isn't already there.

If the source is vague, keep the bullet qualitative and set `confidence: medium`. A qualitative bullet that survives scrutiny beats an impressive one that doesn't.

## Workflow

### 1. Find what's pending

```bash
npm run intake:list
```

This diffs `docs/intake/*.md` against `docs/intake-log.md`. Note the limitation: **it only tracks `.md` files.** `docs/intake/` also accumulates PDFs (CVs, project briefs, cover letters) that never appear in this list. If Tyler asks what's outstanding, check `ls docs/intake/` too, not just the script output.

But be careful about what that invisibility means. **A PDF missing from the log is not evidence it's unprocessed** — as of the last audit, every PDF in `docs/intake/` had already been mined into `data/` without ever getting a log row. The reliable check is `source_notes`, which every accomplishment carries:

```bash
grep -c "source_notes:" data/accomplishments.yaml
grep -rn "Master Career Document\|Technical Brief" data/accomplishments.yaml | head
```

If a document is cited there, its facts are in. Re-processing it wastes effort and risks duplicate accomplishments under new IDs.

For PDFs, use the `pdf` skill to extract text. Watch for files that aren't really PDFs — a browser-saved download can land as HTML with a `.pdf` extension, which fails extraction with a header error rather than an obvious message.

### 2. Read the source, then read what already exists

Before writing anything, find out whether the facts are already captured. Re-adding the same accomplishment under a new ID is a common and annoying failure.

```bash
grep -n "^- id:" data/accomplishments.yaml     # existing accomplishment IDs
grep -n "^- id:" data/projects.yaml            # existing project IDs
grep -n "name:" data/skills.yaml               # existing skills
```

Match on substance, not ID text. "Built a Storybook component library" is already covered by `nami-design-component-library` even though the wording differs.

### 3. Decide granularity

An accomplishment is **atomic**: one defensible claim, one story Tyler could tell for two minutes in an interview. A README describing a whole system usually yields three to five accomplishments, not one.

Split when the parts would be selected independently for different roles. `graic-crewai-supervisor-routing`, `graic-slack-fastapi-backend`, and `graic-gdocs-drive-integration` came from a single README because a frontend résumé wants none of them and an applied-AI résumé wants all three — separately rankable.

Don't split so far that a bullet becomes trivia. "Used Python 3.10" is not an accomplishment.

### 4. Write the YAML

Field shapes are enforced by Zod in `scripts/lib/schemas.ts` — read it if unsure. Required fields for an accomplishment are `id`, `raw_fact`, `resume_bullets` (≥1), `target_roles` (≥1), and `confidence`. Everything else is optional but usually worth filling.

```yaml
- id: graic-crewai-supervisor-routing        # kebab-case, prefixed by project/company
  company: Independent R&D
  role: Applied AI Developer
  timeframe: "2026"                          # quote it — bare years parse as numbers
  category: applied-ai
  themes:                                    # concepts; feeds JD matching in tailor
    - CrewAI
    - supervisor routing
    - multi-agent orchestration
  technologies:                              # concrete tools; also feeds JD matching
    - CrewAI
    - Google Gemini
    - Python
  raw_fact: >-
    The unpolished truth, as specific as the source supports. This is what a
    bullet is checked against — write it first, write it honestly.
  context: Why this existed / what problem it solved.
  resume_bullets:
    standard: One-line polished version, no new claims.
    applied-ai: Variant emphasizing the AI/agent angle.
    full-stack: Variant emphasizing the systems/delivery angle.
  evidence:
    - Repo README (github.com/VolantTyler/...)
  target_roles:
    - applied-ai-developer
    - agentic-ai-engineer
  confidence: high
  source_notes:
    - docs/intake/2026-07-31-glen-rock-ai-guild.md
```

**ID convention:** `<project-or-company-prefix>-<what-it-is>`, kebab-case. Existing prefixes include `cn-` (Charity Navigator), `nami-`, `insummery-`, `graic-`, `cognitive-bridge-`, `gap-` (reserved for gap-interview output). Reuse the established prefix for a known project rather than inventing a new one.

**`themes` and `technologies` matter more than they look.** `scripts/lib/tailor.ts` matches job-description text against these fields to rank accomplishments and to decide what counts as a "possible gap". A real skill that's missing from `technologies` will show up as a gap against a JD that asks for it. Be generous and accurate here.

### 5. Choose bullet variants

Targets in `data/resume_targets.yaml` each declare a `bullet_variant`; `scripts/lib/build-resume-context.ts` looks up that key on the accomplishment and **silently falls back to `standard`** when it's missing.

Currently live variants: `standard`, `full-stack`, `applied-ai`, `frontend`, `nonprofit`, `qa`.

Two consequences worth internalizing:

- **Always write `standard`.** It's the fallback for every target; all 40 existing accomplishments have it.
- **A variant no target declares is dead weight.** Three accomplishments currently carry an `agentic` bullet, but no target has `bullet_variant: agentic`, so those bullets never render. Before inventing a variant name, confirm a target actually asks for it:
  ```bash
  grep "bullet_variant:" data/resume_targets.yaml | sort -u
  ```

Write a variant only where the framing genuinely differs. Duplicating `standard` under three keys adds maintenance cost and no output.

### 6. Wire it into the graph

An accomplishment nobody references never appears on a résumé. Validation catches dangling references, but it can't tell you that you forgot to reference something.

- `data/experience.yaml` → add the ID to the right entry's `accomplishment_ids`
- `data/projects.yaml` → add to `related_accomplishment_ids` if it belongs to a project
- `data/skills.yaml` → add new skills under an existing category (Applied AI, Front-End, Back-End, Testing, DevOps, Collaboration), with `evidence_ids` pointing back at the accomplishment
- `data/resume_versions.yaml` → add to `accomplishment_ids` for the versions that should actually show it

Step four is the one that gets skipped. Adding an accomplishment without adding it to any version means it exists in the data and appears on zero résumés.

### 7. Build, then log

```bash
npm run build     # validate + regenerate everything
```

Fix anything validation reports before continuing. Then close the loop:

```bash
npm run intake:log -- <filename> "<one-line summary of what changed>"
```

This appends to `docs/intake-log.md` and re-validates, so the log only ever reflects data that actually validates. Use the bare filename as it appears in `docs/intake/`.

If the source wasn't already a file in `docs/intake/` (a pasted README, a chat message), write one first as `docs/intake/YYYY-MM-DD-slug.md` so the log points at something real. Follow the existing shape:

```markdown
# Intake: <Title> (<YYYY-MM-DD>)

<One paragraph on where this came from and what was cross-checked.>

## Facts captured (no invented metrics)

- <bullet per fact, at the level of detail the source supports>

## YAML updates

- `data/accomplishments.yaml` → `new-id-one`, `new-id-two`
- `data/skills.yaml` → CrewAI, FastAPI (+ evidence links)
```

### 8. Report what changed

Tell Tyler which IDs were added, which versions now include them, and — importantly — anything you deliberately did **not** capture because the source didn't support it. That last part is what lets him fill the gap himself.

## Confidence levels

- `high` — stated plainly in a source Tyler wrote or verified (README, repo, his own note)
- `medium` — inferred, paraphrased across sources, or captured from an interview answer without documentation
- `low` — thin support; keep it out of most versions

Gap-interview output is written at `medium` by design (`scripts/lib/persist-gap-evidence.ts`). Don't quietly promote those to `high` later without new evidence.

## Things that will bite you

- **Bare years parse as integers.** `timeframe: 2026` fails schema validation; quote it.
- **`npm run validate` checks structure, not truth.** It will happily accept an invented metric. You are the only check on that.
- **Never edit `output/`.** It's regenerated wholesale from `data/` + templates. A fact only "exists" once it's in `data/`.
- **`intake:list` only sees `.md`.** PDFs in `docs/intake/` are invisible to it.
