import sqlalchemy as sa
from sqlalchemy.orm import relationship
from uuid import uuid4
try:
    from sqlalchemy.dialects.postgresql import UUID
except Exception:
    from sqlalchemy import String as UUID  # type: ignore

from .base import Base  # adjust to your project

class SymptomType(Base):
    __tablename__ = "symptom_types"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False)

    name = sa.Column(sa.String(64), nullable=False)       # e.g., "cramps", "mood:low"
    category = sa.Column(sa.String(64), nullable=True)

    # One-to-many backref for convenience
    logs = relationship("SymptomLog", back_populates="symptom_type", cascade="all, delete-orphan")

    __table_args__ = (
        sa.UniqueConstraint("user_id", "name", name="uq_user_symptom_name"),
    )

class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False)

    date = sa.Column(sa.Date, index=True, nullable=False)
    symptom_type_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("symptom_types.id"), nullable=False)

    intensity = sa.Column(sa.Integer, nullable=True)  # 1-5
    notes = sa.Column(sa.Text, nullable=True)
    deleted_at = sa.Column(sa.DateTime(timezone=True), nullable=True)

    # <-- This relationship is what your routes/insights rely on:
    symptom_type = relationship("SymptomType", back_populates="logs", lazy="joined")

    __table_args__ = (
        sa.Index("ix_symptom_logs_user_date", "user_id", "date"),
    )

    def __repr__(self) -> str:
        return f"<SymptomLog {self.id} {self.date} {self.symptom_type_id} user={self.user_id}>"
