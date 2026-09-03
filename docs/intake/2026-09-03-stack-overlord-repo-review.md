# Intake: Stack Overlord repo review (2026-09-03)

Tyler asked to feature Stack Overlord on the portfolio. The existing `data/`
entry (added 2026-08-04) only captured that it was built with Codex/GPT-5.6
for OpenAI Build Week — it was flagged as "the thinnest project in the
corpus" and kept out of the portfolio pending more detail.

Reviewed the actual project sources to fill that in:

- `github.com/VolantTyler/stack-overlord` — README (fetched via
  `raw.githubusercontent.com/VolantTyler/stack-overlord/main/README.md`)
- `docs/hackathon/prd.md` and `docs/hackathon/submission-draft.md` in that
  repo
- Live demo at `stack-overlord.vercel.app` (egress-blocked from this
  session; not directly reviewed — description below comes from the repo
  docs only)

## Facts captured (no invented metrics)

- Problem: a merge can succeed in GitHub while the post-merge deployment
  fails silently (credentials, quotas, environment config), leaving
  production stale with no clear notification.
- Solution: a Next.js/TypeScript dashboard that ingests signed GitHub
  Actions webhooks (HMAC SHA-256) into a durable Postgres ledger via
  Drizzle ORM, with GitHub itself kept as the sole source of truth for
  pass/fail status.
- Failed runs are diagnosed via the OpenAI Responses API (GPT-5.6),
  returning evidence-cited, confidence-scored analysis with ordered
  verification steps; the design explicitly states AI interpretation never
  overrides GitHub-owned status. Failures also push a Slack alert (Block
  Kit).
- A deterministic, credential-free demo/replay mode (fixture-backed) lets
  evaluators exercise the whole flow without GitHub/OpenAI credentials —
  built for OpenAI Build Week 2026 judges specifically.
- Responsive (desktop/mobile) dashboard; tested with Playwright and Vitest.
- Tech stack: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui,
  Postgres, Drizzle ORM, OpenAI Responses API (GPT-5.6), Vercel, Playwright,
  Vitest, GitHub Actions webhooks, Slack Bolt.
- Built for OpenAI Build Week 2026, Developer Tools track.

## Deliberately not captured

- No placement, award, ranking, or judging-outcome claim — the repo docs
  describe scope and a judging/testing path, not a result.
- No user counts, latency numbers, or reliability metrics — none were
  stated in the README or hackathon docs.
- No screenshot/portfolio_image — none exists yet; left unset so the
  portfolio renderer falls back rather than pointing at a missing asset.

## YAML updates

- `data/accomplishments.yaml` → added `stack-overlord-webhook-ledger`,
  `stack-overlord-ai-failure-diagnosis`, `stack-overlord-demo-mode`
  (existing `stack-overlord-openai-build-week` left as-is).
- `data/projects.yaml` → rewrote `stack-overlord`'s problem/solution/
  technologies/outcomes/portfolio_headline/portfolio_blurb, added
  `portfolio_links` (live demo + repo), set `portfolio_visible: true`.
  `portfolio_featured` left `false` pending Tyler's call on whether Stack
  Overlord should take the single hero slot (currently Cognitive Bridge).
- `data/resume_versions.yaml` → wired the three new accomplishment IDs into
  every version that already carried `stack-overlord-openai-build-week`
  (applied-ai, Deloitte agentic-ai, Deloitte agentic-se-ii, full-stack,
  portfolio-v1).
- `data/skills.yaml` → added `Postgres / Drizzle ORM` (Back-End) and
  `Playwright` (Testing, alias Vitest); added `OpenAI Responses API` alias
  to `Codex / GPT`; added `shadcn/ui` alias to `Tailwind CSS`; added
  Stack Overlord evidence to `TypeScript`, `Next.js`, and `GitHub Actions`.
