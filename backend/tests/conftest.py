"""
MediVision AI - Test Configuration

Pytest configuration and fixtures for testing.
"""

import asyncio
import pytest
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.models import Base
from app.db.session import get_db

# Test database URL (in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session_maker() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test HTTP client."""
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
        "role": "clinician"
    }


@pytest.fixture
def test_case_data():
    """Sample case data for testing."""
    return {
        "patient_id": "MRN-TEST-001",
        "clinical_notes": "Test patient with chest pain"
    }


@pytest.fixture
def sample_ct_metadata():
    """Sample CT scan metadata."""
    return {
        "modality": "CT",
        "body_part": "Chest",
        "study_date": "2024-01-15",
        "description": "CT Chest with Contrast",
        "metadata": {
            "manufacturer": "Siemens",
            "slice_thickness": 1.5,
            "kvp": 120,
            "tube_current": 200
        }
    }


@pytest.fixture
def sample_ultrasound_metadata():
    """Sample ultrasound metadata."""
    return {
        "modality": "US",
        "body_part": "Thyroid",
        "study_date": "2024-01-15",
        "description": "Thyroid Ultrasound",
        "metadata": {
            "manufacturer": "GE Healthcare",
            "probe_type": "Linear",
            "frequency_mhz": 12.0
        }
    }
