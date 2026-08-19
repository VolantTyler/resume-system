# Tyler Stahl

**Applied AI Developer**

Glen Rock, NJ · [Portfolio](https://tylerstahl.dev) · [GitHub](https://github.com/VolantTyler) · [LinkedIn](https://linkedin.com/in/tyler-j-stahl)
---

## Summary

Full-stack software engineer and applied AI developer specializing in bridging multi-agent workflows with human-centric production environments—structured extraction, hybrid LLM inference, and HITL controls that turn autonomous systems into tools stakeholders trust.

---

## Experience

### Applied AI Developer — Independent R&D

*2026-02 – Present* · NJ
Building applied AI infrastructure spanning multi-agent orchestration, hybrid LLM inference, structured extraction pipelines, and human-in-the-loop controls. Working in multiple LLMs, harnesses, deployment stacks, and eval platforms.

- Designed intent-based CrewAI routing with dynamic Engineer/Analyst/Insurance SME/Writer selection and Gemini model failover for a community AI Guild backend.
- Wired Slack Bolt Socket Mode and FastAPI health/roster endpoints as the real-time interface for a CrewAI specialist Guild.
- Built resilient Docs/Drive persistence for multi-agent reports so missing Google credentials degrade to mock mode instead of breaking the crew.
- Shipped an MCP tool server that lets agents list and fetch distilled patterns (auth, deploy, evals, PII, orchestration) instead of rediscovering them per project.
- Made MCP auth client-config-driven (OAuth for cloud agents/Spark; Bearer for local/curl) with public OAuth discovery metadata for protected-resource challenges.
- Designed a Google ADK 2.0 conditional workflow with triager and interpreter agents for registration, disruption, and schedule analysis in a Kaggle Agents Intensive capstone.
- Designed privacy-by-design masking so Gemini sees placeholders for household PII while retaining public schedule context needed for accurate extraction.
- Routed low-confidence ADK extractions through a HITL node with persisted workflow state instead of silently writing uncertain schedule data.
- Measured InSummery agent quality with deterministic scoring suites and committed model baselines instead of vibe-only demos.
- Productionized an ADK agent workflow behind Firebase Auth and Cloud Functions with observability instrumentation.
- Architected an OpenClaw multi-agent ecosystem with orchestrator and specialist agents, durable SQLite state, and structured market-data extraction.
- Built a tri-tier inference strategy separating reasoning, verification, and formatting across cloud Gemini and local Gemma models, with reported ~40% token-cost optimization.
- Developed structured-extraction pipelines that turn unstructured web data into relational formats for agent workflows.
- Added human approval gates and strict subagent controls so high-stakes agent actions require validation before commit.
- Designed a Cursor Agent SDK orchestrator that splits evaluation and testing subagents behind HITL checkpoints.
- Migrated an AI Studio personality prototype to a serverless Python backend on Firebase/Vertex AI with durable Firestore agent memory.
- Shipped Stack Overlord in OpenAI Build Week using Codex/GPT-5.6 as the primary build stack and GPT-5.6 for project intelligence.
**Technologies:** Python, Google ADK 2.0, OpenClaw, CrewAI, Google Gemini, Gemma, FastAPI, Slack Bolt, Firebase, SQLite, Cursor Agent SDK, Weights & Biases Weave, Codex, GPT-5.6

### Front-End Developer — NAMI

*2024-12 – 2026-01* · Remote
Built and maintained NAMI's Laravel-based core business application with a focus on reusable UI components, accessibility, and Cypress E2E testing.

- Built a Tailwind-based design component library with a Storybook workflow for rapid iteration, enforcing UI standards across NAMI's core application.
- Led Cypress automated testing implementation for a Laravel/Livewire event platform, improving regression coverage and team confidence.
**Technologies:** Laravel, Livewire, Alpine, Cypress, JavaScript, Tailwind CSS, Storybook, Figma, Adobe XD

### Software Engineer — Charity Navigator

*2023-08 – 2024-09* · NJ
Contributed to a high-traffic React/TypeScript data portal, GraphQL API transitions, and cross-functional delivery with product and data teams.

- Built React/TypeScript portal features for 50,000+ clients and helped sustain high-traffic events with hundreds of thousands of concurrent visitors.
- Helped transition legacy data flows into GraphQL API endpoints, streamlining backend-to-frontend communication.
**Technologies:** React, TypeScript, GraphQL, JavaScript, Sequelize, MySQL, Docker

### Front-End Web Developer — Charity Navigator

*2019-03 – 2023-08* · NJ
Led frontend design and development for platform rebranding, technology migration, and high-traffic public web experiences.

- Led frontend execution of a major rebrand and platform rebuild serving 11M+ annual users in collaboration with external design agencies.
- Partnered with the CMO and marketing team on rebrand work and time-sensitive website feature launches.
**Technologies:** JavaScript, HTML5, CSS, React

### Founder & Web Developer — Volant Web Design

*2017-04 – 2019-03* · NJ
Founded and ran a web design business offering development, SEO, and analytics for clients across multiple industries.

- Founded a web design business delivering PHP/JS sites, SEO, and analytics for clients across multiple industries.
**Technologies:** PHP, JavaScript, HTML5, CSS


## Selected Projects

### Glen Rock AI Guild — Independent R&D

*2026*

A community AI club needed a mention-driven Slack assistant that could answer simple questions immediately while spinning up the right domain specialists for deeper technical, data, insurance, and writing work—without requiring a public webhook URL.

Built a CrewAI multi-agent backend with a Supervisor that classifies Slack mentions into simple vs detailed intents, dynamically selects Engineer / Data Analyst / Insurance SME / Web Designer / Writer agents, runs on Google Gemini with model failover, and exposes FastAPI health/roster endpoints plus Google Docs/Drive sync with mock fallback.

**Technologies:** CrewAI, Google Gemini, FastAPI, Slack Bolt, Socket Mode, Python, Pydantic, Google Docs API, Google Drive API, AgentOps

### Development Knowledge Vault — Independent R&D

*2026*

AI coding agents on new projects rediscover the same deploy, auth, eval, and security practices instead of reusing distilled patterns from prior agent and product repos.

Built a Vercel-hosted MCP server that exposes markdown engineering patterns as tools (`list_patterns`, `get_pattern`), with dual auth on one URL—Clerk OAuth for cloud clients and an optional shared-secret Bearer for local/curl—so Cursor, Gemini Spark, and other MCP clients can pull operational preferences and prior solutions at request time.

**Technologies:** Next.js, Vercel, MCP, Clerk, OAuth, TypeScript, Markdown

### InSummery.AI — Independent R&D

*2026*

Family scheduling information lives in messy emails, texts, and PDFs; calendar apps assume tidy manual entry and do not detect multi-child childcare gaps or real-time disruptions with a human still in control.

Built a Google ADK 2.0 multi-agent concierge that masks PII, triages and extracts schedule data, pauses below 80% confidence for HITL clarification, maintains a multi-child schedule matrix with absolute/relative gap analysis, and syncs disruptions to Google Calendar—shipped as a Kaggle + Google 5-Day AI Agents Intensive Consult-track capstone.

**Technologies:** Google ADK 2.0, Python, Pydantic, Google Gemini, Vertex AI, Gemma, Ollama, Firebase, Firebase Cloud Functions, Cloud Firestore, Firebase Authentication, React, Vite, Google Calendar API, OpenTelemetry

### OpenClaw Multi-Agent Market Intelligence Ecosystem — Independent R&D

*2025-2026*

Long-running agentic market-research tasks lose state and context without durable memory and governance when synthesizing fragmented commodity and market data.

Built an autonomous research framework on OpenClaw with specialized agents (data pull, profitability analysis, dashboard UI, orchestrator), SQLite persistence, Python ETL workers, and HITL approval gates—applied to real-world and World of Warcraft commodity markets.

**Technologies:** OpenClaw, Python, SQLite, Google Gemini, Gemma

### Tri-Tier Hybrid Inference Pilot — Independent R&D

*2025-2026*

Agentic workloads need a practical balance of reasoning quality, latency, cost, and privacy across cloud and local models.

Designed a routing strategy that sends complex reasoning to stronger cloud/local models and offloads formatting and utility work to faster, cheaper models via Ollama-hosted local Gemma and cloud Gemini.

**Technologies:** Google Gemini, Gemma, Ollama, Antigravity, Python

### AgentOS: Chief of Staff Agent — Independent R&D

*2025-2026*

Complex long-running workflows need reliable orchestration with mandatory human checkpoints.

Built a multi-agent orchestrator with the Cursor Agent SDK, modular subagents, and HITL handoffs for evaluation and testing stages.

**Technologies:** Cursor Agent SDK, Python

### Cognitive Bridge: AI Personality Alignment — Independent R&D

*2025-2026*

Human-AI collaboration can suffer when agent personality is poorly matched to the user, and prototypes need a path from AI Studio into secured production backends.

Built an OCEAN-based personality alignment prototype in Google AI Studio, then productionized it on Firebase Cloud Functions with Firestore memory, Firebase Auth, Vertex AI, and Pydantic-validated structured Gemini outputs.

**Technologies:** Google AI Studio, Google Gemini, Firebase, Firebase Cloud Functions, Cloud Firestore, Firebase Authentication, Vertex AI, Pydantic, Python

### Stack Overlord — Independent R&D

*2026*

OpenAI Build Week required shipping a working product under tight hackathon constraints with AI-assisted development.

Built Stack Overlord primarily in Codex/GPT-5.6, with project intelligence powered by GPT-5.6.

**Technologies:** Codex, GPT-5.6


## Skills

**Applied AI:** Multi-agent orchestration, CrewAI, Hybrid LLM inference, Antigravity, Gemma4, Google AI Studio, Codex / GPT, Human-in-the-loop controls, PII masking, Agent evaluation, Embeddings / RAG, Vertex AI, Ollama, Cursor Agent SDK, Model Context Protocol, Weights & Biases Weave
**Front-End:** Next.js
**Back-End:** Firebase, Firestore, Python, FastAPI, Slack Bolt, Google Docs / Drive APIs, SQLite, Clerk OAuth
**DevOps:** Docker
**Collaboration:** Stakeholder collaboration, Deep listening, Consensus-building, Cross-department collaboration

## Education

- **Udacity** — Front-End Web Developer Nanodegree · Full scholarship from Google through the "Grow with Google" program.
- **Seattle University** — MA, Counseling
- **Dartmouth College** — BA, Anthropology
- **Google Skills** — Google AI Summit · Jun 2026 (pending)
- **Kaggle** — 5-Day AI Agents: Intensive Vibe Coding Course with Google · Jun 2026 (pending)
- **DeepLearning.AI** — Agentic AI · May 2026
- **Breach Secure Now** — Artificial Intelligence (AI) Skills in Action · Oct 2025
- **Breach Secure Now** — Artificial Intelligence (AI) Fundamentals · Oct 2025
- **Breach Secure Now** — 2025 Cybersecurity Training · Jan 2025
- **IBM** — Enterprise Design Thinking Practitioner · Jun 2021
