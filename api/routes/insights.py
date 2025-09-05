from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from db import get_db
import models
from .deps import get_current_user_id
from pydantic import BaseModel
from typing import Dict
import json, os, httpx

from .phases import compute_phases

router = APIRouter(prefix="/insights")

def compute_insights(cycles: list[models.CycleLog], logs: list[models.SymptomLog]) -> dict:
    spans = compute_phases(cycles, logs)
    lengths = []
    for i in range(len(cycles)-1):
        d = (cycles[i+1].start_date - cycles[i].start_date).days
        if d > 10: lengths.append(d)
    avg_cycle = round(sum(lengths)/len(lengths)) if lengths else 28
    variability = (max(lengths)-min(lengths)) if len(lengths) >= 2 else 0

    def label_for_date(d: date) -> str | None:
        for s in spans:
            if s["start"] <= d <= s["end"] if isinstance(s, dict) else (s.start <= d <= s.end):
                return s["type"] if isinstance(s, dict) else s.type
        return None

    by_phase: Dict[str, Dict[str, int]] = {}
    for lg in logs:
        lab = label_for_date(lg.date)
        if not lab: continue
        by_phase.setdefault(lab, {})
        name = getattr(lg, "symptom", "unknown")
        by_phase[lab][name] = by_phase[lab].get(name, 0) + 1

    return {"average_cycle": avg_cycle, "variability_days": variability, "symptoms_by_phase": by_phase}

@router.get("")
def get_insights(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    cycles = (db.query(models.CycleLog)
              .filter(models.CycleLog.user_id==user_id)
              .order_by(models.CycleLog.start_date.asc()).all())
    logs = (db.query(models.SymptomLog).filter(models.SymptomLog.user_id==user_id).all())
    return compute_insights(cycles, logs)

class LLMRequest(BaseModel):
    system: str | None = None
    user_prompt: str | None = None

# minimal Ollama chat to avoid depending on rag.py
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama3.1")

async def _ollama_chat(system: str, user: str) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={"model": CHAT_MODEL, "messages": [
                {"role":"system","content": system},
                {"role":"user","content": user}
            ], "stream": False},
        )
        r.raise_for_status()
        data = r.json()
        # Support both message/content and response shapes
        msg = (data.get("message") or {}).get("content") or data.get("response") or ""
        return msg.strip()

@router.post("/llm")
async def summarize_with_llm(body: LLMRequest, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    cycles = (db.query(models.CycleLog)
              .filter(models.CycleLog.user_id==user_id)
              .order_by(models.CycleLog.start_date.asc()).all())
    logs = (db.query(models.SymptomLog)
            .filter(models.SymptomLog.user_id==user_id)
            .all())
    data = compute_insights(cycles, logs)

    default_system = (
        "You are a supportive menstrual health assistant. "
        "Summarize patterns from the provided JSON data. "
        "Use clear, friendly language. "
        "Avoid medical advice and include a short disclaimer that this is educational information."
    )
    default_user = (
        "Task: Read the user's cycle insights JSON and produce a concise, actionable summary.\n\n"
        "If helpful, point out probable cycle phases and how symptoms vary across phases. "
        "Keep it short and gentle.\n\n"
        f"INSIGHTS JSON:\n{json.dumps(data, indent=2)}\n\n"
        "Output:\n• 2–4 bullets of key patterns\n• 1–2 gentle suggestions\n• One-line disclaimer"
    )

    system = body.system or default_system
    user_prompt = body.user_prompt or default_user

    try:
        summary = await _ollama_chat(system, user_prompt)
    except Exception as e:
        return {"detail": f"LLM call failed: {str(e)}", "data": data}

    return {"summary": summary, "data": data}
