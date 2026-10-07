# Intake: State of AI Briefing (2026-10-07)

Facts captured from the deployed site (https://state-of-ai-briefing.vercel.app/) and the public GitHub README (https://github.com/VolantTyler/state-of-ai-briefing). Cross-checked that architecture and refresh behavior descriptions match README sections on pipeline layout, secrets, and panel refresh — not marketing copy on the live dashboard.

## Facts captured (no invented metrics)

- A periodically refreshed industry dashboard deployed as a public static site on Vercel; GitHub Actions runs the refresh job and Vercel serves committed files from the CDN.
- `scripts/refresh.js` is the Actions entry point and the only place the Anthropic API key is used; it commits `public/data/values.json`, `trend.csv`, `store-ranks.json`, and `usage.json` to the repo.
- Daily job at 08:00 UTC plus a separate Sunday 10:00 UTC valuations job (times documented in repo `docs/refresh.md`).
- Browser reads `/data/*.json` with no API key, no database, and no per-visitor state; git history acts as the auditable trend log.
- Refresh uses Anthropic API (filtered web search for valuations on Sonnet by default; Haiku panels with web search where configured), direct Yahoo Finance chart fetches for public-market closes, and US App Store / Google Play chart fetches for store ranks.
- Spend guard via `REFRESH_MAX_USD` (default $1); failed panels retain prior values and are marked failed in `values.json`.
- Dashboard implemented in Vite/React (`src/App.jsx`); shared briefing schema in `src/briefing-data.js`.
- Live site edition v2.6 dated 2026-10-06; sections cover private valuations, public markets, model capability, usage, app store rankings, capital, energy/data centers, China position, and a trend log.

## YAML updates

- `data/projects.yaml` → `state-of-ai-briefing`
- `data/accomplishments.yaml` → `soai-briefing-static-publish-pipeline`, `soai-briefing-anthropic-refresh-pipeline`
- `data/experience.yaml` → Independent R&D wiring
- `data/resume_versions.yaml` → applied-ai, Deloitte/Google FDE, full-stack, portfolio-v1
- `data/skills.yaml` → Anthropic API skill; GitHub Actions evidence link
