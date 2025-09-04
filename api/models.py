from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    allow_research = Column(Boolean, default=False)

    cycles = relationship("CycleLog", back_populates="user", cascade="all, delete-orphan")
    symptoms = relationship("SymptomLog", back_populates="user", cascade="all, delete-orphan")

class CycleLog(Base):
    __tablename__ = "cycle_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    flow_intensity = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="cycles")

class SymptomLog(Base):
    __tablename__ = "symptom_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    date = Column(Date, nullable=False)
    symptom = Column(String, nullable=False)
    severity = Column(Integer, nullable=True)
    tags = Column(JSON, nullable=True)
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="symptoms")
