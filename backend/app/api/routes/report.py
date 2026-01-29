"""
Report API routes for generating analysis reports
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, List
import os

from app.services.report_generator import ReportGenerator

router = APIRouter()


class ReportRequest(BaseModel):
    image_id: str
    include_gradcam: bool = True
    include_segmentation: bool = True
    format: str = "png"  # "png" or "pdf"


@router.post("/report/generate")
async def generate_report(request: ReportRequest):
    """
    Generate a visual report card image containing:
    - Original scan thumbnail
    - Findings list with confidence bars
    - Segmentation overlay
    - Grad-CAM heatmap
    - Timestamp and metadata
    """
    
    generator = ReportGenerator()
    
    try:
        report_path = await generator.generate(
            image_id=request.image_id,
            include_gradcam=request.include_gradcam,
            include_segmentation=request.include_segmentation,
            output_format=request.format
        )
        
        return JSONResponse({
            "success": True,
            "image_id": request.image_id,
            "report_path": report_path,
            "format": request.format
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/report/{image_id}")
async def get_report(image_id: str):
    """Get the generated report for an image"""
    
    reports_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "reports")
    
    # Look for report file
    for ext in [".png", ".pdf"]:
        report_path = os.path.join(reports_dir, f"{image_id}_report{ext}")
        if os.path.exists(report_path):
            return JSONResponse({
                "image_id": image_id,
                "report_exists": True,
                "report_path": report_path,
                "format": ext[1:]
            })
    
    raise HTTPException(status_code=404, detail="Report not found")


@router.get("/report/{image_id}/download")
async def download_report(image_id: str):
    """Download the report image file"""
    
    reports_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "reports")
    
    for ext in [".png", ".pdf"]:
        report_path = os.path.join(reports_dir, f"{image_id}_report{ext}")
        if os.path.exists(report_path):
            return FileResponse(
                report_path,
                media_type=f"{'image/png' if ext == '.png' else 'application/pdf'}",
                filename=f"mediscan_report_{image_id}{ext}"
            )
    
    raise HTTPException(status_code=404, detail="Report not found")
