"""add extra_time fields

Revision ID: b1e4d9f2c3a7
Revises: a3f7c2d1e8b9
Create Date: 2026-06-04 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b1e4d9f2c3a7'
down_revision = 'a3f7c2d1e8b9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # True = match went to extra time; False = decided in 90 min; None = not yet played
    op.add_column('matches', sa.Column('has_extra_time', sa.Boolean(), nullable=True))
    # True = user predicts extra time; False = user predicts decided in 90 min; None = not answered
    op.add_column('predictions', sa.Column('predicted_extra_time', sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column('predictions', 'predicted_extra_time')
    op.drop_column('matches', 'has_extra_time')
