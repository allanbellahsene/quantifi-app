"""Add created_at and last_updated to BacktestResult

Revision ID: afa8bb6c9102
Revises: b9e3890f2542
Create Date: 2024-11-28 17:18:17.407341

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'afa8bb6c9102'
down_revision: Union[str, None] = 'b9e3890f2542'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('backtest', sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True))
    op.add_column('backtest', sa.Column('last_updated', sa.DateTime(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('backtest', 'last_updated')
    op.drop_column('backtest', 'created_at')
    # ### end Alembic commands ###
