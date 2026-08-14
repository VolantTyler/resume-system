# Tyler Stahl

**Forward Deployed Engineer**

Glen Rock, NJ · [Portfolio](https://tylerstahl.dev) · [GitHub](https://github.com/VolantTyler) · [LinkedIn](https://linkedin.com/in/tyler-j-stahl)
---

## Application Fit

*Deloitte Forward Deployed Engineer, Frontier GenAI (req 350555)*

Strong fit for rapid GenAI prototyping (especially on Google platforms), agentic workflows with enterprise-ready guardrails, and collaborating with stakeholders and executives to ship production-quality software. Quick study on learning new technologies. Deep listening and communication skills from years as a counselor.

**Strongest alignment**

- **Production GenAI and agentic workflow delivery on Google platforms** — Independent R&D plus InSummery.AI and Cognitive Bridge—Google ADK workflows, Gemini/Vertex integration, and production Firebase deployment.
- **Human-in-the-loop controls, evaluation, and responsible AI patterns** — InSummery.AI (confidence gates, eval harness, PII masking) and OpenClaw multi-agent work with approval gates before high-stakes actions.
- **Translating ambiguous business needs into working software with senior stakeholders** — Charity Navigator cross-functional delivery and CMO partnership; Volant Web Design client engagements from requirements through production.

**Additional alignment**

- **Formal engagement / workstream leadership at enterprise consulting scale** — Background centers on hands-on engineering and independent client delivery rather than titled engagement-lead roles; Charity Navigator work with the CMO and cross-functional product/data teams shows comfort owning stakeholder-facing outcomes in complex organizations.
- **Hybrid onshore/offshore pod operations** — Experience is in remote and hybrid product engineering rather than formal onshore/offshore pod leadership; practiced collaborating across distributed teams in async, cross-functional settings.
- **Multi-cloud (AWS/Azure) and enterprise data-engineering stack depth** — Deepest production cloud work is on Google Cloud (Firebase, Vertex AI); high-traffic web and GraphQL platform engineering at Charity Navigator demonstrates transferable enterprise platform experience.

---

## Summary

Forward-leaning applied AI engineer who prototypes and ships GenAI solutions with Gemini/Vertex, agentic workflows, and human-in-the-loop controls—translating ambiguous stakeholder needs into working software, from nonprofit product delivery to productionized agent systems.

---

## Experience

### Applied AI Developer — Independent R&D

*2026-02 – Present* · NJ
Building applied AI infrastructure spanning multi-agent orchestration, hybrid LLM inference, structured extraction pipelines, and human-in-the-loop controls. Working in multiple LLMs, harnesses, deployment stacks, and eval platforms.

- Shipped GenAI prototypes to production on Google Cloud—Gemini/Vertex AI with Firebase Auth, Cloud Functions, and Firestore—from ambiguous requirements through deployable agent workflows.
- Applied HITL confidence gates and approval controls with deterministic LLM evaluation baselines—instrumented in Weights & Biases Weave—so agent output is measured and reviewed before production writes.
- Orchestrated multi-agent workflows with the Cursor Agent SDK—modular subagents, HITL checkpoints, and structured requirements-to-production delivery for evaluation and testing stages.
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
- Helped transition legacy data flows into GraphQL API endpoints, streamlining backend-to-frontend communication.
- Partnered with product and data teams to ship tools that streamlined data-review processes.
**Technologies:** React, TypeScript, GraphQL, JavaScript, Sequelize, MySQL, Docker

### Front-End Web Developer — Charity Navigator

*2019-03 – 2023-08* · NJ
Led frontend design and development for platform rebranding, technology migration, and high-traffic public web experiences.

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

### Stack Overlord — Independent R&D

*2026*

OpenAI Build Week required shipping a working product under tight hackathon constraints with AI-assisted development.

Built Stack Overlord primarily in Codex/GPT-5.6, with project intelligence powered by GPT-5.6.

**Technologies:** Codex, GPT-5.6

### Charity Navigator Data Review Portal — Charity Navigator

*2023-2024*

Internal and client data-review workflows needed a scalable React/TypeScript portal with modern API integration.

Engineered portal features, queried MySQL via Sequelize for front-end data, helped transition legacy flows into GraphQL, and worked with Docker-based CI/CD deploy scripts.

**Technologies:** React, TypeScript, GraphQL, Sequelize, MySQL, Docker


## Skills

**Applied AI:** Multi-agent orchestration, CrewAI, Hybrid LLM inference, Antigravity, Gemma4, Google AI Studio, Codex / GPT, Human-in-the-loop controls, PII masking, Agent evaluation, Embeddings / RAG, Vertex AI, Ollama, Cursor Agent SDK, Model Context Protocol, Weights & Biases Weave
**Front-End:** JavaScript, React, TypeScript, Next.js, UX Design / Prototyping, Performance optimization
**Back-End:** Firebase, Firestore, Sequelize, Python, FastAPI, Slack Bolt, Google Docs / Drive APIs, GraphQL, SQLite, Clerk OAuth
**Testing:** Cypress
**DevOps:** Docker, CI/CD, GitHub Actions
**Collaboration:** Stakeholder collaboration, Deep listening, Agile

## Education

- **Udacity** — Front-End Web Developer Nanodegree · Full scholarship from Google through the "Grow with Google" program.
- **Seattle University** — MA, Counseling
- **Dartmouth College** — BA, Anthropology
