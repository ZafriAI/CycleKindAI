# deps.py (or routes/deps.py)
from fastapi import Header, HTTPException, Depends
from jose import jwt, JWTError, ExpiredSignatureError
import os
from sqlalchemy.orm import Session
from db import get_db
import models

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
ALGORITHM = "HS256"

def get_current_user_id(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),
) -> int:
    # Require Bearer token
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split()[1]

    # Decode & basic validation
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = int(sub)

    # Load user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Token-version check (back-compat: missing column/claim => 0)
    token_tv = int(payload.get("tv", 0))
    db_tv = int(getattr(user, "token_version", 0))
    if db_tv != token_tv:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")

    return user.id

def get_current_user(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
