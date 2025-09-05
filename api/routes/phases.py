from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import date, timedelta
from db import get_db
import models
from .deps import get_current_user_id
from dataclasses import dataclass

router = APIRouter()

@dataclass
class PhaseSpan:
    type: str
    start: date
    end: date

def _median(vals: list[int]) -> int:
    if not vals: return 28
    s = sorted(vals); n = len(s)
    return s[n//2] if n % 2 else round((s[n//2-1] + s[n//2]) / 2)

def estimate_lengths(cycles: list[models.CycleLog]) -> tuple[int, int]:
    lengths = []
    for i in range(len(cycles)-1):
        d = (cycles[i+1].start_date - cycles[i].start_date).days
        if d > 10: lengths.append(d)
    return (_median(lengths) if lengths else 28, 14)

def menstruation_end(cycle: models.CycleLog, logs: list[models.SymptomLog]) -> date:
    flow_names = {"flow","bleeding","period","spotting"}
    flow_days = sorted([
        lg.date for lg in logs
        if lg.date >= cycle.start_date and (not cycle.end_date or lg.date <= cycle.end_date)
        and (lg.symptom or "").lower() in flow_names and (lg.severity or 1) > 0
    ])
    if flow_days:
        last = cycle.start_date
        for d in flow_days:
            if (d - last).days <= 1: last = d
            else: break
        return last
    return cycle.start_date + timedelta(days=4)

def compute_phases(cycles: list[models.CycleLog], logs: list[models.SymptomLog]) -> list[PhaseSpan]:
    if not cycles: return []
    cs = sorted(cycles, key=lambda c: c.start_date)
    avg_cycle, luteal_len = estimate_lengths(cs)
    out: list[PhaseSpan] = []

    for i, c in enumerate(cs):
        next_start = cs[i+1].start_date if i+1 < len(cs) else None
        end = (next_start - timedelta(days=1)) if next_start else (c.end_date or (c.start_date + timedelta(days=avg_cycle-1)))
        mens_end = menstruation_end(c, logs)
        out.append(PhaseSpan("menstruation", c.start_date, mens_end))

        cycle_len = (end - c.start_date).days + 1
        ovu = c.start_date + timedelta(days=max(cycle_len - luteal_len - 1, 0))
        fert_start = ovu - timedelta(days=5)
        fert_end = ovu + timedelta(days=1)

        fol_start = mens_end + timedelta(days=1)
        fol_end = max(fol_start, fert_start - timedelta(days=1))
        if fol_end >= fol_start:
            out.append(PhaseSpan("follicular", fol_start, fol_end))

        out.append(PhaseSpan("ovulation_window", fert_start, fert_end))

        lut_start = fert_end + timedelta(days=1)
        lut_end = end
        if lut_end >= lut_start:
            out.append(PhaseSpan("luteal", lut_start, lut_end))

    return out

@router.get("/phases")
def get_phases(month: str, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    y, m = map(int, month.split("-"))
    first = date(y, m, 1)
    last = (first.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    cycles = (db.query(models.CycleLog)
              .filter(models.CycleLog.user_id==user_id,
                      models.CycleLog.start_date <= last,
                      or_(models.CycleLog.end_date.is_(None), models.CycleLog.end_date >= first))
              .order_by(models.CycleLog.start_date.asc()).all())
    logs = (db.query(models.SymptomLog)
            .filter(models.SymptomLog.user_id==user_id,
                    models.SymptomLog.date >= first - timedelta(days=35),
                    models.SymptomLog.date <= last + timedelta(days=35))
            .all())
    spans = compute_phases(cycles, logs)
    clipped = []
    for s in spans:
        s0 = max(first, s.start); s1 = min(last, s.end)
        if s1 >= s0: clipped.append({"type": s.type, "start": s0.isoformat(), "end": s1.isoformat()})
    return {"month": month, "phases": clipped}
