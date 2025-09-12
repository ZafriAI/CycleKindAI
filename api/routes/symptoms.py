from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import datetime as dt
from datetime import timedelta
from typing import Optional, Dict, Any
from db import get_db
import models
from pydantic import BaseModel
from .deps import get_current_user_id

router = APIRouter(prefix="/symptoms")

class SymptomCreate(BaseModel):
    date: dt.date
    symptom: str
    severity: Optional[int] = None
    tags: Optional[Dict[str, object]] = None
    notes: Optional[str] = None
    
class SymptomUpdate(BaseModel):
    date: Optional[dt.date] = None
    symptom: Optional[str] = None
    severity: Optional[int] = None
    tags: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

@router.get("/")
def list_symptoms(month: str | None = None, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    q = db.query(models.SymptomLog).filter(models.SymptomLog.user_id == user_id)
    if month:
        y, m = map(int, month.split("-"))
        first = dt.date(y, m, 1)
        last = (first.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        q = q.filter(models.SymptomLog.date >= first, models.SymptomLog.date <= last)
    return q.order_by(models.SymptomLog.date.asc()).all()

@router.post("/", status_code=201)
def add_symptom(body: SymptomCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    s = models.SymptomLog(user_id=user_id, **body.dict())
    db.add(s); db.commit(); db.refresh(s)
    return s

@router.patch("/{log_id}")
def update_symptom(log_id: int, body: SymptomUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    s = db.query(models.SymptomLog).filter_by(id=log_id, user_id=user_id).first()
    if not s:
        raise HTTPException(404, detail="Symptom log not found")
    for k, v in body.dict(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit(); db.refresh(s)
    return s

@router.delete("/{log_id}")
def delete_symptom(log_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    s = db.query(models.SymptomLog).filter_by(id=log_id, user_id=user_id).first()
    if not s:
        raise HTTPException(404, detail="Symptom log not found")
    db.delete(s); db.commit()
    return {"detail": "Deleted"}
