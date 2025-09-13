"""add hot-path indexes for user slices

Revision ID: 2c26113f20a1
Revises: fa5ae7f0f63e
Create Date: 2025-09-12 19:48:36.216390

"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision = "2c26113f20a1"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_cycles_user_start
        ON cycle_logs (user_id, start_date DESC);
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_symptoms_user_date
        ON symptom_logs (user_id, date DESC);
    """)

def downgrade():
    op.execute("DROP INDEX IF EXISTS idx_symptoms_user_date;")
    op.execute("DROP INDEX IF EXISTS idx_cycles_user_start;")
