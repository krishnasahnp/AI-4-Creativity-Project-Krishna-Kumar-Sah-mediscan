"""
Upload API routes for DICOM/image file upload
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
import aiofiles
from datetime import datetime

from app.services.dicom_parser import DicomParser
from app.services.modality_detector import ModalityDetector

router = APIRouter()

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a DICOM or image file for analysis
    
    Returns:
        - image_id: Unique identifier for the uploaded image
        - metadata: Extracted DICOM metadata
        - modality: Detected modality (CT, MRI, XR, US)
    """
    
    # Validate file type
    allowed_extensions = [".dcm", ".dicom", ".png", ".jpg", ".jpeg"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {allowed_extensions}"
        )
    
    # Generate unique ID
    image_id = str(uuid.uuid4())
    
    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{image_id}{file_ext}")
    
    try:
        async with aiofiles.open(file_path, "wb") as f:
            content = await file.read()
            await f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Parse DICOM if applicable
    metadata = {}
    modality = "Unknown"
    
    if file_ext in [".dcm", ".dicom"]:
        parser = DicomParser()
        try:
            metadata = parser.parse(file_path)
            modality = metadata.get("Modality", "Unknown")
        except Exception as e:
            # If DICOM parsing fails, continue with image-based detection
            pass
    
    # Auto-detect modality if not from DICOM
    if modality == "Unknown":
        detector = ModalityDetector()
        modality, confidence = detector.detect(file_path)
        metadata["modality_confidence"] = confidence
    
    return JSONResponse({
        "success": True,
        "image_id": image_id,
        "filename": file.filename,
        "file_path": file_path,
        "modality": modality,
        "metadata": metadata,
        "uploaded_at": datetime.now().isoformat()
    })


@router.get("/uploads/{image_id}")
async def get_upload_info(image_id: str):
    """Get information about an uploaded image"""
    
    # Find file with this ID
    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(image_id):
            file_path = os.path.join(UPLOAD_DIR, filename)
            return JSONResponse({
                "image_id": image_id,
                "file_path": file_path,
                "exists": True
            })
    
    raise HTTPException(status_code=404, detail="Image not found")
