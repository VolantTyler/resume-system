# Tyler Stahl

**Forward Deployed Engineer**

Glen Rock, NJ · [Portfolio](https://tylerstahl.dev) · [GitHub](https://github.com/VolantTyler) · [LinkedIn](https://linkedin.com/in/tyler-j-stahl)
---

## Application Fit

*Google Cloud Forward Deployed Engineer III, Generative AI (job 127965694384841414)*

Strong fit for Google GenAI FDE builder work: Gemini/Vertex/ADK multi-agent systems, prototype-to-production shipping on Firebase, and evaluation plus observability. Partial fit on formal embedded enterprise-account FDE tenure, production-scale RAG/vector platforms, and an AI/CS graduate degree.

**Strongest alignment**

- **Architect and ship GenAI systems on Google Cloud (Gemini, Vertex, ADK)** — Experience → Independent R&D; Selected Projects → InSummery.AI and Cognitive Bridge (ADK multi-agent workflows, Vertex AI, Firebase production).
- **Production-grade agentic workflows with evaluation and observability** — Selected Projects → InSummery.AI (eval harness with absolute quality gates; Firebase deploy with OpenTelemetry instrumentation).
- **Multi-agent systems using Google ADK and related agent patterns** — Selected Projects → InSummery.AI (ADK conditional multi-agent workflow) and OpenClaw (orchestrated specialized agents with durable state and HITL gates).

**Additional alignment**

- **Leading technical discovery inside enterprise customer accounts** — Discovery and stakeholder translation show up through Volant client requirements-to-production delivery, Charity Navigator CMO and cross-functional product/data partnership, and shipping the Kaggle + Google Agents Intensive Consult-track capstone as working software.
- **Production enterprise RAG and vector-database pipelines at scale** — Active embedding and vector-persistence evaluation for iBlueprint workflows; production structured extraction into durable Firestore state (InSummery) and autonomous Python ETL over unstructured market data (OpenClaw) cover adjacent pipeline and retrieval-minded data work.
- **Master’s or PhD in AI or Computer Science** — Formal degrees are MA Counseling (Seattle University) and BA Anthropology (Dartmouth), plus a Udacity Front-End Web Developer Nanodegree via Grow with Google. The counseling background is a direct transfer for composure and facilitation when technical discovery turns ambiguous or high-stakes—not a substitute for the preferred AI/CS graduate credential.

---

## Summary

Forward-leaning applied AI engineer who prototypes and ships GenAI solutions with Gemini/Vertex, agentic workflows, and human-in-the-loop controls—translating ambiguous stakeholder needs into working software, from nonprofit product delivery to productionized agent systems.

---

## Experience

### Applied AI Developer — Independent R&D

*2026-02 – Present* · NJ
Building applied AI infrastructure spanning multi-agent orchestration, hybrid LLM inference, structured extraction pipelines, and human-in-the-loop controls. Working in multiple LLMs, harnesses, deployment stacks, and eval platforms.

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
- Stress-testing embedding implementations and vector persistence to improve RAG performance in iBlueprint workflows.
**Technologies:** Python, Google ADK 2.0, OpenClaw, Google Gemini, Gemma, Firebase, SQLite, Cursor Agent SDK, Weights & Biases Weave

### Front-End Developer — NAMI

*2024-12 – 2026-01* · Remote
Built and maintained NAMI's Laravel-based core business application with a focus on reusable UI components, accessibility, and Cypress E2E testing.

- Led Cypress automated testing implementation for a Laravel/Livewire event platform, improving regression coverage and team confidence.
**Technologies:** Laravel, Livewire, Alpine, Cypress, JavaScript

### Software Engineer — Charity Navigator

*2023-08 – 2024-09* · NJ
Contributed to a high-traffic React/TypeScript data portal, GraphQL API transitions, and cross-functional delivery with product and data teams.

- Built React/TypeScript portal features for 50,000+ clients and helped sustain high-traffic events with hundreds of thousands of concurrent visitors.
- Helped transition legacy data flows into GraphQL API endpoints, streamlining backend-to-frontend communication.
- Partnered with product and data teams to ship tools that streamlined data-review processes.
**Technologies:** React, TypeScript, GraphQL, JavaScript

### Front-End Web Developer — Charity Navigator

*2019-03 – 2023-08* · NJ
Led frontend design and development for platform rebranding, technology migration, and high-traffic public web experiences.

- Partnered with the CMO and marketing team on rebrand work and time-sensitive website feature launches.
**Technologies:** JavaScript, HTML5, CSS, React

### Founder & Web Developer — Volant Web Design

*2024-09 – Present* · NJ
Resumed sole-proprietorship web design and development work for B2B clients, covering requirements through production deployment and SEO.

- Delivered full-stack client websites and SEO/analytics reporting from requirements through production deployment.
**Technologies:** PHP, JavaScript, HTML5, CSS


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

### iBlueprint Embeddings Collaboration — Independent R&D / Humanservices.ai

*2025-2026*

Domain-specific blueprinting workflows need better embedding accuracy and vector persistence for RAG.

Collaborating with Stephen Rockwell on embedding model stress-testing and vector-store integration within existing blueprinting workflows.

**Technologies:** Vector databases, Embeddings, RAG

### AgentOS: Chief of Staff Agent — Independent R&D

*2025-2026*

Complex long-running workflows need reliable orchestration with mandatory human checkpoints.

Built a multi-agent orchestrator with the Cursor Agent SDK, modular subagents, and HITL handoffs for evaluation and testing stages.

**Technologies:** Cursor Agent SDK, Python

### Charity Navigator Data Review Portal — Charity Navigator

*2023-2024*

Internal and client data-review workflows needed a scalable React/TypeScript portal with modern API integration.

Engineered portal features and helped transition legacy data flows into GraphQL endpoints while collaborating with product and data teams.

**Technologies:** React, TypeScript, GraphQL


## Skills

**Applied AI:** Multi-agent orchestration, Hybrid LLM inference, Human-in-the-loop controls, PII masking, Agent evaluation, Embeddings / RAG, Firebase, Vertex AI, Ollama, Cursor Agent SDK, Model Context Protocol, Weights & Biases Weave
**Front-End:** JavaScript, React, TypeScript, Next.js
**Back-End:** Python, GraphQL, SQLite, Clerk OAuth
**Testing:** Cypress
**Collaboration:** Stakeholder collaboration, Deep listening

## Education

- **Udacity** — Front-End Web Developer Nanodegree · Full scholarship from Google through the "Grow with Google" program.
- **Seattle University** — MA, Counseling
- **Dartmouth College** — BA, Anthropology
