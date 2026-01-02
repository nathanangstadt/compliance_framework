"""
Migration script to update compliance_evaluations table for file-based memories.

This script:
1. Drops the foreign key constraint on memory_id
2. Changes memory_id from INTEGER to VARCHAR
3. Clears existing evaluations (since they reference non-existent database IDs)
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "compliance.db")

def migrate():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Starting migration...")

        # Create a new table with the correct schema
        print("Creating new compliance_evaluations table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS compliance_evaluations_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                memory_id VARCHAR NOT NULL,
                policy_id INTEGER NOT NULL,
                is_compliant BOOLEAN NOT NULL,
                violations JSON DEFAULT '[]',
                evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (policy_id) REFERENCES policies (id)
            )
        """)

        # Create index on memory_id for better query performance
        print("Creating index on memory_id...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS ix_compliance_evaluations_new_memory_id
            ON compliance_evaluations_new (memory_id)
        """)

        # Drop the old table
        print("Dropping old compliance_evaluations table...")
        cursor.execute("DROP TABLE IF EXISTS compliance_evaluations")

        # Rename the new table
        print("Renaming new table...")
        cursor.execute("""
            ALTER TABLE compliance_evaluations_new
            RENAME TO compliance_evaluations
        """)

        conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
