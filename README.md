---
# CycleKindAI
AI menstrual health support — co-created with women.
---
## What is CycleKindAI?
CycleKindAI is a privacy-first menstrual cycle app that combines **cycle tracking**, **symptom journaling**, and an **AI assistant** that answers questions with citations from trusted, non-emergency resources you choose. It’s built with a **feminist, user-first** ethos and designed in collaboration with women mentors and contributors.

## Why we built this (our ethos)
Menstruation is a normal, complex part of life. Too many tools feel generic or impersonal, and many don’t offer thoughtful AI support. As a team of full-stack engineers — and yes, some of us are men — we built this in **partnership with women** who advised, tested, and shaped features from day one. Our aim is simple: **practical, respectful, private support** for people who menstruate, with clear explanations and verified references.

We recognize that experiences vary widely. This project takes a **feminist, user-first** approach: centering lived experience, prioritizing consent and agency, and designing for accessibility across cultures, identities, and bodies.

## Feminist principles & co-creation
- **Co-designed with women contributors and advisors.** Features come from lived experience, interviews, and ongoing feedback — not assumptions.
- **Respect, consent, and agency.** You control what you track and when to delete it.
- **Transparency about AI.** The LLM explains *why* it suggests something and cites sources; it’s **not a doctor** and never replaces professional care.
- **Accessibility & inclusion.** Language is plain, options are customizable, and we avoid gendered assumptions while serving the communities who asked us to build this.
- **Safety by default.** Self-hosting and local inference are first-class so sensitive data can stay under your control.

## How this app uses AI (at a glance)
- **LLM + RAG** for question-answering with citations to trusted content you seed (`payload/demo_docs.json`).
- **Cycle insights** from your own data (when provided) with clear, explain-in-plain-English rationales.
- **Boundaries:** No diagnosis, no emergency triage. Educational guidance only with links to reputable resources and clear escalation language when appropriate.

> Reminder: This project is for **educational information only and not medical advice** (also noted below in the README).

## Safety & privacy notes
- **Self-hosted stack** (FastAPI, Neo4j, Ollama, Postgres, Redis, MinIO) so you can run locally or on your own infra.
- **Secrets & credentials:** Replace all defaults before any public deployment. Rotate them regularly.
- **Data choice:** Tracking is optional; you can export or delete your data at any time (implementation depends on your deployment).
- **Observability:** Keep dev logs local; scrub PII before sharing logs in issues.

See the existing disclaimer in this README about educational use and changing secrets. 

## Community & feedback
We welcome contributions and critiques — especially from people who menstruate and healthcare professionals.
- Open an issue or discussion with feature requests or language improvements.
- Share anonymized, non-medical feedback about what would make the app feel more supportive and inclusive.
- If you’d like to advise on content quality, safety, or accessibility, please reach out (add your preferred contact here).

## Acknowledgements
This app exists because of the **women and people who menstruate** in our lives who shared needs, reviewed flows, and pushed for better features. Thank you for trusting us and helping us build something more caring.

### Women mentors
We were guided by **women mentors and advisors** across product, UX, and health who reviewed language, safety boundaries, and feature priorities. Their feedback shaped what shipped — and what we chose not to ship.

## Why not just use a generic AI chatbot?
- **No cycle context.** General chatbots don’t know your history or preferences.
- **High effort.** You’d have to curate medical sources and prompt-engineer every time.
- **Privacy risks.** Sending intimate health data to third-party services can be risky.

## Local-first AI (with optional hybrid)
- **Embedded LLM.** The model runs locally or on infrastructure you control. Personal cycle data stays in your environment.
- **Optional hybrid RAG.** You can pair a cloud LLM with *local retrieval* so your personal data remains local. Only the minimal, de-identified prompt context is sent upstream — or disable cloud entirely.
- **Trusted documents.** Ingest reputable, non-emergency health resources and your own notes; the assistant retrieves and **cites** them when answering.
- **Scope & boundaries.** Educational summaries only. Clear language to seek professional care for urgent symptoms.

## Security & data control
- **You own your data.** Export and delete at any time; account deletion purges stored records.
- **No ad-tech.** No sale of personal data.
- **Principle of least privilege.** Per-user data isolation and minimal access for services.
- **Configurable retention.** You can choose zero-retention for chat logs and analytics in private deployments.

## Not medical advice (and getting care)
This assistant is **not a clinician**. It does not diagnose or prescribe. It helps you prepare questions, find reputable resources, and (when configured) link to provider directories, hotlines, or telehealth options. Always consult a qualified professional for medical advice.

