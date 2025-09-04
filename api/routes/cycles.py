from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db import get_db
import models, schemas
from .deps import get_current_user_id

router = APIRouter()

@router.get("/", response_model=list[schemas.CycleOut])
def list_cycles(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    rows = db.query(models.CycleLog).filter(models.CycleLog.user_id == user_id).order_by(models.CycleLog.start_date.desc()).all()
    return rows

@router.post("/", response_model=schemas.CycleOut)
def add_cycle(data: schemas.CycleIn, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    row = models.CycleLog(user_id=user_id, **data.dict())
    db.add(row); db.commit(); db.refresh(row)
    return row
