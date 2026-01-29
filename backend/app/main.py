"""
MediScan AI - ML Image Processing Backend
FastAPI application for medical image analysis
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.routes import upload, analyze, report
from app.services.inference_engine import InferenceEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global inference engine instance
inference_engine: InferenceEngine = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global inference_engine
    
    # Startup: Load ML models
    logger.info("🚀 Starting MediScan AI Backend...")
    logger.info("📦 Loading ML models...")
    
    inference_engine = InferenceEngine()
    await inference_engine.load_models()
    
    logger.info("✅ Models loaded successfully!")
    
    yield
    
    # Shutdown: Cleanup
    logger.info("👋 Shutting down MediScan AI Backend...")


# Create FastAPI app
app = FastAPI(
    title="MediScan AI - ML Backend",
    description="Medical Image Processing API with AI-powered analysis",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(report.router, prefix="/api", tags=["Reports"])


@app.get("/")
async def root():
    return {
        "service": "MediScan AI - ML Backend",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": inference_engine is not None and inference_engine.is_ready
    }


def get_inference_engine() -> InferenceEngine:
    """Dependency injection for inference engine"""
    return inference_engine
