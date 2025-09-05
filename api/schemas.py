from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List, Literal
from datetime import date

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class RegisterIn(BaseModel):
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class CycleIn(BaseModel):
    start_date: date
    end_date: Optional[date] = None
    flow_intensity: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None

class CycleOut(CycleIn):
    id: int
    class Config:
        from_attributes = True

class SymptomIn(BaseModel):
    date: date
    symptom: str
    severity: Optional[int] = Field(None, ge=1, le=5)
    tags: Optional[Dict[str, str]] = None
    notes: Optional[str] = None

class SymptomOut(SymptomIn):
    id: int
    class Config:
        from_attributes = True

class InsightOut(BaseModel):
    next_period_start: Optional[date] = None
    avg_cycle_length_days: Optional[float] = None
    notes: Optional[str] = None

class ChatMsg(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatIn(BaseModel):
    prompt: Optional[str] = None
    # NEW:
    messages: Optional[List[ChatMsg]] = None
    threadId: Optional[str] = None  # optional: carry a thread id if you want
    
class IngestDoc(BaseModel):
    title: str
    url: str
    text: str

class IngestIn(BaseModel):
    docs: List[IngestDoc]
    
class AskIn(BaseModel):
    question: str
    k: int = 8
