from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple, Literal
from sqlalchemy.orm import Session
import re

import models  # CycleLog, SymptomLog

# -----------------------
# Tunables (safe defaults)
# -----------------------
MAX_CTX_CYCLES = 4          # default recent cycles in baseline context
MAX_CTX_SYMPTOMS = 20       # default recent symptoms in baseline context
EVIDENCE_MAX_SYMPTOMS = 200 # hard-cap of raw symptom rows in the question-specific evidence block

# -----------------------
# Public API
# -----------------------
def summarize_user(db: Session, user_id: int, question: Optional[str] = None) -> str:
    """
    Builds the USER CONTEXT block. If `question` is provided, we also include a
    'QUESTION-SPECIFIC EVIDENCE' block consisting of only the minimal slice
    of data likely needed to answer the question (e.g., "3 months ago", "May 2025").
    """
    baseline = _baseline_context(db, user_id)

    if not question:
        return baseline

    win = parse_question_window(question, today=date.today())

    # If we couldn't infer a window, return baseline only
    if not win:
        return baseline

    subject, dfrom, dto = win
    cycles, symptoms = fetch_window(db, user_id, subject=subject, date_from=dfrom, date_to=dto)

    ev = _format_evidence(cycles, symptoms, subject, dfrom, dto)
    return f"{baseline}\n\n{ev}"


# -----------------------
# Baseline (recent slice)
# -----------------------
def _baseline_context(db: Session, user_id: int) -> str:
    cycles = (
        db.query(models.CycleLog)
        .filter(models.CycleLog.user_id == user_id)
        .order_by(models.CycleLog.start_date.desc())
        .limit(MAX_CTX_CYCLES)
        .all()
    )
    symptoms = (
        db.query(models.SymptomLog)
        .filter(models.SymptomLog.user_id == user_id)
        .order_by(models.SymptomLog.date.desc())
        .limit(MAX_CTX_SYMPTOMS)
        .all()
    )
    lines = [
        "USER CONTEXT",
        f"- Last period starts: {_fmt_cycles(cycles)}",
        f"- Recent symptoms: {_fmt_symptoms(symptoms)}",
    ]
    return "\n".join(lines)


# -----------------------
# Evidence formatting
# -----------------------
def _format_evidence(
    cycles: List["models.CycleLog"],
    symptoms: List["models.SymptomLog"],
    subject: Literal["cycles", "symptoms", "both"],
    dfrom: date,
    dto: date,
) -> str:
    parts = [
        "QUESTION-SPECIFIC EVIDENCE",
        f"- Window: {dfrom.isoformat()} → {dto.isoformat()}",
        f"- Subject: {subject}",
    ]
    if subject in ("cycles", "both"):
        parts.append("Cycles in window:")
        if not cycles:
            parts.append("  (none)")
        else:
            for c in cycles:
                parts.append(f"  - {c.start_date.isoformat()} to {c.end_date.isoformat()}")
    if subject in ("symptoms", "both"):
        parts.append("Symptoms in window:")
        if not symptoms:
            parts.append("  (none)")
        else:
            for s in symptoms[:EVIDENCE_MAX_SYMPTOMS]:
                sev = f" (sev {s.severity})" if getattr(s, "severity", None) is not None else ""
                parts.append(f"  - {s.date.isoformat()}: {s.symptom}{sev}")
            if len(symptoms) > EVIDENCE_MAX_SYMPTOMS:
                parts.append(f"  ... {len(symptoms) - EVIDENCE_MAX_SYMPTOMS} more omitted")
    return "\n".join(parts)


# -----------------------
# Fetchers
# -----------------------
def fetch_window(
    db: Session,
    user_id: int,
    subject: Literal["cycles", "symptoms", "both"],
    date_from: date,
    date_to: date,
) -> Tuple[List["models.CycleLog"], List["models.SymptomLog"]]:
    c: List["models.CycleLog"] = []
    s: List["models.SymptomLog"] = []

    if subject in ("cycles", "both"):
        q = (
            db.query(models.CycleLog)
            .filter(models.CycleLog.user_id == user_id)
            .filter(models.CycleLog.start_date >= date_from)
            .filter(models.CycleLog.start_date <= date_to)
            .order_by(models.CycleLog.start_date.asc())
        )
        c = q.all()

    if subject in ("symptoms", "both"):
        q = (
            db.query(models.SymptomLog)
            .filter(models.SymptomLog.user_id == user_id)
            .filter(models.SymptomLog.date >= date_from)
            .filter(models.SymptomLog.date <= date_to)
            .order_by(models.SymptomLog.date.asc())
        )
        s = q.all()

    return c, s


# -----------------------
# Heuristic question parsing
# -----------------------
MONTHS = {
    "january":1,"jan":1,
    "february":2,"feb":2,
    "march":3,"mar":3,
    "april":4,"apr":4,
    "may":5,
    "june":6,"jun":6,
    "july":7,"jul":7,
    "august":8,"aug":8,
    "september":9,"sep":9,"sept":9,
    "october":10,"oct":10,
    "november":11,"nov":11,
    "december":12,"dec":12,
}

