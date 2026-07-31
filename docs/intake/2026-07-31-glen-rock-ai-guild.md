# Intake: Glen Rock AI Guild Backend (2026-07-31)

User pasted the Glen Rock AI Guild Backend README (CrewAI / Gemini / FastAPI / Slack Socket Mode augment demo for Glen Rock AI Club). Cross-checked against local repo `graic-augment-demo-antigravity` (`https://github.com/VolantTyler/graic-augment-demo-antigravity`).

## Facts captured (no invented metrics)

- Multi-agent orchestration backend: CrewAI + Google Gemini (`gemini-3.6-flash` primary with automatic failover to `gemini-2.0-flash` / lite variants) + FastAPI + Slack Bolt Socket Mode.
- Slack mention `@Glen Rock AI Guild <topic>` → Supervisor intent routing:
  - `simple`: direct Supervisor response for greetings / straightforward questions
  - `detailed`: dynamically spins up only needed specialists (Engineer, Data Analyst, Insurance SME, Web Designer, Writer)
- Google Docs & Drive create/read/sync via OAuth (personal Gmail) or service account (Workspace); mock fallback if credentials missing so workflows do not fail.
- Optional AgentOps observability when `AGENTOPS_API_KEY` is set.
- HTTP surface: `/`, `/health`, `/agents`; Slack `/agents-list` for specialist roster.
- Python 3.10–3.13 required (`crewai` enforces `<3.14`).

## YAML updates

- `data/projects.yaml` → `glen-rock-ai-guild`
- `data/accomplishments.yaml` → `graic-crewai-supervisor-routing`, `graic-slack-fastapi-backend`, `graic-gdocs-drive-integration`
- `data/experience.yaml` → Independent R&D wiring
- `data/skills.yaml` → CrewAI, FastAPI, Slack Bolt, Google Docs/Drive (+ evidence links)
- `data/resume_versions.yaml` → applied-ai, agentic, FDE, full-stack, portfolio versions
