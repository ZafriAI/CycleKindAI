from fastapi import Header, HTTPException
from jose import jwt, JWTError
import os

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
