---
name: resume-tailor-verify
description: Tailor a résumé, cover letter, or fit analysis to a job description from data/*.yaml, then independently re-check every claim in the draft (numbers, dates, employers, technologies, outcomes) against its exact source record before showing it — catching the fabricated or inflated claim before it goes out under Tyler's name on a real application. Use whenever the user asks to tailor/customize a résumé for a JD, write a cover letter, draft a fit/strength analysis, answer "does my background cover X requirement", or pull bullets that emphasize a given skill or theme. Trigger even if the user doesn't ask for verification explicitly — for this repo, "never invent claims" (AGENTS.md) is a standing rule, not optional, and this skill is how that rule actually gets enforced instead of just stated.
---

# Résumé Tailor & Verify

Tailoring a résumé and checking it for fabrication are usually two separate acts: the draft gets written, then Tyler re-opens `data/accomplishments.yaml` and `data/experience.yaml` to confirm every bullet is real before he sends the application. That second pass — the one `AGENTS.md` and `.cursor/rules/tailored-resume-fit-analysis.mdc` both assume happens but don't actually perform — is what this skill does before handing the draft over.

This repo already runs an LLM judge (`finalizeResumeWithJudge`, logged in `docs/judge-log.md`) that scores `evidence_alignment` and can raise `invented_claim_flags`. Treat that as a second opinion, not a substitute for this pass: without `RESUME_JUDGE_API_KEY`/`OPENAI_API_KEY` set, the stub judge only does keyword overlap — it will not catch a rounded number or a shifted date. And an LLM checking its own tailoring output is prone to confirming what it just wrote rather than actually re-deriving it from source.

The failure mode this guards against isn't "invented an employer from nothing" (rare, obvious) — it's the quiet ones: a metric rounded up, a date pulled from the wrong role, a technology mentioned in the JD and echoed into a bullet where it was never actually used, a `confidence: low` accomplishment presented with the same certainty as a `confidence: high` one.

## When This Triggers

- "Tailor my résumé for this job description" / `npm run tailor -- docs/job-descriptions/<file>.md`
- "Write a cover letter for [company/role]"
- "Draft a fit analysis for this JD" / "how strong is my application for X"
- "Give me bullets that emphasize [skill/theme] for this role"
- "Does my background cover [JD requirement]?"
- Any gap-interview follow-up where a confirmed answer gets written back into `data/` and then re-tailored

Skip the full pass for a low-stakes ask that never leaves this chat — e.g. "just eyeball whether I have Kubernetes experience." Scale rigor to stakes: a curiosity question gets a quick check; anything that will be pasted into an actual application gets the full ledger below.

## Step 1 — Generate

1. Read the job description (`docs/job-descriptions/<file>.md` or pasted text) and the relevant source files: `data/accomplishments.yaml`, `data/experience.yaml`, `data/skills.yaml`, `data/projects.yaml`, `data/resume_targets.yaml`. Prefer running `npm run tailor -- docs/job-descriptions/<file>.md` (or `--interview-gaps`) so matching and target selection stay deterministic rather than re-guessed in chat.
2. Draft the résumé bullets / cover letter / fit analysis. For every atomic claim — a number, a date, a company/employer name, a specific technology, a stated outcome — note the exact source as you write it: the accomplishment `id`, the `experience.yaml` entry, or the `skills.yaml` category. Track this inline; reconstructing sourcing after the fact is how claims quietly drift from their evidence.
3. Keep a running claims list. A claim is atomic if it could individually be true or false ("cut p95 latency 40%" is atomic; "significantly improved performance" is not and needs no separate sourcing, but also shouldn't imply a number that isn't there).

## Step 2 — Verify (the part Tyler used to do by hand)

Before showing the draft:

1. **Run the deterministic checker first.** `npm run verify-claims -- --version <id>` (curated) or `npm run verify-claims -- --jd docs/job-descriptions/<file>.md` (ad-hoc tailor match) mechanically re-derives every bullet's numbers and technology mentions from `data/*.yaml` — including skills.yaml's `evidence_ids` graph, not just prose text — and classifies each as verified / inferred / unsupported. It exits non-zero on any unsupported claim and writes a full ledger to `output/claim-verification/<slug>.md`. Run this before doing anything by hand; it catches the mechanical cases (a rounded number, a technology term with no backing) so the manual pass below can focus on judgment calls it can't make.
2. **Read every unsupported/inferred row it produced** and resolve each: confirm it's real and the source data is just incomplete (add evidence via `npm run interview-gaps`), or cut/reword the claim.
3. **For anything the script can't check** — dates, company attribution, "led" vs. "contributed to" framing — re-open the exact source record (`experience.yaml` start/end, `accomplishment.raw_fact`) directly rather than trusting the earlier match.
4. **Cross-check against the judge log** (`docs/judge-log.md`, `output/judge-runs/<run>.md`) if this went through `npm run tailor`/`judge` — its `invented_claim_flags` is a second opinion, not a substitute, especially in stub mode (no API key).
5. **Do this with fresh eyes for anything going into a real application.** The deterministic script is unbiased, but the manual dates/framing pass in step 3 is done by the same reasoning that drafted the bullets. Run it as an independent subagent that receives only the claims list + `data/*.yaml`, not the tailoring rationale — see Tools below.

Classify each claim:
- **Verified** — exact match to `raw_fact`/`evidence`/`experience.yaml`, confidence high or medium
- **Inferred** — reasonable paraphrase of the source, or backed by a `confidence: low` accomplishment
- **Unsupported** — no matching record found anywhere in `data/`; must be cut or sent through gap-interview before it ships

## Step 3 — Report

Lead with the tailored résumé / cover letter / fit analysis as asked for. Attach a verification ledger so the check is visible, not implicit:

| Claim | Source | Status |
|---|---|---|
| "Built a CrewAI Supervisor routing simple vs. detailed Slack prompts" | `accomplishments.yaml` → `graic-crewai-supervisor-routing` | ✅ Verified |
| "Cut agent response latency 40%" | — | ❌ Unsupported — no metric in `raw_fact` or `evidence`; source only says "automatic failover on 429/404 errors", no latency figure |
| "5+ years leading FDE engagements" | `experience.yaml`, confidence: medium | ⚠️ Inferred — role dates support tenure, "leading" not explicitly stated in raw_fact |

Don't bury Unsupported rows in the ledger only — call them out in prose and hold them out of the final draft (or push them into `npm run interview-gaps`) rather than letting the résumé ship with them silently attached.

## Tools this needs

- **Bash** — required. Run `npm run verify-claims` (the deterministic checker, see below), `npm run tailor`, `npm run judge -- <jd> --stub` (or live, if `RESUME_JUDGE_API_KEY` is set), `npm run validate`, and `npm run interview-gaps`.
- **`scripts/verify-claims.ts`** (built — `npm run verify-claims`) — the core of Step 2. Given a résumé version (curated `--version <id>` or an ad-hoc `--jd <path>` tailor match), it extracts every cited accomplishment, re-derives the bullet's numbers via regex and technology mentions via a vocabulary built from `data/skills.yaml` + `technologies` fields, and checks each against `raw_fact`/`evidence`/`source_notes`/skill `evidence_ids` — no LLM call, every finding traces to an exact field. Exits non-zero on any unsupported claim; full ledger written to `output/claim-verification/`. See `scripts/lib/verify-claims.ts` for the checks and `tests/verify-claims.test.ts` for behavior.
- **Read** — for anything the script can't check: re-opening `experience.yaml` dates/company, or a bullet's "led" vs. "contributed to" framing, directly rather than from memory.
- **Grep** — fallback when a claim doesn't map to an obvious source: search `data/*.yaml` for the term before concluding it's unsupported (the script's technology vocabulary only knows terms already in `skills.yaml`/`technologies` fields, not every possible phrasing).
- **Agent (subagent)** — recommended for anything going into a real submitted application: run the manual portion of Step 2 (dates/framing) as a fresh agent given only the claims list and `data/*.yaml`, not the drafting reasoning, so it isn't primed to confirm its own work. Not needed for the deterministic script itself — it's unbiased by construction.
