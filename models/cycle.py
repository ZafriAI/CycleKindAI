import sqlalchemy as sa
from sqlalchemy.orm import relationship
from uuid import uuid4
try:
    # Postgres
    from sqlalchemy.dialects.postgresql import UUID
except Exception:
    # Fallback (e.g., SQLite dev); stores as text
    from sqlalchemy import String as UUID  # type: ignore

from .base import Base  # adjust to your project (e.g., from db import Base)

class Cycle(Base):
    __tablename__ = "cycles"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False)

    start_date = sa.Column(sa.Date, nullable=False)
    end_date = sa.Column(sa.Date, nullable=True)  # may be inferred from next cycle

    source = sa.Column(sa.Enum("user", "predicted", name="cycle_source"),
                       default="user", nullable=False)
    notes = sa.Column(sa.Text, nullable=True)
    deleted_at = sa.Column(sa.DateTime(timezone=True), nullable=True)

    __table_args__ = (
        sa.Index("ix_cycles_user_start", "user_id", "start_date"),
    )

    def __repr__(self) -> str:  # optional, handy for logs
        return f"<Cycle {self.id} {self.start_date}→{self.end_date} user={self.user_id}>"