def parse_question_window(q: str, today: date):
    """
    Extract (subject, date_from, date_to) from natural-language question.
    Aim for a *small* window. If ambiguous, choose the smallest reasonable window.
    Supported:
      - "3 months ago", "last 2 months", "last month"
      - "in May 2025", "May 2025", "May"
      - "from 2025-05-01 to 2025-06-15", "between 2025-05-01 and 2025-05-31"
      - "on 2025-05-12"
    """
    text = q.lower().strip()

    # Subject hints
    subj = classify_subject(text)

    # ISO date range: from X to Y / between X and Y
    m = re.search(r"(?:from|between)\s*(\d{4}-\d{1,2}-\d{1,2})\s*(?:to|and|through|-)\s*(\d{4}-\d{1,2}-\d{1,2})", text)
    if m:
        d1 = _parse_iso(m.group(1)); d2 = _parse_iso(m.group(2))
        if d1 and d2 and d1 <= d2:
            return subj, d1, d2

    # Single ISO date: "on 2025-05-12" or bare "2025-05-12"
    m = re.search(r"(?:on\s*)?(\d{4}-\d{1,2}-\d{1,2})", text)
    if m:
        d = _parse_iso(m.group(1))
        if d:
            return subj, d, d

    # last N months
    m = re.search(r"last\s+(\d+)\s+months?", text)
    if m:
        n = int(m.group(1))
        dfrom = _add_months(today.replace(day=1), -n)
        dto = (today.replace(day=1) - timedelta(days=1))  # end of previous month
        if dfrom <= dto:
            return subj, dfrom, dto

    # last month
    if re.search(r"last\s+month", text):
        start_prev = _add_months(today.replace(day=1), -1)
        end_prev = today.replace(day=1) - timedelta(days=1)
        return subj, start_prev, end_prev

    # N months ago  (choose full month N back)
    m = re.search(r"(\d+)\s+months?\s+ago", text)
    if m:
        n = int(m.group(1))
        target = _add_months(today.replace(day=1), -n)
        start = target
        end = _end_of_month(target)
        return subj, start, end

    # Month name (with optional year)
    m = re.search(r"\b(" + "|".join(MONTHS.keys()) + r")\b(?:\s+(\d{4}))?", text)
    if m:
        mon = MONTHS[m.group(1)]
        yr = int(m.group(2)) if m.group(2) else today.year
        start = date(yr, mon, 1)
        end = _end_of_month(start)
        return subj, start, end
    
    # whole year
    m = re.search(r"\b(20\d{2})\b", text)
    if m:
        yr = int(m.group(1))
        start = date(yr, 1, 1)
        end = date(yr, 12, 31)
        return subj, start, end

    # "3 weeks ago" -> pick that week (Mon..Sun)
    m = re.search(r"(\d+)\s+weeks?\s+ago", text)
    if m:
        n = int(m.group(1))
        target = today - timedelta(weeks=n)
        start = target - timedelta(days=target.weekday())  # Monday
        end = start + timedelta(days=6)
        return subj, start, end

    # "last week"
    if "last week" in text:
        start_this = today - timedelta(days=today.weekday())
        end_prev = start_this - timedelta(days=1)
        start_prev = end_prev - timedelta(days=6)
        return subj, start_prev, end_prev

    return None


def classify_subject(text: str) -> Literal["cycles","symptoms","both"]:
    if any(w in text for w in ["cycle", "period", "bleed", "menstruat"]):
        return "both"  # was "cycles"
    if any(w in text for w in ["symptom", "cramp", "mood", "headache", "bloating", "acne", "pain"]):
        return "symptoms"
    return "both"


# -----------------------
# Helpers
# -----------------------
def _parse_iso(s: str) -> Optional[date]:
    try:
        y, m, d = [int(x) for x in s.split("-")]
        return date(y, m, d)
    except Exception:
        return None

def _end_of_month(d: date) -> date:
    start_next = _add_months(d.replace(day=1), 1)
    return start_next - timedelta(days=1)

def _add_months(d: date, n: int) -> date:
    y = d.year + (d.month - 1 + n) // 12
    m = (d.month - 1 + n) % 12 + 1
    day = min(d.day, _days_in_month(y, m))
    return date(y, m, day)

def _days_in_month(y: int, m: int) -> int:
    if m == 2:
        leap = (y % 4 == 0 and (y % 100 != 0 or y % 400 == 0))
        return 29 if leap else 28
    if m in (1,3,5,7,8,10,12):
        return 31
    return 30


# -----------------------
# Old formatters (kept)
# -----------------------
def _fmt_cycles(cycles: List["models.CycleLog"]) -> str:
    if not cycles:
        return "none"
    return ", ".join(c.start_date.isoformat() for c in cycles[:MAX_CTX_CYCLES])

def _fmt_symptoms(symptoms: List["models.SymptomLog"]) -> str:
    if not symptoms:
        return "none"
    parts = []
    for s in symptoms[:MAX_CTX_SYMPTOMS]:
        sev = f"(sev {s.severity})" if getattr(s, "severity", None) is not None else ""
        parts.append(f"{s.date.isoformat()} {s.symptom}{(' ' + sev) if sev else ''}")
    return "; ".join(parts)
