"""add_scenario_monitor_support

Revision ID: a79aae7a9ce6
Revises: 08ba6a0af331
Create Date: 2026-03-31 11:35:50.596058

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a79aae7a9ce6'
down_revision: Union[str, Sequence[str], None] = '08ba6a0af331'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add monitor_type column
    op.add_column('monitors', sa.Column('monitor_type', sa.String(20), server_default='simple', nullable=False))
    
    # Add steps column for scenario-based monitors
    op.add_column('monitors', sa.Column('steps', postgresql.JSONB, server_default='[]', nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove scenario monitor columns
    op.drop_column('monitors', 'steps')
    op.drop_column('monitors', 'monitor_type')
