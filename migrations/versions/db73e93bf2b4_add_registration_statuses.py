"""Add registration statuses

Revision ID: db73e93bf2b4
Revises: bc252bdfe1a5
Create Date: 2021-10-04 21:14:41.205102

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'db73e93bf2b4'
down_revision = 'bc252bdfe1a5'
branch_labels = None
depends_on = None

before = sa.Enum("Active", "Rejected", "PaymentPending")
after = sa.Enum("Active", "Rejected", "PaymentPending", "SelfUnregistered", "JustifiedAbsentee", "UnJustifiedAbsentee")

def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("registrations") as batch_op:
        batch_op.alter_column(
            "status",
            existing_type=before,
            type_=after,
            nullable=False,
        )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("registrations") as batch_op:
        batch_op.alter_column(
            "status",
            existing_type=after,
            type_=before,
            nullable=False,
        )
    # ### end Alembic commands ###