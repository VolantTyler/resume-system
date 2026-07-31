# Intake: Development Knowledge Vault (2026-07-31)

User provided the Development Knowledge Vault README and pointed at the live MCP (`user-knowledge-vault`).

## Facts captured (no invented metrics)

- Vercel-hosted MCP server; patterns as markdown under `patterns/`, read at request time.
- Tools: `list_patterns`, `get_pattern`.
- Production URL: `https://development-knowledge-vault.vercel.app/api/mcp/mcp`
- Dual auth on one URL: Bearer `MCP_SECRET_KEY` OR Clerk OAuth access token; client config chooses path.
- Pattern corpus includes USER, SOURCES, deploy, evals, PII, multi-agent, Cursor workflows, YAML SOT, etc.
- Personal Cursor skill created at `~/.cursor/skills/knowledge-vault/SKILL.md`.

## YAML updates

- `data/projects.yaml` → `development-knowledge-vault`
- `data/accomplishments.yaml` → `knowledge-vault-mcp-server`, `knowledge-vault-dual-auth`
- `data/experience.yaml` → Independent R&D wiring
- `data/skills.yaml` → MCP, Next.js/Vercel, Clerk OAuth (+ evidence links)
