"""add_domain_expiration_to_monitors

Revision ID: 70bed68128ac
Revises: 2d085e61e148
Create Date: 2026-04-01 10:20:45.203333

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '70bed68128ac'
down_revision: Union[str, Sequence[str], None] = '2d085e61e148'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('monitors', sa.Column('domain_status', sa.String(32), nullable=True))
    op.add_column('monitors', sa.Column('domain_expiry_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('monitors', sa.Column('domain_days_remaining', sa.Integer(), nullable=True))
    op.add_column('monitors', sa.Column('domain_last_checked', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('monitors', 'domain_last_checked')
    op.drop_column('monitors', 'domain_days_remaining')
    op.drop_column('monitors', 'domain_expiry_date')
    op.drop_column('monitors', 'domain_status')
