# Tyler Stahl

**Agentic Software Engineer**

Glen Rock, NJ · [Portfolio](https://tylerstahl.dev) · [GitHub](https://github.com/VolantTyler) · [LinkedIn](https://linkedin.com/in/tyler-j-stahl)
---

## Summary

Software engineer who ships production web platforms and uses AI-assisted delivery—Cursor Agent SDK orchestration, structured task breakdown, automated testing, and human review gates—to turn requirements into reliable build, test, and release outcomes.

---

## Experience

### Applied AI Developer — Independent R&D

*2026-02 – Present* · NJ
Building applied AI infrastructure spanning multi-agent orchestration, hybrid LLM inference, structured extraction pipelines, and human-in-the-loop controls. Working in multiple LLMs, harnesses, deployment stacks, and eval platforms.

- Shipped a Gemini-backed CrewAI orchestration layer with structured Supervisor decisions and sequential specialist task execution.
- Built a mention-driven Slack service with immediate ack, background crew execution, threaded replies, and HTTP health/agent roster APIs.
- Shipped an agentic scheduling product spanning ADK workflow, structured extraction, and a parent-facing schedule matrix.
- Built a review-and-resume HITL checkpoint so uncertain agent output is validated before it updates production schedule state.
- Added automated quality gates and regression baselines so agent workflow changes are validated before release.
- Shipped a full-stack agentic product with Firebase backend, React frontend, and Google Calendar integration.
- Shipped a distributed multi-agent research system with Python workers, SQLite persistence, and production-minded state management.
- Implemented Python data pipelines with durable SQLite state for agent-driven research and reporting.
- Added delivery controls around agent actions—HITL approvals, gateway whitelisting, and secrets management—before commits land.
- Used the Cursor Agent SDK to orchestrate evaluation and testing subagents with mandatory human review before high-stakes handoffs.
- Shipped a secured serverless Cognitive Bridge backend with Firebase Auth, Firestore state, and type-safe Gemini JSON responses driving UI and DB updates.
- Developed Stack Overlord for OpenAI Build Week with Codex/GPT-5.6-assisted delivery and GPT-5.6-powered project intelligence.
**Technologies:** Python, Google ADK 2.0, OpenClaw, CrewAI, Google Gemini, Gemma, FastAPI, Slack Bolt, Firebase, SQLite, Cursor Agent SDK, Weights & Biases Weave, Codex, GPT-5.6

### Front-End Developer — NAMI

*2024-12 – 2026-01* · Remote
Built and maintained NAMI's Laravel-based core business application with a focus on reusable UI components, accessibility, and Cypress E2E testing.

- Implemented a shared Tailwind component library plus Storybook for org-wide reuse, architecture standards, and faster UI delivery.
- Developed automated E2E testing pipelines with Cypress to reduce manual QA cycles and improve release confidence.
- Supported CCIE-TM registration release work by improving multi-date registration handling, documenting testing steps, and assisting staging release readiness.
**Technologies:** Laravel, Livewire, Alpine, Cypress, JavaScript, Tailwind CSS, Storybook, Figma, Adobe XD

### Software Engineer — Charity Navigator

*2023-08 – 2024-09* · NJ
Contributed to a high-traffic React/TypeScript data portal, GraphQL API transitions, and cross-functional delivery with product and data teams.

- Engineered portal features in React/TypeScript for a high-traffic nonprofit data platform.
- Supported GraphQL migration of legacy data flows for a high-traffic nonprofit platform.
- Connected MySQL data to the front-end through Sequelize for Charity Navigator portal features.
- Used Docker in Charity Navigator CI/CD deploy scripts for application delivery.
- Collaborated across product and data teams to translate requirements into portal and API improvements.
**Technologies:** React, TypeScript, GraphQL, JavaScript, Sequelize, MySQL, Docker

### Front-End Web Developer — Charity Navigator

*2019-03 – 2023-08* · NJ
Led frontend design and development for platform rebranding, technology migration, and high-traffic public web experiences.

- Contributed to end-to-end delivery of a large nonprofit platform rebuild and rebrand.
- Supported cross-functional marketing initiatives from large rebrand projects to rapid tactical website deployments.
**Technologies:** JavaScript, HTML5, CSS, React

### Founder & Web Developer — Volant Web Design

*2017-04 – 2019-03* · NJ
Founded and ran a web design business offering development, SEO, and analytics for clients across multiple industries.

- Owned end-to-end client delivery from requirements gathering through deployment and SEO reporting.
**Technologies:** PHP, JavaScript, HTML5, CSS


## Selected Projects

### AgentOS: Chief of Staff Agent — Independent R&D

*2025-2026*

Complex long-running workflows need reliable orchestration with mandatory human checkpoints.

Built a multi-agent orchestrator with the Cursor Agent SDK, modular subagents, and HITL handoffs for evaluation and testing stages.

**Technologies:** Cursor Agent SDK, Python

### Glen Rock AI Guild — Independent R&D

*2026*

A community AI club needed a mention-driven Slack assistant that could answer simple questions immediately while spinning up the right domain specialists for deeper technical, data, insurance, and writing work—without requiring a public webhook URL.

Built a CrewAI multi-agent backend with a Supervisor that classifies Slack mentions into simple vs detailed intents, dynamically selects Engineer / Data Analyst / Insurance SME / Web Designer / Writer agents, runs on Google Gemini with model failover, and exposes FastAPI health/roster endpoints plus Google Docs/Drive sync with mock fallback.

**Technologies:** CrewAI, Google Gemini, FastAPI, Slack Bolt, Socket Mode, Python, Pydantic, Google Docs API, Google Drive API, AgentOps

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

OpenAI Build Week required shipping a working product under tight hackathon constraints with AI-assisted development.

Built Stack Overlord primarily in Codex/GPT-5.6, with project intelligence powered by GPT-5.6.

**Technologies:** Codex, GPT-5.6

### NAMI 720 Event Platform — NAMI

*2024-2026*

Maintain and improve event-management workflows for nonprofit users and staff.

Contributed front-end implementation and Cypress testing practices in a Laravel/Livewire application.

**Technologies:** Laravel, Livewire, Alpine, Cypress

### Charity Navigator Data Review Portal — Charity Navigator

*2023-2024*

Internal and client data-review workflows needed a scalable React/TypeScript portal with modern API integration.

Engineered portal features, queried MySQL via Sequelize for front-end data, helped transition legacy flows into GraphQL, and worked with Docker-based CI/CD deploy scripts.

**Technologies:** React, TypeScript, GraphQL, Sequelize, MySQL, Docker


## Skills

**Applied AI:** Multi-agent orchestration, CrewAI, Antigravity, Codex / GPT, Human-in-the-loop controls, Agent evaluation, Vertex AI, Cursor Agent SDK, Model Context Protocol, Weights & Biases Weave
**Front-End:** JavaScript, React, TypeScript, Next.js, Performance optimization
**Back-End:** Firebase, Firestore, Sequelize, Python, FastAPI, Slack Bolt, Laravel, GraphQL, SQLite, Clerk OAuth
**Testing:** Cypress
**DevOps:** Docker, CI/CD, GitHub Actions
**Collaboration:** Release support, Stakeholder collaboration, Deep listening, Agile

## Education

- **Udacity** — Front-End Web Developer Nanodegree · Full scholarship from Google through the "Grow with Google" program.
- **Seattle University** — MA, Counseling
- **Dartmouth College** — BA, Anthropology
