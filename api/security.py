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

def create_token(user_id: int, token_version: int = 0, expires_minutes: int = 60*24*30) -> str:
    exp = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {"sub": str(user_id), "tv": int(token_version), "exp": exp}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
