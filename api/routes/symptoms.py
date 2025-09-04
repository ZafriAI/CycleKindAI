from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db import get_db
import models, schemas
from .deps import get_current_user_id

router = APIRouter()

@router.get("/", response_model=list[schemas.SymptomOut])
def list_symptoms(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    rows = db.query(models.SymptomLog).filter(models.SymptomLog.user_id == user_id).order_by(models.SymptomLog.date.desc()).all()
    return rows

@router.post("/", response_model=schemas.SymptomOut)
def add_symptom(data: schemas.SymptomIn, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    row = models.SymptomLog(user_id=user_id, **data.dict())
    db.add(row); db.commit(); db.refresh(row)
    return row
