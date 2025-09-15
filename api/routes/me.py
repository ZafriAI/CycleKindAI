from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from db import get_db
from routes.deps import get_current_user_id
import models
from security import verify_password, hash_password

router = APIRouter(prefix="/me", tags=["me"])

class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8)

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

@router.patch("/password")
def change_password(
    body: ChangePasswordIn,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(401, "Current password is incorrect")

    # Basic policy (adjust to your needs)
    if body.current_password == body.new_password:
        raise HTTPException(422, "New password must be different from current")
    if len(body.new_password) < 8:
        raise HTTPException(422, "New password must be at least 8 characters")

    user.password_hash = hash_password(body.new_password)
    # Invalidate existing JWTs by bumping token_version
    user.token_version = (user.token_version or 0) + 1
    db.add(user)
    db.commit()
    return {"ok": True}

@router.delete("")
def delete_account(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    # Delete child records explicitly (safe regardless of FK ondelete policy)
    db.query(models.SymptomLog).filter(models.SymptomLog.user_id == user_id).delete(synchronize_session=False)
    db.query(models.CycleLog).filter(models.CycleLog.user_id == user_id).delete(synchronize_session=False)
    # Finally delete the user
    deleted = db.query(models.User).filter(models.User.id == user_id).delete(synchronize_session=False)
    db.commit()
    if not deleted:
        raise HTTPException(404, "User not found")
    return {"ok": True}
