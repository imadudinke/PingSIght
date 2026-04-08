"""add_composite_index_heartbeats

Revision ID: f7beabb5404f
Revises: add_status_page_templates
Create Date: 2026-04-08 00:48:24.835535

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7beabb5404f'
down_revision: Union[str, Sequence[str], None] = 'add_status_page_templates'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create composite index on heartbeats table for efficient queries
    # This index optimizes queries like: WHERE monitor_id = X ORDER BY created_at DESC
    op.create_index(
        'ix_heartbeats_monitor_created',
        'heartbeats',
        ['monitor_id', 'created_at'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the composite index
    op.drop_index('ix_heartbeats_monitor_created', table_name='heartbeats')
