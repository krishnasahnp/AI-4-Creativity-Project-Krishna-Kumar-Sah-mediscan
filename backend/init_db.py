"""
Initialize the database with all tables.
Run this script to create/recreate the database.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.base import Base
from app.db import async_engine  # Import engine directly
from app.db.models import *  # Import all models to register them
from sqlalchemy import inspect


async def init_db():
    """Create all database tables."""
    print("Creating database tables...")
    
    async with async_engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("✓ Created all tables successfully!")
    
    # Verify tables were created
    async with async_engine.connect() as conn:
        def check_tables(connection):
            inspector = inspect(connection)
            tables = inspector.get_table_names()
            print(f"\\nCreated {len(tables)} tables:")
            for table in sorted(tables):
                print(f"  - {table}")
            return tables
        
        tables = await conn.run_sync(check_tables)
        
        # Check if study table has status column
        if 'study' in tables:
            def check_study_columns(connection):
                inspector = inspect(connection)
                columns = inspector.get_columns('study')
                col_names = [col['name'] for col in columns]
                if 'status' in col_names:
                    print("\\n✓ Study table has 'status' column")
                else:
                    print("\\n✗ WARNING: Study table missing 'status' column!")
                return col_names
            
            await conn.run_sync(check_study_columns)
    
    await async_engine.dispose()
    print("\\nDatabase initialization complete!")


if __name__ == "__main__":
    asyncio.run(init_db())
