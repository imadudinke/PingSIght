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
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
