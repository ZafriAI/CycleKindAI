import os
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from db import get_db
from routes.deps import get_current_user_id
from neo4j import GraphDatabase
from user_context import summarize_user
import httpx
import schemas
from pydantic import BaseModel
import httpx
import os
import schemas

router = APIRouter()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
CHAT_MODEL = os.getenv("CHAT_MODEL", "qwen2.5:1.5b-instruct")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password123")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
CHAT_MODEL = os.getenv("CHAT_MODEL", "qwen2.5:14b-instruct")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


async def ollama_embed(texts: List[str]) -> List[List[float]]:
    async with httpx.AsyncClient(timeout=60) as client:
        out = []
        for t in texts:
            r = await client.post(f"{OLLAMA_BASE_URL}/api/embeddings", json={"model": EMBED_MODEL, "prompt": t})
            r.raise_for_status()
            out.append(r.json()["embedding"])
        return out

async def ollama_chat(system: str, user: str) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": CHAT_MODEL,
                "messages": [
                    {"role":"system","content": system},
                    {"role":"user","content": user}
                ],
                "stream": False
            },
        )
        r.raise_for_status()
        data = r.json()
        msg = data.get("message", {}).get("content", "")
        # Some builds return "message" as a list of chunks; handle both:
        if isinstance(msg, str) and msg:
            return msg.strip()
        if "message" in data and isinstance(data["message"], dict):
            return data["message"].get("content","").strip()
        return data.get("response","").strip()

async def ollama_chat_messages(messages: list[dict]) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={"model": CHAT_MODEL, "messages": messages, "stream": False},
        )
        r.raise_for_status()
        data = r.json()
        msg = data.get("message", {}).get("content", "") or data.get("response", "")
        return (msg or "").strip()

def ensure_vector_index(session, dim: int):
    session.run("""
        CREATE VECTOR INDEX guideline_embed_idx IF NOT EXISTS
        FOR (g:Guideline) ON (g.embedding)
        OPTIONS { indexConfig: { `vector.dimensions`: $dim, `vector.similarity_function`: 'cosine' } }
    """, dim=dim)

@router.post("/ingest")
async def ingest(inp: schemas.IngestIn):
    if not inp.docs:
        raise HTTPException(400, "No docs provided")
    texts = [d.text for d in inp.docs]
    embeds = await ollama_embed(texts)
    with driver.session() as session:
        ensure_vector_index(session, len(embeds[0]))
        for d, e in zip(inp.docs, embeds):
            session.run("""
                MERGE (g:Guideline {url:$url})
                SET g.title=$title, g.text=$text, g.embedding=$emb
            """, url=d.url, title=d.title, text=d.text, emb=e)
    return {"ingested": len(inp.docs)}

@router.post("/ask")
async def ask(inp: schemas.AskIn, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    # 1) embed the question
    q_emb = (await ollama_embed([inp.question]))[0]

    # 2) retrieve top-k docs (clamp k to [1, 20])
    k = max(1, min((inp.k or 8), 20))
    with driver.session() as session:
        res = session.run("""
            CALL db.index.vector.queryNodes('guideline_embed_idx', $k, $vec)
            YIELD node, score
            RETURN node.title AS title, node.url AS url, node.text AS text, score
            LIMIT $k
        """, k=k, vec=q_emb)
        hits = [r.data() for r in res]

    # 3) compact context block from hits
    context = ""
    for i, h in enumerate(hits, 1):
        snippet = (h["text"] or "")[:500].replace("\n", " ").strip()
        context += f"[{i}] {h['title']} — {h['url']} :: {snippet}\n"

    # 4) add **user-aware** summary
    summary = summarize_user(db, user_id)

    # 5) system/user messages
    system = (
        "You are a supportive menstrual health assistant. "
        "Use ONLY the provided context and cite sources by [number]. "
        "Personalize with USER CONTEXT when relevant. "
        "Do NOT provide medical advice; include a short disclaimer that this is educational info."
    )
    user = (
        f"{summary}\n\n"
        f"Question: {inp.question}\n\n"
        f"Context:\n{context}\n"
        "Respond concisely with citations like [1], [2]."
    )

    # 6) call LLM as you already do
    answer = await ollama_chat(system, user)

    return {
        "answer": answer,
        "sources": [{"title": h["title"], "url": h["url"], "score": h["score"]} for h in hits],
        "disclaimer": "Educational information only; not a substitute for professional medical advice.",
    }
