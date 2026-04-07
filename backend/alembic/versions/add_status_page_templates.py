"""add status page templates

Revision ID: add_status_page_templates
Revises: add_slack_notifications
Create Date: 2026-04-07 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_status_page_templates'
down_revision = 'add_slack_notifications'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add template fields to status_pages table
    op.add_column('status_pages', sa.Column('template', sa.String(length=50), nullable=False, server_default='minimal'))
    op.add_column('status_pages', sa.Column('theme', sa.String(length=50), nullable=False, server_default='dark'))
    op.add_column('status_pages', sa.Column('layout', sa.String(length=50), nullable=False, server_default='list'))


def downgrade() -> None:
    # Remove template fields
    op.drop_column('status_pages', 'layout')
    op.drop_column('status_pages', 'theme')
    op.drop_column('status_pages', 'template')