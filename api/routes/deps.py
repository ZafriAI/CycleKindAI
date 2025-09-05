from fastapi import Header, HTTPException, Depends
from jose import jwt, JWTError
import os
from sqlalchemy.orm import Session
from db import get_db
import models

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
ALGORITHM = "HS256"

def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split()[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
