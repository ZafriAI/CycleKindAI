"""merge heads

Revision ID: dc435c094ef0
Revises: 2c26113f20a1, fa5ae7f0f63e
Create Date: 2025-09-14 17:04:25.293788

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dc435c094ef0'
down_revision: Union[str, None] = ('2c26113f20a1', 'fa5ae7f0f63e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
