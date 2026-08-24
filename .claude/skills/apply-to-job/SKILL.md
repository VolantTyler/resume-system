---
name: apply-to-job
description: Run the full application workflow for a job description — tailor the résumé, interview Tyler about possible gaps, write the fit analysis, and draft a cover letter. Use this whenever Tyler pastes a job posting or link, drops a file in docs/job-descriptions/, or says anything like "I want to apply to this", "tailor my resume for X", "what's my fit for this role", "write a cover letter for this", or "should I apply?" — even when he only asks for one piece, since the pieces depend on each other. Also use when reviewing or redoing an earlier tailored run.
---

# Apply to a job

This turns a job description into a defensible application: a tailored résumé, an honest fit analysis, and a cover letter — all sourced from evidence already in `data/`.

`npm run tailor` does the deterministic half (matching, ranking, judging). The half that needs you is judgment: interviewing about gaps before conceding them, writing a fit analysis Tyler can defend in a screen, and drafting a letter that sounds like him.

## The core discipline

Everything in the application must trace back to `data/`. Never introduce an employer, metric, technology, date, or outcome that isn't already documented — not in the résumé, not in the fit analysis, not in the cover letter. The cover letter is the easiest place to slip, because prose invites embellishment. If you want to say something the data doesn't support, that's a signal to run a gap interview and capture the evidence properly, not to write it anyway.

## Workflow

### 1. Get the JD onto disk

Tailoring reads from a file. If Tyler pasted text or a link, save it first:

```bash
docs/job-descriptions/<company>-<role-slug>.md
```

Keep the posting close to verbatim — the matcher works on its literal terms, so paraphrasing degrades the match. Include the job ID or requisition number if there is one; it belongs in the fit analysis and cover letter header later.

### 2. Tailor

```bash
npm run tailor -- docs/job-descriptions/<file>.md
```

Useful flags: `--target <target-id>` to override the recommended target, `--label` / `--slug` to control naming, `--skip-judge` to bypass the judge loop.

Outputs land in `output/resumes/tailored/`: the résumé (`.md`/`.html`), a `-match-report.md`, and judge artifacts.

### 3. Read the match report before saying anything about fit

`tailored-<slug>-match-report.md` gives you the recommended target and its score against every alternative, the matched terms and where each was found, the selected accomplishments ranked by relevance, and the possible gaps.

Check the recommended target against the ranking table. Normally "Recommended Target" is just the top-scoring row, but **the report prints whatever target was actually used — including a `--target` override — under that same heading, with nothing marking it as overridden.** So if the recommended target isn't the top row, someone passed `--target` on that run. The existing Amazon Quick report is an example: it recommends `ai-security-product` (score 23) while `full-stack-engineer` (43) and `frontend-engineer` (42) sit above it in the table.

That's worth a moment's thought each time, in both directions: an override may be a deliberate, good call that the report is failing to explain, or a stale flag copied from a previous run. If the top-ranked target fits the role better, re-run without the override — or with a different `--target`.

### 4. Interview about gaps — before treating any of them as weaknesses

A "possible gap" means a term appears in the JD and **is not documented in `data/`**. It does not mean Tyler lacks the skill. Conceding an undocumented gap in a fit analysis, when he actually has the experience, quietly weakens a real application.

So ask him. Either run the interactive flow:

```bash
npm run tailor -- docs/job-descriptions/<file>.md --interview-gaps
npm run interview-gaps -- docs/job-descriptions/<file>.md    # standalone
```

…or, if you're working in chat, ask the same questions yourself: for each gap, has he done this, in what context, and which role or project was it part of. Then capture confirmations into `data/` the same way the script would — `confidence: medium`, `source_notes` pointing at the interview, an intake note under `docs/intake/`, and a row in `docs/intake-log.md`. The `process-intake` skill covers the YAML shapes and the claim-safety rules for that write.

Re-run tailor after confirmations so the new evidence can affect ranking.

Record the outcome in three buckets — confirmed, denied, skipped. Denials are as useful as confirmations: they tell the fit analysis what to concede honestly instead of guessing, and they stop the same question being re-asked on the next application.

### 5. Write the fit analysis

This is the part Tyler actually reads before deciding whether to apply. Structure:

```markdown
# Application Strength Analysis

*<Role title, team> — <Job ID if any>*

<Two or three sentences: overall fit, and what's honestly missing.>

## Strongest alignment

- **<JD criterion>.** <Where the evidence lives> → <specific section pointer>

## Weakest / indirect alignment

- **<JD criterion>.** <How the background addresses this indirectly, or a clean concession.>

## Gap interview outcome

- Confirmed: <items>
- Denied: <items>
- Intake: `docs/intake/<file>.md`
```

Two to three items under each heading. Every strength carries a **pointer into the résumé** — `Experience → NAMI (component library, Storybook, a11y)`, `Selected Projects → InSummery.AI` — so Tyler can find the evidence while someone is asking him about it on a call.

The weaknesses section is where honesty pays. For each one, either name the indirect bridge or concede it cleanly. "Denied AWS experience in gap interview. Closest signal is shared component libraries and cloud-hosted GenAI apps on Firebase/Vertex. Learning Cloudscape is transferable craft, not prior AWS tenure" is useful. "Strong transferable cloud skills" is not — it reads as spin and gives him nothing to say.

