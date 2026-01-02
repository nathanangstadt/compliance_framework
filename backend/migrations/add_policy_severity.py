"""
Migration: Add severity column to policies table

This adds a 'severity' field to policies with values: 'error', 'warning', 'info'
Default is 'error' for backward compatibility.
"""

from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./compliance.db")

def upgrade():
    """Add severity column to policies table"""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Add severity column with default 'error'
        conn.execute(text("""
            ALTER TABLE policies
            ADD COLUMN severity VARCHAR DEFAULT 'error'
        """))
        conn.commit()
        print("✓ Added severity column to policies table")

def downgrade():
    """Remove severity column from policies table"""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # SQLite doesn't support DROP COLUMN directly, need to recreate table
        # For now, just log that downgrade would require manual intervention
        print("⚠ Downgrade not implemented for SQLite. Manual intervention required.")
        print("  To remove severity column, you would need to:")
        print("  1. Create new table without severity column")
        print("  2. Copy data from old table")
        print("  3. Drop old table")
        print("  4. Rename new table")

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python add_policy_severity.py [upgrade|downgrade]")
        sys.exit(1)

    action = sys.argv[1]

    if action == "upgrade":
        upgrade()
    elif action == "downgrade":
        downgrade()
    else:
        print(f"Unknown action: {action}")
        print("Use 'upgrade' or 'downgrade'")
        sys.exit(1)
