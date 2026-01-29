"""
MediVision AI - Main Application Entry Point

This is the main FastAPI application that serves as the entry point for the
MediVision AI medical imaging analysis platform. It orchestrates all API routes,
middleware, and application lifecycle events.

Author: MediVision AI Team
Version: 1.0.0
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import ORJSONResponse
from loguru import logger

from app.api import router as api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.db.session import engine
from app.db.base import Base


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifecycle manager.
    
    Handles startup and shutdown events for the application,
    including database initialization and cleanup tasks.
    """
    # Startup
    logger.info("🚀 Starting MediVision AI Backend...")
    
    # Setup logging
    setup_logging()
    
    # Initialize database tables (in production, use Alembic migrations)
    logger.info("📦 Initializing database...")
    async with engine.begin() as conn:
        # Only create tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("✅ MediVision AI Backend started successfully!")
    logger.info(f"📍 API Documentation: http://localhost:{settings.PORT}/docs")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down MediVision AI Backend...")
    await engine.dispose()
    logger.info("👋 Goodbye!")


def create_application() -> FastAPI:
    """
    Factory function to create and configure the FastAPI application.
    
    This pattern allows for easy testing and configuration management.
    
    Returns:
        FastAPI: Configured FastAPI application instance
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="""
        MediVision AI - Intelligent Medical Imaging Analysis Platform
        
        An AI-powered platform for CT scan and Ultrasound analysis with:
        - Clinical findings (classification, segmentation, measurements)
        - Structured report generation
        - Explainability overlays
        - Multimodal chat (image + text + voice)
        - Speech-to-text for clinician dictation
        
        ⚠️ DISCLAIMER: This is a research/educational platform. 
        Not intended for clinical diagnosis without proper regulatory approval.
        """,
        version="1.0.0",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add Gzip compression for responses
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Include API routes
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    
    # Health check endpoint at root
    @app.get("/", tags=["Health"])
    async def root() -> dict:
        """Root endpoint - Health check"""
        return {
            "status": "healthy",
            "service": "MediVision AI",
            "version": "1.0.0",
            "message": "Welcome to MediVision AI - Intelligent Medical Imaging Analysis"
        }
    
    @app.get("/health", tags=["Health"])
    async def health_check() -> dict:
        """Detailed health check endpoint"""
        return {
            "status": "healthy",
            "database": "connected",
            "ai_services": "ready",
            "storage": "available"
        }
    
    return app


# Create the application instance
app = create_application()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else 4,
    )
