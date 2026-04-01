"""add_last_ping_received_to_monitors

Revision ID: 70fa01f60af3
Revises: 70bed68128ac
Create Date: 2026-04-01 20:16:11.499357

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '70fa01f60af3'
down_revision: Union[str, Sequence[str], None] = '70bed68128ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('monitors', sa.Column('last_ping_received', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('monitors', 'last_ping_received')
