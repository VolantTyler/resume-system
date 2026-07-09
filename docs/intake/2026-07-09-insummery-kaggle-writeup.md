# Intake: InSummery.AI Kaggle Capstone Writeup

Source: https://www.kaggle.com/competitions/vibecoding-agents-capstone-project/writeups/in-summery-ai  
Also: user-pasted writeup text (2026-07-09); local repo README; confirmed links.

## Links

- Repo: https://github.com/VolantTyler/InSummery-AI
- Live app: https://in-summery.web.app/
- Demo video: https://www.youtube.com/watch?v=EeXLKUxHdsw
- Kaggle writeup: https://www.kaggle.com/competitions/vibecoding-agents-capstone-project/writeups/in-summery-ai

## Summary

InSummery is a HITL family schedule concierge built as the Consult-track capstone for the Kaggle + Google 5-Day AI Agents Intensive. It ingests chaotic scheduling messages, masks PII, routes via ADK multi-agent workflow, extracts structured schedule data, pauses below 80% confidence for clarification, updates a multi-child schedule matrix, detects absolute/relative childcare gaps, and syncs disruptions to Google Calendar.

## Stack (from writeup)

Python, Google ADK 2.0, Pydantic, Gemini via Vertex AI, Gemma via Ollama (dev), Firebase Auth/Functions/Firestore, Vite+React, Google Calendar OAuth, OpenTelemetry, `insummery-eval` harness.
