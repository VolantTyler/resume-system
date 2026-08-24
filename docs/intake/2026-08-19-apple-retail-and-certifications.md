# Intake: Apple Retail tenure and certifications (2026-08-19)

Two sources, both already sitting in `docs/intake/` but never captured into `data/`:
the Apple B2B mention in the interview-answers section of `Master AI Career Document -
Tyler Stahl.pdf`, and the certifications block on `sent applications/tstahl - IBM AI FDE -
resume.pdf`. Tyler confirmed the Apple role, store, and dates directly in session
(2026-08-19); the certifications are transcribed verbatim from the résumé.

Surfaced by a sweep of every PDF in `docs/intake/` against `data/`. Everything else in
those PDFs was already captured — all 40 existing accomplishments carry `source_notes`
citing them — so this note covers only the two genuine gaps.

## Facts captured (no invented metrics)

- Apple Retail tenure August 2011 – April 2015; Business Specialist on the B2B team at the
  Apple Fifth Avenue store, April 2013 – September 2014. Confirmed by Tyler in session.
- No revenue, account, or performance figures for the Apple role — none were provided, so
  none are claimed. The accomplishment is qualitative and `confidence: medium`.
- Seven certifications, transcribed as issuer / name / date:
  Google AI Summit (Google Skills, Jun 2026, pending); 5-Day AI Agents: Intensive Vibe
  Coding Course with Google (Kaggle, Jun 2026, pending); Agentic AI (DeepLearning.AI,
  May 2026); AI Skills in Action (Breach Secure Now, Oct 2025); AI Fundamentals (Breach
  Secure Now, Oct 2025); 2025 Cybersecurity Training (Breach Secure Now, Jan 2025);
  Enterprise Design Thinking Practitioner (IBM, Jun 2021).

## YAML updates

- `data/experience.yaml` → `apple-retail-business-specialist` (not yet referenced by any
  résumé version, so it renders nowhere until opted in)
- `data/accomplishments.yaml` → `apple-b2b-brand-standards` (`confidence: medium`)
- `data/profile.yaml` → seven certifications added as `education` entries; the schema has
  no `certifications` field yet, tracked in `TODO.md`

## Claim-verification fixes made in the same pass

`npm run verify-claims` was exiting 1 on six pre-existing unsupported claims. All four
distinct causes were term-attribution, not fabrication:

- `rnd-agent-orchestration-delivery` — bullet said "HITL", `raw_fact` said "mandatory human
  checkpoints". Same thing; added `HITL` to `themes`.
- `autonomous-etl-pipelines` — bullet said "agent workflows"; the accomplishment's own
  `context` says "supporting agentic market-intelligence workflows", which the checker
  doesn't read. Added `agent workflows` to `themes`.
- `rnd-gcp-genai-delivery` — bullet said "agent workflows"; `raw_fact` names InSummery.AI and
  Cognitive Bridge, both documented agent products. Added `agent workflows` to `themes`.
- `insummery-gap-analysis-calendar` — bullet said "Google Calendar OAuth sync" but neither
  `raw_fact` nor `technologies` documents OAuth for this accomplishment. Removed "OAuth" from
  the bullet rather than assert an undocumented technology.

`npm run verify-claims` now exits 0 across all nine curated versions.
