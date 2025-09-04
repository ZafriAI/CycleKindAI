# api/user_context.py
from typing import List
from sqlalchemy.orm import Session
import models  # NOTE: your project uses CycleLog and SymptomLog

def _fmt_cycles(cycles: List["models.CycleLog"]) -> str:
    if not cycles:
        return "none"
    # newest first
    return ", ".join(c.start_date.isoformat() for c in cycles[:2])

def _fmt_symptoms(symptoms: List["models.SymptomLog"]) -> str:
    if not symptoms:
        return "none"
    parts = []
    for s in symptoms[:10]:
        sev = s.severity if getattr(s, "severity", None) is not None else "-"
        parts.append(f"{s.date.isoformat()}:{s.symptom}/{sev}")
    return ", ".join(parts)

def summarize_user(db: Session, user_id: int) -> str:
    """
    Compact summary of the user's recent data. Keep it short (<~1000 chars).
    """
    cycles = (
        db.query(models.CycleLog)
        .filter(models.CycleLog.user_id == user_id)
        .order_by(models.CycleLog.start_date.desc())
        .limit(3)
        .all()
    )
    symptoms = (
        db.query(models.SymptomLog)
        .filter(models.SymptomLog.user_id == user_id)
        .order_by(models.SymptomLog.date.desc())
        .limit(10)
        .all()
    )

    lines = [
        "USER CONTEXT",
        f"- Last period starts: {_fmt_cycles(cycles)}",
        f"- Recent symptoms: {_fmt_symptoms(symptoms)}",
    ]
    return "\n".join(lines)
