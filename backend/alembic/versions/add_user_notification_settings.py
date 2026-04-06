"""add user notification settings

Revision ID: add_notification_settings
Revises: 9f8e7d6c5b4a
Create Date: 2026-04-06 08:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_notification_settings'
down_revision = '9f8e7d6c5b4a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_notification_settings table
    op.create_table(
        'user_notification_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('discord_webhook_url', sa.String(500), nullable=True),
        sa.Column('discord_enabled', sa.Boolean(), default=False, nullable=False),
        sa.Column('alert_on_down', sa.Boolean(), default=True, nullable=False),
        sa.Column('alert_on_recovery', sa.Boolean(), default=True, nullable=False),
        sa.Column('alert_threshold', sa.Integer(), default=1, nullable=False),  # Alert after N consecutive failures
        sa.Column('ssl_expiry_alert_days', sa.Integer(), default=7, nullable=False),  # Alert when SSL expires in N days
        sa.Column('domain_expiry_alert_days', sa.Integer(), default=7, nullable=False),  # Alert when domain expires in N days
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
    )
    
    # Create index on user_id for faster lookups
    op.create_index('ix_user_notification_settings_user_id', 'user_notification_settings', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_user_notification_settings_user_id')
    op.drop_table('user_notification_settings')
