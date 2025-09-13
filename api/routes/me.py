from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
from routes.deps import get_current_user_id
import models

router = APIRouter(prefix="/me", tags=["me"])

@router.get("/export")
def export_my_data(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    cycles = (
        db.query(models.CycleLog)
          .filter(models.CycleLog.user_id == user_id)
          .order_by(models.CycleLog.start_date.asc())
          .all()
    )
    symptoms = (
        db.query(models.SymptomLog)
          .filter(models.SymptomLog.user_id == user_id)
          .order_by(models.SymptomLog.date.asc())
          .all()
    )
    return {
        "cycles": [
            {"id": c.id, "start_date": c.start_date.isoformat()}
            for c in cycles
        ],
        "symptoms": [
            {
                "id": s.id,
                "date": s.date.isoformat(),
                "symptom": s.symptom,
                "severity": getattr(s, "severity", None),
                "tags": getattr(s, "tags", None),
                "notes": getattr(s, "notes", None),
            }
            for s in symptoms
        ],
    }

@router.delete("/data")
def delete_my_data(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # Delete children explicitly (safe regardless of FK ondelete policy)
    db.query(models.SymptomLog).filter(models.SymptomLog.user_id == user_id).delete(synchronize_session=False)
    db.query(models.CycleLog).filter(models.CycleLog.user_id == user_id).delete(synchronize_session=False)
    db.commit()
    return {"ok": True}
