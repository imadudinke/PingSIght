"""add slack notifications

Revision ID: add_slack_notifications
Revises: add_status_pages
Create Date: 2026-04-07 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_slack_notifications'
down_revision = 'add_status_pages'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add Slack notification fields to user_notification_settings table
    op.add_column('user_notification_settings', sa.Column('slack_webhook_url', sa.String(length=500), nullable=True))
    op.add_column('user_notification_settings', sa.Column('slack_enabled', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove Slack notification fields
    op.drop_column('user_notification_settings', 'slack_enabled')
    op.drop_column('user_notification_settings', 'slack_webhook_url')
