from __future__ import annotations

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

class CycleCreate(BaseModel):
    start_date: date
    end_date: Optional[date] = None
    flow_intensity: Optional[int] = None
    notes: Optional[str] = None

class CycleUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    flow_intensity: Optional[int] = None
    notes: Optional[str] = None

@router.get("/")
def list_cycles(month: str | None = None, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    q = db.query(models.CycleLog).filter(models.CycleLog.user_id == user_id)
    if month:
        y, m = map(int, month.split("-"))
        first = date(y, m, 1)
        last = (first.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        q = q.filter(models.CycleLog.start_date <= last, or_(models.CycleLog.end_date.is_(None), models.CycleLog.end_date >= first))
    return q.order_by(models.CycleLog.start_date.asc()).all()

@router.post("/", status_code=201)
def create_cycle(body: CycleCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    c = models.CycleLog(user_id=user_id, **body.dict())
    db.add(c); db.commit(); db.refresh(c)
    return c

@router.patch("/{cycle_id}")
def update_cycle(cycle_id: int, body: CycleUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    c = db.query(models.CycleLog).filter_by(id=cycle_id, user_id=user_id).first()
    if not c:
        raise HTTPException(404, detail="Cycle not found")
    for k, v in body.dict(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit(); db.refresh(c)
    return c

@router.delete("/{cycle_id}")
def delete_cycle(cycle_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    c = db.query(models.CycleLog).filter_by(id=cycle_id, user_id=user_id).first()
    if not c:
        raise HTTPException(404, detail="Cycle not found")
    db.delete(c); db.commit()
    return {"detail": "Deleted"}