### 6. Decide where the fit analysis lives

This matters more than it looks, and it's the thing most likely to be done wrong.

`application_fit` is a real, schema-validated field on a résumé version, and `templates/resume.md.njk` renders it as an "Application Fit" section at the top of the résumé. But on a tailored run, the version only exists in memory, and its `application_fit` is populated **solely from the judge's verdict** (`scripts/lib/revise.ts`). Without `RESUME_JUDGE_API_KEY` set, the stub judge fills it with generic filler — *"Solid keyword-level fit for the role based on documented themes and skills"* — which is worse than nothing on a real application.

So pick deliberately:

- **Role Tyler is seriously pursuing** → promote it to a curated version in `data/resume_versions.yaml` with a hand-authored `application_fit` block, an `output_folder`, and a stable `output_slug`. This is what `tyler-stahl-deloitte-fde-frontier-genai` and `tyler-stahl-google-fde-genai` already do, and it's why those survive regeneration while loose tailored files don't. Structure:
  ```yaml
  application_fit:
    role_reference: Deloitte Forward Deployed Engineer, Frontier GenAI (req 350555)
    overall: >-
      Two or three sentences of honest overall assessment.
    strengths:                    # 1–5 entries
      - criterion: <JD criterion>
        resume_reference: <pointer into the résumé>
    weaknesses:                   # 1–5 entries
      - criterion: <JD criterion>
        indirect_address: <how the background covers this, or a clean concession>
  ```
  Then `npm run build` renders it into the résumé itself.

- **Quick exploratory look** → write the standalone `output/resumes/tailored/tailored-<slug>-fit-analysis.md`. Be aware it's derivative: the next `npm run tailor` for that slug won't reproduce it.

Either way, **do not hand-edit the generated résumé in `output/`** to inject fit copy. That file is overwritten on the next build and the edit is silently lost. If you want fit text inside the résumé, it goes through `resume_versions.yaml`.

### 7. Draft the cover letter

Load the `my-writing-style` skill first — this goes out under Tyler's name and should sound like him, not like a template.

Save to `output/resumes/tailored/cover-letter-<slug>.md`. The established shape:

```markdown
# Cover Letter

**Tyler Stahl**
<Location> · <portfolio_url> · <linkedin_url>

**Role:** <Exact posted title, company>
**Preferred location:** <if relevant>

---

Dear <specific team if the JD names one, else hiring team>,

<Opening: the role, and a one-sentence claim about where he works that maps
directly onto what the posting asks for. Reference the job as written.>

<Professional history: concrete, named work from data/ — employers,
systems, and the metrics that are actually documented.>

<Recent / independent work: what he's building now and why it's relevant.>

<Why this role specifically. Personal angle where it's genuine.>

<One-line close on what he'd contribute.>

Sincerely,
Tyler Stahl
```

Pull the contact line from `data/profile.yaml` rather than retyping it. Four or five paragraphs is the right length. Every specific in it — "raised aggregate compliance by 30%", "10M+ annual users", "80% confidence human-in-the-loop gate" — must already exist in `data/`. If a claim isn't there, either cut it or go capture it properly through a gap interview.

Address a named team when the posting names one ("Dear Search Design Systems hiring team"). Skip the throat-clearing — no "I am writing to express my interest".

### 8. Verify every claim before handing anything over

Nothing above actually checks the draft for fabrication — the tailor is a term-matcher and the stub judge only does keyword overlap, so a rounded metric or a date pulled from the wrong role survives both. Run the deterministic checker:

```bash
npm run verify-claims -- --jd docs/job-descriptions/<file>.md
npm run verify-claims -- --version <version-id>     # for a curated version
npm run verify-claims -- --help                     # --target, --quiet, --no-report
```

For the judgment-level pass over prose that the checker can't parse — cover letter paragraphs, fit-analysis wording — use the **`resume-tailor-verify`** skill, which re-derives each claim from its source record. That skill and this one overlap by design: it owns the verification pass, this one owns the JD-to-application workflow around it. If you're only being asked to check an existing draft, go straight there instead.

The claims most worth re-checking are the quiet ones: a metric rounded up, a date from an adjacent role, a technology named in the JD that got echoed into a bullet where it was never used, and a `confidence: low` accomplishment stated as flatly as a `high` one.

### 9. Report back

Give Tyler: the recommended target and whether you overrode it, the gap interview outcome, where the files landed, and a straight read on whether this is worth applying to. If the honest answer is that the fit is weak, say so — that's more valuable than a polished application to a role he won't get.

## Handling a JD that arrives as a link or PDF

Fetch or extract it (use the `pdf` skill for PDFs), save the text under `docs/job-descriptions/`, and proceed as normal. If content can't be retrieved, ask Tyler to paste it rather than tailoring against a guess at the role.

## Related

- `resume-tailor-verify` — the claim-verification pass; use it for step 8, or on its own when the ask is only "check this draft"
- `process-intake` — the YAML shapes and claim-safety rules for anything a gap interview writes into `data/`
- `my-writing-style` — Tyler's voice, for the cover letter
- `.cursor/rules/tailored-resume-fit-analysis.mdc` — the original statement of the fit-analysis requirement
