import asyncio
import os
import sys

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

from app.db.base import Base
from app.db.session import engine, async_session_maker
# Import all models to ensure they are registered with Base
from app.db import models
from app.db.models import User, UserRole
from app.core.security import hash_password

async def init_models():
    print("Initializing database...")
    async with engine.begin() as conn:
        print("Dropping existing tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed default user
    print("Seeding default user...")
    async with async_session_maker() as db:
        user = User(
            email="admin@medivision.com",
            # Use a secure password in production!
            password_hash=hash_password("admin123"),
            full_name="Dr. Krishna Kumar",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(user)
        await db.commit()
        print(f"Created user: {user.email}")

    print("Database initialized successfully.")

if __name__ == "__main__":
    asyncio.run(init_models())
