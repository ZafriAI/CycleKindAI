# BACKBONE.md — Menstrual App (Self‑Hosted, GraphRAG + Mobile)

This file is the **single source of truth** for architecture, services, data models, endpoints, and runbooks. Drop it at the repo root and keep it updated as you ship.

---

## 1) Mission & Scope
- **Mission:** Private, empathetic menstrual tracking + grounded AI answers with citations, all self-hosted pre‑launch.
- **Scope (MVP):**
  - Track cycles & symptoms
  - Predict next period (simple average)
  - Ask AI → answers cite vetted guidelines (RAG, no open-web)
  - Privacy controls: export/delete
  - Local/dev notifications, no cloud cost pre‑launch

---

## 2) System Overview

```
Mobile (Expo) ───▶ API (FastAPI)
                      ├─ Postgres (users, cycles, symptoms)
                      ├─ Neo4j (Guidelines graph + vector index)
                      ├─ Ollama (LLM + embeddings)
                      ├─ Redis (jobs/queues)
                      └─ MinIO (exports/backups)
```

**Service Ports (dev defaults)**
- API: `http://localhost:8000`
- Postgres: `5432`
- Neo4j Browser: `7474` (Bolt: `7687`)
- Ollama: `11434`
- Redis: `6379`
- MinIO: `9000` (S3) / `9001` (console)
- MailHog: `8025` (web) / `1025` (SMTP)

---

## 3) Repo Layout (suggested)

```
/api                  # FastAPI service
  /routes             # endpoints
  app.py              # app entry
  models.py           # SQLAlchemy models
  schemas.py          # Pydantic I/O
  db.py               # DB session
  security.py         # auth helpers
  requirements.txt
  Dockerfile
/payload              # ingestable guideline docs (JSON)
/mobile               # (optional) Expo app
docker-compose.yml
BACKBONE.md           # this file
README.md
```

---

## 4) Environment Variables (dev)

| Key | Default | Used by | Notes |
|---|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://app:app@postgres:5432/appdb` | API | Postgres connection |
| `JWT_SECRET` | `change-me` | API | Rotate in prod |
| `ALLOW_REGISTRATION` | `true` | API | Disable for closed beta if needed |
| `NEO4J_URI` | `bolt://neo4j:7687` | API | Neo4j connector |
| `NEO4J_USER` | `neo4j` | API |  |
| `NEO4J_PASSWORD` | `password123` | API | Change in prod |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | API | LLM/embeddings |
| `CHAT_MODEL` | `qwen2.5:14b-instruct` | API | Swap for `mistral:7b-instruct` if CPU slow |
| `EMBED_MODEL` | `nomic-embed-text` | API | 768-dim embeddings |
| `PORT` | `8000` | API | HTTP port |

---

## 5) Data Model (Postgres, minimal ERD)

**users**  
- `id` (pk, int)  
- `email` (unique) — *store hashed+salted in later hardening*  
- `password_hash`  
- `created_at` (utc)  
- `allow_research` (bool)

**cycle_logs**  
- `id` (pk)  
- `user_id` (fk → users.id)  
- `start_date` (date, required)  
- `end_date` (date, optional)  
- `flow_intensity` (int 1–5, optional)  
- `notes` (text, optional)

**symptom_logs**  
- `id` (pk)  
- `user_id` (fk)  
- `date` (date)  
- `symptom` (string, e.g., cramps, mood)  
- `severity` (int 1–5, optional)  
- `tags` (jsonb, optional)  
- `notes` (text, optional)

> **Privacy:** Separate auth vs health data; encrypt sensitive columns with `pgcrypto` when you move toward prod.

---

## 6) Knowledge Graph (Neo4j) & Vector Index

**Nodes (initial)**
- `Guideline { title, url, text, embedding:vector }`

**Vector Index (created by API at ingest):**
```cypher
CREATE VECTOR INDEX guideline_embed_idx IF NOT EXISTS
FOR (g:Guideline) ON (g.embedding)
OPTIONS { indexConfig: {
  `vector.dimensions`: 768,
  `vector.similarity_function`: 'cosine'
}};
```

> You can extend with `:Symptom`, `:Concept`, `:Intervention` and edges like `(:Symptom)-[:SUGGESTS]->(:Concept)` later to enable GraphRAG hops.

---

## 7) API Surface (MVP)

### Auth
- **POST** `/auth/register` → `{email, password}` → `{access_token}`
- **POST** `/auth/login` → `{email, password}` → `{access_token}`

