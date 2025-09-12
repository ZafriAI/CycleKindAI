from alembic import op
import sqlalchemy as sa

revision = "fa5ae7f0f63e"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # 1) Extension (safe)
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist;")

    # 2) Make end_date NOT NULL (safe if already NOT NULL)
    op.alter_column(
        "cycle_logs",
        "end_date",
        existing_type=sa.Date(),
        nullable=False
    )

    # 3) CHECK constraint: only add if missing
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'cycle_valid_range'
              AND conrelid = 'cycle_logs'::regclass
        ) THEN
            ALTER TABLE cycle_logs
            ADD CONSTRAINT cycle_valid_range
            CHECK (end_date >= start_date);
        END IF;
    END$$;
    """)

    # 4) UNIQUE constraint: only add if missing
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'cycle_exact_unique'
              AND conrelid = 'cycle_logs'::regclass
        ) THEN
            ALTER TABLE cycle_logs
            ADD CONSTRAINT cycle_exact_unique
            UNIQUE (user_id, start_date, end_date);
        END IF;
    END$$;
    """)

    # 5) EXCLUDE constraint: only add if missing
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'cycle_no_overlap'
              AND conrelid = 'cycle_logs'::regclass
        ) THEN
            ALTER TABLE cycle_logs
            ADD CONSTRAINT cycle_no_overlap
            EXCLUDE USING gist (
                user_id WITH =,
                daterange(start_date, end_date, '[]') WITH &&
            );
        END IF;
    END$$;
    """)

    # 6) Helpful index (IF NOT EXISTS is supported for indexes)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_cycle_user_start
        ON cycle_logs (user_id, start_date);
    """)

def downgrade():
    op.execute("DROP INDEX IF EXISTS idx_cycle_user_start;")
    for c in ("cycle_no_overlap", "cycle_exact_unique", "cycle_valid_range"):
        op.execute(f"ALTER TABLE cycle_logs DROP CONSTRAINT IF EXISTS {c};")
    op.alter_column(
        "cycle_logs",
        "end_date",
        existing_type=sa.Date(),
        nullable=True
    )
