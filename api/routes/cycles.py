from __future__ import annotations
from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import date, timedelta
from typing import Optional
from pydantic import BaseModel
from db import get_db
import models
from .deps import get_current_user_id

router = APIRouter(prefix="/cycles")

# ----- Schemas -----
class CycleCreate(BaseModel):
    start_date: date
    end_date: Optional[date] = None  # kept optional for backward compatibility; we enforce at runtime
    flow_intensity: Optional[int] = None
    notes: Optional[str] = None

class CycleUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    flow_intensity: Optional[int] = None
    notes: Optional[str] = None

# ----- Helpers -----
def _commit_or_translate(db: Session, entity):
    """Commit and translate common constraint violations into clear HTTP errors."""
    try:
        db.add(entity)
        db.commit()
        db.refresh(entity)
        return entity
    except IntegrityError as e:
        db.rollback()
        msg = (str(e.orig) if getattr(e, "orig", None) else str(e)).lower()
        if "null value in column \"end_date\"" in msg:
            raise HTTPException(422, detail="An end date is required.")
        if "cycle_valid_range" in msg:
            raise HTTPException(422, detail="End date must be on or after start date.")
        if "cycle_exact_unique" in msg:
            raise HTTPException(409, detail="This cycle already exists for the user.")
        if "cycle_no_overlap" in msg or "daterange" in msg or "overlap" in msg:
            raise HTTPException(409, detail="This cycle overlaps an existing one.")
        raise HTTPException(400, detail="Could not save cycle.")

def _validate_policy_2(start_date: date | None, end_date: date | None):
    """Policy 2: end_date must be present and >= start_date."""
    if end_date is None:
        raise HTTPException(422, detail="An end date is required.")
    if start_date is not None and end_date < start_date:
        raise HTTPException(422, detail="End date must be on or after start date.")

# ----- Routes -----
@router.get("/")
def list_cycles(
    month: str | None = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    q = db.query(models.CycleLog).filter(models.CycleLog.user_id == user_id)
    if month:
        y, m = map(int, month.split("-"))
        first = date(y, m, 1)
        last = (first.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        # Policy 2 says end_date is NOT NULL now; keep the OR to be safe with legacy rows
        q = q.filter(
            models.CycleLog.start_date <= last,
            or_(models.CycleLog.end_date.is_(None), models.CycleLog.end_date >= first),
        )
    return q.order_by(models.CycleLog.start_date.asc()).all()

@router.post("/", status_code=201)
def create_cycle(
    body: CycleCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    # Enforce Policy 2 at the API layer (DB also enforces)
    _validate_policy_2(body.start_date, body.end_date)

    c = models.CycleLog(
        user_id=user_id,
        start_date=body.start_date,
        end_date=body.end_date,
        flow_intensity=body.flow_intensity,
        notes=body.notes,
    )
    return _commit_or_translate(db, c)

@router.patch("/{cycle_id}")
def update_cycle(
    cycle_id: int,
    body: CycleUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    c = db.query(models.CycleLog).filter_by(id=cycle_id, user_id=user_id).first()
    if not c:
        raise HTTPException(404, detail="Cycle not found")

    # If the client tries to remove end_date → block (Policy 2)
    if "end_date" in body.dict(exclude_unset=True) and body.end_date is None:
        raise HTTPException(422, detail="An end date is required.")

    # Apply changes
    for k, v in body.dict(exclude_unset=True).items():
        setattr(c, k, v)

    # Validate range after mutation (before commit)
    _validate_policy_2(c.start_date, c.end_date)

    try:
        db.commit()
        db.refresh(c)
        return c
    except IntegrityError as e:
        db.rollback()
        # Reuse the same translation as create
        msg = (str(e.orig) if getattr(e, "orig", None) else str(e)).lower()
        if "cycle_valid_range" in msg:
            raise HTTPException(422, detail="End date must be on or after start date.")
        if "cycle_exact_unique" in msg:
            raise HTTPException(409, detail="This cycle already exists for the user.")
        if "cycle_no_overlap" in msg or "daterange" in msg or "overlap" in msg:
            raise HTTPException(409, detail="This cycle overlaps an existing one.")
        raise HTTPException(400, detail="Could not save cycle.")

@router.delete("/{cycle_id}")
def delete_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    c = db.query(models.CycleLog).filter_by(id=cycle_id, user_id=user_id).first()
    if not c:
        raise HTTPException(404, detail="Cycle not found")
    db.delete(c)
    db.commit()
    return {"detail": "Deleted"}
