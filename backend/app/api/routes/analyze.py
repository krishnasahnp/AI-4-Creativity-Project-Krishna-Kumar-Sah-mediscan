"""
Analysis API routes for ML-powered image analysis
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import os

from app.services.preprocessor import Preprocessor
from app.services.quality_checker import QualityChecker
from app.services.inference_engine import InferenceEngine

router = APIRouter()


class AnalyzeRequest(BaseModel):
    image_id: str
    modality: Optional[str] = None
    run_segmentation: bool = True
    run_gradcam: bool = True


class Finding(BaseModel):
    name: str
    confidence: float
    severity: str  # "normal", "mild", "moderate", "severe"


class AnalysisResult(BaseModel):
    image_id: str
    modality: str
    quality: dict
    findings: List[Finding]
    segmentation_mask: Optional[str] = None  # Base64 encoded
    gradcam_overlay: Optional[str] = None  # Base64 encoded
    processing_time_ms: float


# Upload directory (should match upload.py)
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads")


@router.post("/analyze")
async def analyze_image(request: AnalyzeRequest):
    """
    Run full ML analysis pipeline on an uploaded image
    
    Pipeline:
    1. Quality checks (blur, contrast, orientation)
    2. Preprocessing (normalize, denoise, CLAHE)
    3. Classification (multi-label findings)
    4. Segmentation (ROI masks)
    5. Grad-CAM (attention heatmaps)
    """
    import time
    start_time = time.time()
    
    # Find uploaded file
    file_path = None
    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(request.image_id):
            file_path = os.path.join(UPLOAD_DIR, filename)
            break
    
    if not file_path:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # 1. Quality Check
    quality_checker = QualityChecker()
    quality_result = quality_checker.check(file_path)
    
    if not quality_result["is_acceptable"]:
        return JSONResponse({
            "success": False,
            "image_id": request.image_id,
            "quality": quality_result,
            "message": "Image quality is insufficient for reliable analysis",
            "processing_time_ms": (time.time() - start_time) * 1000
        })
    
    # 2. Preprocess
    preprocessor = Preprocessor()
    processed_image = preprocessor.process(file_path, request.modality or "CT")
    
    # 3. Run Inference
    inference_engine = InferenceEngine()
    await inference_engine.load_models()  # Ensure models are loaded
    
    results = await inference_engine.analyze(
        processed_image,
        modality=request.modality or "CT",
        run_segmentation=request.run_segmentation,
        run_gradcam=request.run_gradcam
    )
    
    processing_time = (time.time() - start_time) * 1000
    
    return JSONResponse({
        "success": True,
        "image_id": request.image_id,
        "modality": results["modality"],
        "quality": quality_result,
        "findings": results["findings"],
        "segmentation_available": results.get("segmentation") is not None,
        "gradcam_available": results.get("gradcam") is not None,
        "processing_time_ms": processing_time
    })


@router.get("/analyze/{image_id}/findings")
async def get_findings(image_id: str):
    """Get analysis findings for a previously analyzed image"""
    # In production, this would fetch from a database
    # For demo, return mock data
    
    return JSONResponse({
        "image_id": image_id,
        "findings": [
            {"name": "Cardiomegaly", "confidence": 0.23, "severity": "normal"},
            {"name": "Lung Opacity", "confidence": 0.87, "severity": "moderate"},
            {"name": "Pleural Effusion", "confidence": 0.12, "severity": "normal"},
            {"name": "Consolidation", "confidence": 0.65, "severity": "mild"},
            {"name": "Pneumothorax", "confidence": 0.05, "severity": "normal"},
        ]
    })


@router.get("/analyze/{image_id}/gradcam")
async def get_gradcam(image_id: str, finding: str = "Lung Opacity"):
    """Get Grad-CAM heatmap for a specific finding"""
    # In production, generate or fetch cached Grad-CAM
    
    return JSONResponse({
        "image_id": image_id,
        "finding": finding,
        "gradcam_overlay": None,  # Base64 in production
        "hotspots": [
            {"x": 150, "y": 200, "radius": 50, "intensity": 0.9},
            {"x": 300, "y": 180, "radius": 30, "intensity": 0.7}
        ]
    })
