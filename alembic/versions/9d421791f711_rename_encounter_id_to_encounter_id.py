"""Rename encounter_id to encounter_id

Revision ID: 9d421791f711
Revises: 922b52aa2718
Create Date: 2026-07-22 22:03:38.712284

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9d421791f711'
down_revision: Union[str, Sequence[str], None] = '922b52aa2718'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Rename the column safely
    op.alter_column('medicationchart', 'encouter_id', new_column_name='encounter_id')
    
    # 2. Update the foreign key constraints 
    op.drop_constraint('medicationchart_encouter_id_fkey', 'medicationchart', type_='foreignkey')
    op.create_foreign_key(None, 'medicationchart', 'encounter', ['encounter_id'], ['id'])


def downgrade() -> None:
    # 1. Revert the column name
    op.alter_column('medicationchart', 'encounter_id', new_column_name='encouter_id')
    
    # 2. Revert the foreign key constraints
    op.drop_constraint(None, 'medicationchart', type_='foreignkey')
    op.create_foreign_key('medicationchart_encouter_id_fkey', 'medicationchart', 'encounter', ['encouter_id'], ['id'])