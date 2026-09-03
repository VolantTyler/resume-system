# Tyler Stahl

**Full-Stack Engineer**

Glen Rock, NJ · [Portfolio](https://tylerstahl.dev) · [GitHub](https://github.com/VolantTyler) · [LinkedIn](https://linkedin.com/in/tyler-j-stahl)
---

## Summary

Full-stack software engineer with experience shipping React/TypeScript and Laravel applications at nonprofit scale, plus hands-on applied AI systems work.

---

## Experience

### Applied AI Developer — Independent R&D

*2026-02 – Present* · NJ
Building applied AI infrastructure spanning multi-agent orchestration, hybrid LLM inference, structured extraction pipelines, and human-in-the-loop controls. Working in multiple LLMs, harnesses, deployment stacks, and eval platforms.

- Shipped a Gemini-backed CrewAI orchestration layer with structured Supervisor decisions and sequential specialist task execution.
- Built a mention-driven Slack service with immediate ack, background crew execution, threaded replies, and HTTP health/agent roster APIs.
- Integrated Google Docs and Drive APIs with personal OAuth and service-account paths plus safe mock mode for demo environments.
- Deployed a Next.js MCP endpoint on Vercel that loads markdown patterns at request time for cross-client agent tooling.
- Wired Clerk OAuth and optional MCP_SECRET_KEY Bearer acceptance into a Next.js MCP route with well-known authorization-server and protected-resource endpoints left public.
- Shipped an agentic scheduling product spanning ADK workflow, structured extraction, and a parent-facing schedule matrix.
- Connected structured schedule state to Google Calendar sync and a parent-facing dashboard.
- Shipped a full-stack agentic product with Firebase backend, React frontend, and Google Calendar integration.
- Shipped a distributed multi-agent research system with Python workers, SQLite persistence, and production-minded state management.
- Implemented Python data pipelines with durable SQLite state for agent-driven research and reporting.
- Shipped a secured serverless Cognitive Bridge backend with Firebase Auth, Firestore state, and type-safe Gemini JSON responses driving UI and DB updates.
- Developed Stack Overlord for OpenAI Build Week with Codex/GPT-5.6-assisted delivery and GPT-5.6-powered project intelligence.
**Technologies:** Python, Google ADK 2.0, OpenClaw, CrewAI, Google Gemini, Gemma, FastAPI, Slack Bolt, Firebase, SQLite, Cursor Agent SDK, Weights & Biases Weave, Codex, GPT-5.6

### Front-End Developer — NAMI

*2024-12 – 2026-01* · Remote
Built and maintained NAMI's Laravel-based core business application with a focus on reusable UI components, accessibility, and Cypress E2E testing.

- Implemented a shared Tailwind component library plus Storybook for org-wide reuse, architecture standards, and faster UI delivery.
- Used Figma and Adobe XD to prototype event-planning journeys that informed front-end delivery.
- Developed automated E2E testing pipelines with Cypress to reduce manual QA cycles and improve release confidence.
**Technologies:** Laravel, Livewire, Alpine, Cypress, JavaScript, Tailwind CSS, Storybook, Figma, Adobe XD

### Software Engineer — Charity Navigator

*2023-08 – 2024-09* · NJ
Contributed to a high-traffic React/TypeScript data portal, GraphQL API transitions, and cross-functional delivery with product and data teams.

- Engineered portal features in React/TypeScript for a high-traffic nonprofit data platform.
- Supported GraphQL migration of legacy data flows for a high-traffic nonprofit platform.
- Connected MySQL data to the front-end through Sequelize for Charity Navigator portal features.
- Used Docker in Charity Navigator CI/CD deploy scripts for application delivery.
**Technologies:** React, TypeScript, GraphQL, JavaScript, Sequelize, MySQL, Docker

### Front-End Web Developer — Charity Navigator

*2019-03 – 2023-08* · NJ
Led frontend design and development for platform rebranding, technology migration, and high-traffic public web experiences.

- Contributed to end-to-end delivery of a large nonprofit platform rebuild and rebrand.
- Supported cross-functional marketing initiatives from large rebrand projects to rapid tactical website deployments.
- Shipped full-stack initiatives linked to a $5M grant and 43% processing-efficiency improvement.
**Technologies:** JavaScript, HTML5, CSS, React

### Founder & Web Developer — Volant Web Design

*2017-04 – 2019-03* · NJ
Founded and ran a web design business offering development, SEO, and analytics for clients across multiple industries.

- Owned end-to-end client delivery from requirements gathering through deployment and SEO reporting.
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

### Stack Overlord — Independent R&D

*2026*

A merge can succeed in GitHub while its post-merge deployment fails silently (credentials, quotas, environment config), leaving production stale with no clear notification signal—built for OpenAI Build Week 2026's Developer Tools track under tight hackathon constraints, primarily via Codex/GPT-5.6.

Built a Next.js/TypeScript command center that ingests signed GitHub Actions webhooks into a durable Postgres/Drizzle ledger (GitHub stays the source of truth for pass/fail), diagnoses failures with the OpenAI Responses API (GPT-5.6) using evidence citations, confidence levels, and verification steps, alerts Slack, and ships a deterministic credential-free demo mode so judges can exercise the whole flow.

**Technologies:** Codex, GPT-5.6, Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Postgres, Drizzle ORM, OpenAI Responses API, Vercel, Playwright, Vitest, GitHub Actions, Slack Bolt

### NAMI Design Component Library — NAMI

*2024-2026*

Front-end delivery needed stronger architecture standards and reusable UI patterns across the core business application.

Built a Tailwind-based centralized design component library—including a custom org-wide shared library and a Storybook version for rapid iteration and testing—to enforce standards and streamline UI deployment.

**Technologies:** Laravel, Livewire, JavaScript, Tailwind CSS, Storybook

### NAMI Internal Event Planning UX — NAMI

*2024-2026*

Internal event planning workflows needed clearer user journeys before front-end implementation.

Prototyped new user journeys in Figma and Adobe XD for NAMI's internal event planning tool.

**Technologies:** Figma, Adobe XD

### Charity Navigator Data Review Portal — Charity Navigator

*2023-2024*

Internal and client data-review workflows needed a scalable React/TypeScript portal with modern API integration.

Engineered portal features, queried MySQL via Sequelize for front-end data, helped transition legacy flows into GraphQL, and worked with Docker-based CI/CD deploy scripts.

**Technologies:** React, TypeScript, GraphQL, Sequelize, MySQL, Docker

### Charity Navigator Platform Rebuild — Charity Navigator

*2019-2023*

Modernize and rebrand a high-traffic nonprofit platform serving millions of annual users.

Led frontend execution of the 20th-anniversary rebrand and platform rebuild in collaboration with external design agencies and internal stakeholders.

**Technologies:** JavaScript, HTML5, CSS, React


## Skills

**Applied AI:** Google AI Studio, Codex / GPT, PII masking, Model Context Protocol
**Front-End:** JavaScript, React, TypeScript, Next.js, Tailwind CSS, Figma, Adobe XD, Storybook, UX Design / Prototyping, Performance optimization
**Back-End:** Firebase, Firestore, Sequelize, Postgres / Drizzle ORM, FastAPI, Slack Bolt, Google Docs / Drive APIs, Laravel, GraphQL, SQLite, Clerk OAuth, PHP
**Testing:** Cypress, Playwright
**DevOps:** Docker, CI/CD, GitHub Actions
**Collaboration:** Stakeholder collaboration, Deep listening, Agile / Scrum, Consensus-building, Cross-department collaboration

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
