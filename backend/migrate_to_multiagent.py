#!/usr/bin/env python3
"""
Migration script to add multi-agent support.

This script:
1. Drops all existing tables
2. Recreates tables with agent_id columns
3. Prepares the system for multi-agent operation

WARNING: This will delete all existing evaluation data in the database.
Session files in agent_data/ will be preserved.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models import Base

def migrate(force=False):
    print("=" * 60)
    print("Multi-Agent Migration Script")
    print("=" * 60)
    print()
    print("WARNING: This will drop all existing tables and data!")
    print("Session files in agent_data/ will be preserved.")
    print()

    if not force:
        response = input("Continue? (yes/no): ")
        if response.lower() != 'yes':
            print("Migration cancelled.")
            return
    else:
        print("Running in force mode (--force flag provided)")
        print()

    print()
    print("Step 1: Dropping all existing tables...")
    try:
        Base.metadata.drop_all(bind=engine)
        print("✓ All tables dropped successfully")
    except Exception as e:
        print(f"✗ Error dropping tables: {e}")
        return

    print()
    print("Step 2: Creating new tables with agent_id support...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ All tables created successfully")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        return

    print()
    print("=" * 60)
    print("Migration completed successfully!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Restart the backend container")
    print("2. Access the application")
    print("3. Process sessions for each agent to create evaluations")
    print()

if __name__ == "__main__":
    force = "--force" in sys.argv
    migrate(force=force)
