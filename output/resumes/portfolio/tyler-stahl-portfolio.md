# Tyler Stahl

**Portfolio-Focused Software Engineer**

Glen Rock, NJ · [Portfolio](https://tylerstahl.dev) · [GitHub](https://github.com/VolantTyler) · [LinkedIn](https://linkedin.com/in/tyler-j-stahl)
---

## Summary

Full-stack software engineer with experience shipping React/TypeScript and Laravel applications at nonprofit scale, plus hands-on applied AI systems work.

---

## Experience

### Applied AI Developer — Independent R&D

*2026-02 – Present* · NJ
Building applied AI infrastructure spanning multi-agent orchestration, hybrid LLM inference, structured extraction pipelines, and human-in-the-loop controls. Working in multiple LLMs, harnesses, deployment stacks, and eval platforms.

- Built a CrewAI Supervisor that routes simple Slack prompts to a direct answer and detailed requests to a dynamically selected specialist crew.
- Shipped a FastAPI + Slack Socket Mode backend that turns @mentions into threaded multi-agent Guild reports without a public webhook.
- Built a Vercel-hosted MCP knowledge vault that serves reusable engineering patterns as tools for AI coding agents.
- Designed one-URL MCP auth that accepts either a shared-secret Bearer token or a Clerk OAuth access token based on the client request.
- Built InSummery.AI, an ADK multi-agent family schedule concierge that turns messy registration and disruption messages into a structured multi-child schedule.
- Deployed InSummery on Firebase (Auth, Cloud Functions, Firestore) with a React dashboard and local CLI mode for zero-cloud demos.
- Built a multi-agent market-intelligence pilot on OpenClaw with specialized agents and SQLite-backed durable memory for long-running research workflows.
- Built Stack Overlord for OpenAI Build Week primarily with Codex/GPT-5.6, using GPT-5.6 for project intelligence.
**Technologies:** Python, Google ADK 2.0, OpenClaw, CrewAI, Google Gemini, Gemma, FastAPI, Slack Bolt, Firebase, SQLite, Cursor Agent SDK, Weights & Biases Weave, Codex, GPT-5.6

### Front-End Developer — NAMI

*2024-12 – 2026-01* · Remote
Built and maintained NAMI's Laravel-based core business application with a focus on reusable UI components, accessibility, and Cypress E2E testing.

- Led Cypress automated testing implementation for a Laravel/Livewire event platform, improving regression coverage and team confidence.
**Technologies:** Laravel, Livewire, Alpine, Cypress, JavaScript, Tailwind CSS, Storybook, Figma, Adobe XD

### Software Engineer — Charity Navigator

*2023-08 – 2024-09* · NJ
Contributed to a high-traffic React/TypeScript data portal, GraphQL API transitions, and cross-functional delivery with product and data teams.

- Built React/TypeScript portal features for 50,000+ clients and helped sustain high-traffic events with hundreds of thousands of concurrent visitors.
**Technologies:** React, TypeScript, GraphQL, JavaScript, Sequelize, MySQL, Docker

### Front-End Web Developer — Charity Navigator

*2019-03 – 2023-08* · NJ
Led frontend design and development for platform rebranding, technology migration, and high-traffic public web experiences.

- Led frontend execution of a major rebrand and platform rebuild serving 11M+ annual users in collaboration with external design agencies.
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

### Cognitive Bridge: AI Personality Alignment — Independent R&D

*2025-2026*

Human-AI collaboration can suffer when agent personality is poorly matched to the user, and prototypes need a path from AI Studio into secured production backends.

Built an OCEAN-based personality alignment prototype in Google AI Studio, then productionized it on Firebase Cloud Functions with Firestore memory, Firebase Auth, Vertex AI, and Pydantic-validated structured Gemini outputs.

**Technologies:** Google AI Studio, Google Gemini, Firebase, Firebase Cloud Functions, Cloud Firestore, Firebase Authentication, Vertex AI, Pydantic, Python

### AgentOS: Chief of Staff Agent — Independent R&D

*2025-2026*

Complex long-running workflows need reliable orchestration with mandatory human checkpoints.

Built a multi-agent orchestrator with the Cursor Agent SDK, modular subagents, and HITL handoffs for evaluation and testing stages.

**Technologies:** Cursor Agent SDK, Python

### Stack Overlord — Independent R&D

*2026*

OpenAI Build Week required shipping a working product under tight hackathon constraints with AI-assisted development.

Built Stack Overlord primarily in Codex/GPT-5.6, with project intelligence powered by GPT-5.6.

**Technologies:** Codex, GPT-5.6

### Charity Navigator Platform Rebuild — Charity Navigator

*2019-2023*

Modernize and rebrand a high-traffic nonprofit platform serving millions of annual users.

Led frontend execution of the 20th-anniversary rebrand and platform rebuild in collaboration with external design agencies and internal stakeholders.

**Technologies:** JavaScript, HTML5, CSS, React



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
