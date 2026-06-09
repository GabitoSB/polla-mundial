"""add user avatar fields

Revision ID: c8f2a1b3d4e5
Revises: b1e4d9f2c3a7
Create Date: 2026-06-09 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c8f2a1b3d4e5'
down_revision = 'b1e4d9f2c3a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('avatar_data', sa.LargeBinary(), nullable=True))
    op.add_column('users', sa.Column('avatar_content_type', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'avatar_content_type')
    op.drop_column('users', 'avatar_data')
