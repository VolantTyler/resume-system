# Tyler Stahl

**Front-End Engineer II, Amazon Quick**

Glen Rock, NJ · [Portfolio](https://tylerstahl.dev) · [GitHub](https://github.com/VolantTyler) · [LinkedIn](https://linkedin.com/in/tyler-j-stahl)
---

## Application Fit

*Front-End Engineer II, Amazon Quick (Governance Platform)*

Strong fit for AI interaction design and enterprise admin UX. React/TypeScript portals, design-system work, HITL agent products, Agile at CN/NAMI, and front-end performance (traces, analytics, time to paint) map to Quick Governance. Angular and AWS/Cloudscape remain out of source evidence by confirmation.

**Strongest alignment**

- **Agentic / conversational UX with human control points.** Experience → Independent R&D (HITL gates, approval controls) and Selected Projects → InSummery.AI / Cognitive Bridge / OpenClaw
- **Design-system UI and Agile delivery.** Experience → NAMI (component library, Storybook, a11y, Agile) and Experience → Charity Navigator (Agile)
- **React/TypeScript product UI with performance work.** Experience → Charity Navigator (portal scale; traces/analytics and reduced time to paint)

**Weakest / indirect alignment**

- **AWS Cloudscape.** AWS denied in gap interview; NAMI design-system habits and Firebase/Vertex shipping are the transfer story, not AWS tenure.
- **Angular.** Denied in gap interview; documented path is React/TypeScript.
- **Enterprise AI policy admin at Quick scale.** No Quick/Cloudscape policy-builder tenure; closest bridge is HITL/governance controls in agent products plus nonprofit operator portals.

---

## Summary

Product-minded engineer who designs trustworthy AI experiences—HITL approvals, privacy-by-design PII handling, and accessible operator UX—pairing multi-agent production work with an MA in Counseling that treats safe human handoffs as a first-class product behavior. Comfortable translating stakeholder needs into demos and shipped interfaces for security and governance workflows.

---

## Experience

### Applied AI Developer — Independent R&D

*2026-02 – Present* · NJ
Building applied AI infrastructure spanning multi-agent orchestration, hybrid LLM inference, structured extraction pipelines, and human-in-the-loop controls. Working in multiple LLMs, harnesses, deployment stacks, and eval platforms.

- Designed a Google ADK 2.0 conditional workflow with triager and interpreter agents for registration, disruption, and schedule analysis in a Kaggle Agents Intensive capstone.
- Designed privacy-by-design masking so Gemini sees placeholders for household PII while retaining public schedule context needed for accurate extraction.
- Routed low-confidence ADK extractions through a HITL node with persisted workflow state instead of silently writing uncertain schedule data.
- Combined deterministic matrix analysis with calendar updates so parents see uncovered hours and disrupted slots at a glance.
- Measured InSummery agent quality with deterministic scoring suites and committed model baselines instead of vibe-only demos.
- Productionized an ADK agent workflow behind Firebase Auth and Cloud Functions with observability instrumentation.
- Architected an OpenClaw multi-agent ecosystem with orchestrator and specialist agents, durable SQLite state, and structured market-data extraction.
- Added human approval gates and strict subagent controls so high-stakes agent actions require validation before commit.
- Designed a Cursor Agent SDK orchestrator that splits evaluation and testing subagents behind HITL checkpoints.
- Prototyped Gemini-backed personality alignment using brief user interviews and OCEAN trait maps.
- Migrated an AI Studio personality prototype to a serverless Python backend on Firebase/Vertex AI with durable Firestore agent memory.
**Technologies:** Python, Google ADK 2.0, OpenClaw, CrewAI, Google Gemini, Gemma, FastAPI, Slack Bolt, Firebase, SQLite, Cursor Agent SDK, Weights & Biases Weave, Codex, GPT-5.6

### Front-End Developer — NAMI

*2024-12 – 2026-01* · Remote
Built and maintained NAMI's Laravel-based core business application with a focus on reusable UI components, accessibility, and Cypress E2E testing.

- Built a Tailwind-based design component library with a Storybook workflow for rapid iteration, enforcing UI standards across NAMI's core application.
- Led Cypress automated testing implementation for a Laravel/Livewire event platform, improving regression coverage and team confidence.
- Contributed to accessibility and code-quality audits that increased aggregate compliance score by 30%.
- Operated in fully Agile software development settings throughout Charity Navigator and NAMI front-end roles.
**Technologies:** Laravel, Livewire, Alpine, Cypress, JavaScript, Tailwind CSS, Storybook, Figma, Adobe XD

### Founder & Web Developer — Volant Web Design

*2024-09 – Present* · NJ
Resumed sole-proprietorship web design and development work for B2B clients, covering requirements through production deployment and SEO.

- Delivered full-stack client websites and SEO/analytics reporting from requirements through production deployment.
**Technologies:** PHP, JavaScript, HTML5, CSS

### Software Engineer — Charity Navigator

*2023-08 – 2024-09* · NJ
Contributed to a high-traffic React/TypeScript data portal, GraphQL API transitions, and cross-functional delivery with product and data teams.

- Built React/TypeScript portal features for 50,000+ clients and helped sustain high-traffic events with hundreds of thousands of concurrent visitors.
- Partnered with product and data teams to ship tools that streamlined data-review processes.
- Operated in fully Agile software development settings throughout Charity Navigator and NAMI front-end roles.
- Improved front-end performance by adding traces and analytics and reducing time to paint.
**Technologies:** React, TypeScript, GraphQL, JavaScript, Sequelize, MySQL, Docker

### Front-End Web Developer — Charity Navigator

*2019-03 – 2023-08* · NJ
Led frontend design and development for platform rebranding, technology migration, and high-traffic public web experiences.

- Led frontend execution of a major rebrand and platform rebuild serving 10M+ annual users in collaboration with external design agencies.
- Partnered with the CMO and marketing team on rebrand work and time-sensitive website feature launches.
**Technologies:** JavaScript, HTML5, CSS, React


## Selected Projects

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

### NAMI Design Component Library — NAMI

*2024-2026*

Front-end delivery needed stronger architecture standards and reusable UI patterns across the core business application.

Built a Tailwind-based centralized design component library—including a custom org-wide shared library and a Storybook version for rapid iteration and testing—to enforce standards and streamline UI deployment.

**Technologies:** Laravel, Livewire, JavaScript, Tailwind CSS, Storybook

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

### Charity Navigator Platform Rebuild — Charity Navigator

*2019-2023*

Modernize and rebrand a high-traffic nonprofit platform serving millions of annual users.

Led frontend execution of the 20th-anniversary rebrand and platform rebuild in collaboration with external design agencies and internal stakeholders.

**Technologies:** JavaScript, HTML5, CSS, React


## Skills

**Front-End:** JavaScript, React, TypeScript, Performance optimization
**Collaboration:** Agile

## Education

- **Udacity** — Front-End Web Developer Nanodegree · Full scholarship from Google through the "Grow with Google" program.
- **Seattle University** — MA, Counseling
- **Dartmouth College** — BA, Anthropology
