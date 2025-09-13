from fastapi import APIRouter, Depends, HTTPException
import requests, os
from sqlalchemy.orm import Session
from db import get_db
import models
from routes.deps import get_current_user_id  # adjust if named differently
from user_context import summarize_user
import schemas
from .rag import ollama_chat, ollama_chat_messages  # add the new import

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
async def chat(body: schemas.ChatIn, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    # extract a question string from either prompt or the last user message
    last_user_msg = None
    if body.messages:
        for m in reversed(body.messages):
            if getattr(m, "role", None) == "user" and getattr(m, "content", None):
                last_user_msg = m.content.strip()
                break
    question_text = body.prompt or last_user_msg or ""

    # Build context with the real question so the date window is parsed
    user_ctx = summarize_user(db, user_id, question=question_text)
    print("DEBUG USER CTX:\n", user_ctx)
    system = (
        "You are a supportive menstrual health assistant. "
        "Use USER CONTEXT and QUESTION-SPECIFIC EVIDENCE as the sole source of truth. "
        "When answering about periods, copy the cycle ranges exactly as shown under 'Cycles in window'. Do not infer end dates from symptoms."
        "If evidence lists cycles with start and end dates, repeat them exactly. "
        "If there is no evidence for the requested window, say so clearly. "
        "Do not guess or generalize. "
        "Do not provide diagnosis; offer only gentle, practical info."
    )

    if body.messages:
        # 1) Keep instructions as the single system message
        msgs = [{"role": "system", "content": system}]
        # 2) Put your evidence as a user message (models obey this more)
        msgs.append({"role": "user", "content": user_ctx})
        # 3) Then the conversation history
        msgs += [m.dict() for m in body.messages]
        answer = await ollama_chat_messages(msgs)
        return {"answer": answer, "threadId": body.threadId}


    # single-turn path unchanged
    user_msg = f"""{user_ctx}

USER PROMPT:
{question_text}
"""
    answer = await ollama_chat(system, user_msg)
    return {"answer": answer}