### Cycles
- **GET** `/cycles/` (auth) → list cycles
- **POST** `/cycles/` (auth) → `{start_date, end_date?, flow_intensity?, notes?}`

### Symptoms
- **GET** `/symptoms/` (auth)
- **POST** `/symptoms/` (auth) → `{date, symptom, severity?, tags?, notes?}`

### Insights
- **GET** `/insights` (auth) → `{ next_period_start, avg_cycle_length_days, notes }`
- **GET** `/insights/summary` (auth) → short summary used by chat

### RAG
- **POST** `/ingest` → `{ docs: [{title,url,text}, ...] }` (embeds + stores in Neo4j)
- **POST** `/ask` → `{ question, k? }` → grounded answer + `[n]` citations

### Chat (personalized wrapper)
- **POST** `/chat` (auth) → `{ prompt }`  
  - Server builds **user summary** → calls `/ask` → returns `{ answer, sources, disclaimer }`

**Example: Ask**
```bash
curl -s -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What helps with menstrual cramps?"}'
```

---

## 8) Retrieval Flow (RAG)

1. **Embed** user’s question with `EMBED_MODEL` (Ollama).  
2. **Vector query** Neo4j `guideline_embed_idx` → top‑k chunks.  
3. **Compose context** as numbered snippets `[1] … [k]`.  
4. **LLM generate** with strict system prompt: use only provided context, include citations, add “not medical advice.”  
5. **(Chat only)** Prepend short **user summary** (avg cycle, last start, top symptoms).

> If no relevant chunks score above a threshold, answer **“I don’t have a reliable source for that.”**

---

## 9) Privacy & Safety Controls

- **No open web** at runtime; answers come only from your curated guidelines.  
- Always add **disclaimer**: educational, not medical advice.  
- **Red flags** (e.g., severe pain + fever) → prepend “seek care” message.  
- Logging: **no raw health text**; log metadata only (status codes, durations).  
- **Export/Delete** endpoints recommended before public beta.

---

## 10) Runbook (Dev)

**Start everything**
```bash
docker compose up -d
```

**Health checks**
- API → `GET /health`  
- Neo4j → http://localhost:7474  
- Ollama → `GET /api/tags`

**Seed guidelines (edit `payload/demo_docs.json` first)**
```bash
docker compose run --rm seed-guidelines
```

**Quick smoke**
```bash
# register
T=$(curl -s -X POST http://localhost:8000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"test1234"}' | jq -r '.access_token')

# add two cycles
TODAY=$(date +"%Y-%m-%d")
curl -s -X POST http://localhost:8000/cycles/ \
  -H "Authorization: Bearer $T" -H "Content-Type: application/json" \
  -d "{\"start_date\":\"$TODAY\"}" | jq

# ask AI
curl -s -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What helps with menstrual cramps?"}' | jq
```

**Stop**
```bash
docker compose down
```

---

## 11) Testing & Quality Gates

- **Unit/Integration:** `pytest` for API; deterministic tests for cycle math.  
- **AI evals (small set):** groundedness, citation coverage, refusal when no sources, red‑flag consistency.  
- **Load (dev):** `k6` smoke to size CPU/GPU impact.  
- **Error tracking:** GlitchTip/Sentry-compatible DSN (PII scrubbing on).

**Definition of Done (MVP)**
- Add ≥2 periods, see prediction.  
- Chat returns cited answers from your docs only, w/ disclaimer.  
- Export/Delete tested manually.  
- No PII or prompt bodies in logs.

---

## 12) Roadmap (Post‑MVP)

- Phase insights (follicular vs luteal tips)  
- Trend cards (“cramps ↑ pre‑period last 3 cycles”)  
- RevenueCat + subscriptions ($30/yr)  
- Localized content (EN→ES)  
- Graph expansion (Symptoms↔Concepts↔Interventions) for better reasoning

---

## 13) Troubleshooting (Dev)

- **Slow answers (CPU):** switch to `mistral:7b-instruct`; allocate more RAM in Docker Desktop.  
- **Neo4j empty:** re‑run `seed-guidelines`; check `SHOW INDEXES`.  
- **Token errors:** JWT expired or wrong header; re‑login.  
- **Ports busy:** change exposed ports in `docker-compose.yml`.

---

## 14) Security Checklist (pre‑public)

- Change all defaults/secrets; restrict CORS; enable TLS behind a reverse proxy.  
- Add rate‑limits; audit logs; rotate JWT secrets.  
- Encrypt sensitive DB columns; disk encryption on host.  
- Final copy pass on disclaimers and consent flows.
