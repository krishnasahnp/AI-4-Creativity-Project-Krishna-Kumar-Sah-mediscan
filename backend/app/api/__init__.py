"""
MediVision AI - API Router

Aggregates all API endpoint routers.
"""

from fastapi import APIRouter

from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.cases import router as cases_router
from app.api.endpoints.studies import router as studies_router
from app.api.endpoints.upload import router as upload_router
from app.api.endpoints.inference import router as inference_router
from app.api.endpoints.reports import router as reports_router
from app.api.endpoints.assistant import router as assistant_router
from app.api.endpoints.audio import router as audio_router
from app.api.endpoints.admin import router as admin_router

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(cases_router, prefix="/cases", tags=["Cases"])
api_router.include_router(studies_router, prefix="/studies", tags=["Studies"])
api_router.include_router(upload_router, prefix="/upload", tags=["Upload"])
api_router.include_router(inference_router, prefix="/inference", tags=["Inference"])
api_router.include_router(reports_router, prefix="/reports", tags=["Reports"])
api_router.include_router(assistant_router, prefix="/assistant", tags=["AI Assistant"])
api_router.include_router(audio_router, prefix="/audio", tags=["Audio Processing"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])

__all__ = ["api_router"]
