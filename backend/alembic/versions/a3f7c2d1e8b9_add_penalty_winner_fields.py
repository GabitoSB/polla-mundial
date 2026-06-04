"""add penalty_winner fields

Revision ID: a3f7c2d1e8b9
Revises: ff9e8dff82e5
Create Date: 2026-06-04 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a3f7c2d1e8b9'
down_revision = 'ff9e8dff82e5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('matches', sa.Column('penalty_winner', sa.String(100), nullable=True))
    op.add_column('predictions', sa.Column('predicted_penalty_winner', sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column('predictions', 'predicted_penalty_winner')
    op.drop_column('matches', 'penalty_winner')
