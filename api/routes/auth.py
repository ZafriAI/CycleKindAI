from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models, schemas
from security import hash_password, verify_password, create_token
import os

router = APIRouter()
ALLOW_REG = os.getenv("ALLOW_REGISTRATION", "true").lower() == "true"

@router.post("/register", response_model=schemas.TokenOut)
def register(data: schemas.RegisterIn, db: Session = Depends(get_db)):
    if not ALLOW_REG:
        raise HTTPException(status_code=403, detail="Registration disabled")
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = models.User(email=data.email, password_hash=hash_password(data.password))
    db.add(user); db.commit(); db.refresh(user)
    return schemas.TokenOut(access_token=create_token(str(user.id)))

@router.post("/login", response_model=schemas.TokenOut)
def login(data: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return schemas.TokenOut(access_token=create_token(str(user.id)))
