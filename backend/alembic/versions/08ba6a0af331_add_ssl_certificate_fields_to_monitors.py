"""add_ssl_certificate_fields_to_monitors

Revision ID: 08ba6a0af331
Revises: 14802c64e2f7
Create Date: 2026-03-31 09:20:53.489508

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '08ba6a0af331'
down_revision: Union[str, Sequence[str], None] = '14802c64e2f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add SSL certificate fields to monitors table
    op.add_column('monitors', sa.Column('ssl_status', sa.String(32), nullable=True))
    op.add_column('monitors', sa.Column('ssl_expiry_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('monitors', sa.Column('ssl_days_remaining', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove SSL certificate fields from monitors table
    op.drop_column('monitors', 'ssl_days_remaining')
    op.drop_column('monitors', 'ssl_expiry_date')
    op.drop_column('monitors', 'ssl_status')
