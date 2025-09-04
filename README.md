# Menstrual App — Full Self-Hosted Stack (Docker Desktop)

Spin up **FastAPI** (auth/cycles/symptoms/insights/chat + RAG), **Neo4j 5** (graph + vectors), **Ollama** (LLM + embeddings), **Postgres**, **Redis**, **MinIO**, and **MailHog** with one command.

## Quick start
```bash
docker compose up -d
# first run may take a few minutes while models download
```

### Check services
- API: http://localhost:8000/health
- Neo4j Browser: http://localhost:7474  (user: neo4j / password123)
- Ollama: http://localhost:11434
- MailHog: http://localhost:8025  (dev inbox)
- MinIO: http://localhost:9001  (minioadmin / minioadmin)

### Ask AI with citations
```bash
curl -s -X POST http://localhost:8000/ask   -H 'Content-Type: application/json'   -d '{"question":"What helps with menstrual cramps?"}' | jq
```

### Auth + cycles quick test
```bash
T=$(curl -s -X POST http://localhost:8000/auth/register   -H 'Content-Type: application/json'   -d '{"email":"you@example.com","password":"test1234"}' | jq -r '.access_token')

TODAY=$(date +"%Y-%m-%d")
curl -s -X POST http://localhost:8000/cycles/   -H "Authorization: Bearer $T" -H "Content-Type: application/json"   -d "{"start_date":"$TODAY"}" | jq

curl -s http://localhost:8000/insights -H "Authorization: Bearer $T" | jq
```

### Re-seed guidelines with your own content
Edit `payload/demo_docs.json` and run:
```bash
docker compose run --rm seed-guidelines
```

**Educational info only; not medical advice. Change all passwords/secrets before any public use.**
