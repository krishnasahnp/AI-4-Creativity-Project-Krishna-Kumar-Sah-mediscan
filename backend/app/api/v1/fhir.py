"""
FHIR Export API endpoints for MediVision AI.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.utils.fhir_export import export_report_as_fhir, FHIRExporter

router = APIRouter(prefix="/fhir", tags=["FHIR Export"])


class ExportRequest(BaseModel):
    """Request body for FHIR export"""
    patient_id: str
    study_data: Dict[str, Any]
    findings: List[Dict[str, Any]]
    conclusion: str


class SpectrogramRequest(BaseModel):
    """Request for spectrogram generation"""
    audio_path: str
    sample_rate: Optional[int] = 16000
    n_mels: Optional[int] = 128


@router.post("/export")
async def export_to_fhir(request: ExportRequest):
    """
    Export analysis results as FHIR R4 Bundle.
    
    Returns a complete FHIR Bundle containing:
    - Device (AI system)
    - Patient (de-identified)
    - ImagingStudy
    - Observations (findings)
    - DiagnosticReport
    """
    try:
        bundle = export_report_as_fhir(
            patient_id=request.patient_id,
            study_data=request.study_data,
            findings=request.findings,
            conclusion=request.conclusion
        )
        
        return {
            "success": True,
            "fhir_bundle": bundle,
            "resource_count": len(bundle.get("entry", [])),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FHIR export failed: {str(e)}")


@router.get("/validate/{resource_type}")
async def validate_fhir_resource(resource_type: str):
    """
    Get FHIR resource schema for validation.
    """
    valid_types = ["DiagnosticReport", "ImagingStudy", "Observation", "Patient", "Bundle"]
    
    if resource_type not in valid_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid resource type. Valid types: {valid_types}"
        )
    
    return {
        "resource_type": resource_type,
        "fhir_version": "R4",
        "profile_url": f"http://hl7.org/fhir/StructureDefinition/{resource_type}",
        "supported": True
    }


@router.post("/spectrogram")
async def generate_spectrogram(request: SpectrogramRequest):
    """
    Generate spectrogram from audio file.
    """
    try:
        from app.utils.spectrogram import (
            load_audio_file, 
            generate_spectrogram, 
            spectrogram_to_image,
            estimate_audio_quality
        )
        
        # Load audio
        audio_data, sr = load_audio_file(request.audio_path, request.sample_rate)
        
        # Generate spectrogram
        spec, metadata = generate_spectrogram(
            audio_data, 
            sample_rate=sr, 
            n_mels=request.n_mels
        )
        
        # Convert to image
        image_data = spectrogram_to_image(spec)
        
        # Estimate quality
        quality = estimate_audio_quality(audio_data, sr)
        
        return {
            "success": True,
            "spectrogram_image": image_data,
            "metadata": metadata,
            "quality": quality
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Audio file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Spectrogram generation failed: {str(e)}")


@router.post("/validate-upload")
async def validate_upload(file_path: str, file_type: Optional[str] = None):
    """
    Validate an uploaded file.
    """
    try:
        from app.utils.upload_validation import validate_upload as validate
        
        result = validate(file_path, file_type)
        return result.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
