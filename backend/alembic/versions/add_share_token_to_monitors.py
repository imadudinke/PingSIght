"""add share token to monitors

Revision ID: 9f8e7d6c5b4a
Revises: 70fa01f60af3
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '9f8e7d6c5b4a'
down_revision = '70fa01f60af3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add share_token column
    op.add_column('monitors', sa.Column('share_token', sa.String(length=64), nullable=True))
    op.create_index(op.f('ix_monitors_share_token'), 'monitors', ['share_token'], unique=True)
    
    # Add is_public column
    op.add_column('monitors', sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_index(op.f('ix_monitors_share_token'), table_name='monitors')
    op.drop_column('monitors', 'share_token')
    op.drop_column('monitors', 'is_public')
