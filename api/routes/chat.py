from fastapi import APIRouter, Depends, HTTPException
import requests, os
from sqlalchemy.orm import Session
from db import get_db
import models
from routes.deps import get_current_user_id  # adjust if named differently
from user_context import summarize_user
import schemas
from .rag import ollama_chat

router = APIRouter()

RAG_URL = os.getenv("RAG_URL", "http://localhost:8000/ask")

def user_summary(db: Session, user_id: int) -> str:
    from datetime import date, timedelta
    from collections import Counter
    cycles = db.query(models.CycleLog).filter(models.CycleLog.user_id == user_id).order_by(models.CycleLog.start_date.asc()).all()
    avg = None
    if len(cycles) >= 2:
        lens, prev = [], None
        for c in cycles:
            if prev: lens.append((c.start_date - prev.start_date).days)
            prev = c
        avg = sum(lens)/len(lens) if lens else None
    last = cycles[-1].start_date if cycles else None
    since = date.today() - timedelta(days=90)
    syms = db.query(models.SymptomLog).filter(models.SymptomLog.user_id == user_id,
                                              models.SymptomLog.date >= since).all()
    common = [s for s,_ in Counter([x.symptom for x in syms]).most_common(3)]
    return f"User summary: avg_cycle_days={avg}, last_period_start={last}, common_recent_symptoms={common}."

@router.post("/chat")
async def chat(
    body: schemas.ChatIn,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    # 1) Build compact user context
    user_ctx = summarize_user(db, user_id)

    # 2) System instructions (kept separate)
    system = (
        "You are a supportive menstrual health assistant. "
        "Use USER CONTEXT for personalization. Do not provide diagnosis; "
        "offer gentle, practical tips."
    )

    # 3) User message = context + the actual prompt
    user_msg = f"""{user_ctx}

USER PROMPT:
{body.prompt}
"""

    # 4) Call Ollama with the proper arguments
    answer = await ollama_chat(system, user_msg)

    return {"answer": answer}
