from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import timedelta
from db import get_db
import models, schemas
from .deps import get_current_user_id

router = APIRouter()

def average_cycle_days(cycles):
    lens = []
    prev = None
    for c in sorted(cycles, key=lambda x: x.start_date):
        if prev:
            lens.append((c.start_date - prev.start_date).days)
        prev = c
    return (sum(lens)/len(lens)) if lens else None

@router.get("", response_model=schemas.InsightOut)
def get_insights(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    cycles = db.query(models.CycleLog).filter(models.CycleLog.user_id == user_id).order_by(models.CycleLog.start_date.asc()).all()
    avg = average_cycle_days(cycles)
    next_start = None
    notes = None
    if avg and cycles:
        last = cycles[-1].start_date
        next_start = last + timedelta(days=int(round(avg)))
        notes = f"Estimated next start based on average cycle length of ~{avg:.1f} days."
    else:
        notes = "Add at least 2 periods to estimate your average cycle length."
    return schemas.InsightOut(next_period_start=next_start, avg_cycle_length_days=avg, notes=notes)

@router.get("/summary")
def summary(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    from collections import Counter
    from datetime import date, timedelta
    today = __import__("datetime").date.today()
    since = today - timedelta(days=90)
    cycles = db.query(models.CycleLog).filter(models.CycleLog.user_id == user_id).all()
    avg = average_cycle_days(cycles)
    last = max([c.start_date for c in cycles], default=None)
    syms = db.query(models.SymptomLog).filter(models.SymptomLog.user_id == user_id,
                                             models.SymptomLog.date >= since).all()
    top = [s.symptom for s in syms]
    common = [s for s,_ in Counter(top).most_common(3)]
    return {
        "avg_cycle_days": avg,
        "last_period_start": str(last) if last else None,
        "common_recent_symptoms": common
    }
