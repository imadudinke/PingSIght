"""Add share expiration and password fields to monitors

Revision ID: add_share_expiration_password
Revises: add_notification_settings
Create Date: 2024-04-06 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_share_expiration_password'
down_revision = 'add_notification_settings'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add share expiration and password fields
    op.add_column('monitors', sa.Column('share_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('monitors', sa.Column('share_password_hash', sa.String(255), nullable=True))


def downgrade() -> None:
    # Remove share expiration and password fields
    op.drop_column('monitors', 'share_password_hash')
    op.drop_column('monitors', 'share_expires_at')