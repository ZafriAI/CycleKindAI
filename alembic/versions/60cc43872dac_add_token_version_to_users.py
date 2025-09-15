"""add token_version to users

Revision ID: 60cc43872dac
Revises: dc435c094ef0
Create Date: 2025-09-14 17:04:31.767104

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '60cc43872dac'
down_revision: Union[str, None] = 'dc435c094ef0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column("users", sa.Column("token_version", sa.Integer(), nullable=False, server_default="0"))
    # optional: drop the server_default after backfilling
    op.alter_column("users", "token_version", server_default=None)

def downgrade():
    op.drop_column("users", "token_version")

