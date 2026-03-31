"""add_step_results_to_heartbeats

Revision ID: 16bff74b24f1
Revises: a79aae7a9ce6
Create Date: 2026-03-31 22:37:13.833867

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '16bff74b24f1'
down_revision: Union[str, Sequence[str], None] = 'a79aae7a9ce6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add step_results column for scenario monitor results
    op.add_column('heartbeats', sa.Column('step_results', postgresql.JSONB, nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove step_results column
    op.drop_column('heartbeats', 'step_results')
