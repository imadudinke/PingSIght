"""add_is_anomaly_to_heartbeats

Revision ID: 4459b3fd5568
Revises: 16bff74b24f1
Create Date: 2026-04-01 08:59:59.640159

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4459b3fd5568'
down_revision: Union[str, Sequence[str], None] = '16bff74b24f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('heartbeats', sa.Column('is_anomaly', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('heartbeats', 'is_anomaly')
