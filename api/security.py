from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import os

ALGORITHM = "HS256"
JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(pw: str):
    return pwd_context.hash(pw)

def verify_password(pw: str, pw_hash: str):
    return pwd_context.verify(pw, pw_hash)

def create_token(sub: str, expires_minutes: int = 60*24*30):
    exp = datetime.utcnow() + timedelta(minutes=expires_minutes)
    return jwt.encode({"sub": sub, "exp": exp}, JWT_SECRET, algorithm=ALGORITHM)
