"""add_maintenance_mode_to_monitors

Revision ID: 2d085e61e148
Revises: 4459b3fd5568
Create Date: 2026-04-01 09:34:42.534370

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d085e61e148'
down_revision: Union[str, Sequence[str], None] = '4459b3fd5568'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('monitors', sa.Column('is_maintenance', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('monitors', 'is_maintenance')
