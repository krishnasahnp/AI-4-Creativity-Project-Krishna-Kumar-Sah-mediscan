"""
MediVision AI - Database Session Management

Async SQLAlchemy session configuration for PostgreSQL.

Author: MediVision AI Team
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings


# Create async engine
# Note: Using NullPool for better handling in async context
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,  # Enable connection health checks
    # Use NullPool in async context to avoid connection pool issues
    # In production with high concurrency, consider AsyncAdaptedQueuePool
    poolclass=NullPool if settings.DEBUG else None,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    """
    Dependency for getting database sessions.
    
    Yields a database session and ensures it's closed after use.
    Use this as a FastAPI dependency.
    
    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    
    Yields:
        AsyncSession: Database session
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_db_no_commit() -> AsyncSession:
    """
    Get a database session without auto-commit.
    
    Useful for read-only operations or when you want
    explicit control over commits.
    
    Yields:
        AsyncSession: Database session
    """
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
