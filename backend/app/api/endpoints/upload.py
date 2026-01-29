"""
MediVision AI - Upload API Endpoints

Handles file uploads for CT, Ultrasound, and Audio files.

Author: MediVision AI Team
"""

import hashlib
import os
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_current_user, require_clinician, TokenPayload
from app.db import get_db, Case, Study, Series, Image, AudioRecording, Modality

router = APIRouter()


# ============================================================================
# Request/Response Schemas
# ============================================================================

class UploadStatusResponse(BaseModel):
    """Upload status response."""
    upload_id: str
    status: str  # pending, processing, completed, failed
    progress: float  # 0-100
    message: Optional[str] = None
    study_id: Optional[str] = None


class UploadCompleteResponse(BaseModel):
    """Upload completion response."""
    study_id: str
    case_id: str
    modality: str
    num_images: int
    message: str


class AudioUploadResponse(BaseModel):
    """Audio upload response."""
    recording_id: str
    study_id: str
    duration_seconds: float
    message: str


# ============================================================================
# Helper Functions
# ============================================================================

def get_file_hash(file_path: str) -> str:
    """Calculate SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def validate_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
    """Check if file has an allowed extension."""
    ext = Path(filename).suffix.lower()
    return ext in allowed_extensions


async def save_upload_file(upload_file: UploadFile, destination: Path) -> str:
    """Save an upload file to disk."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    
    with open(destination, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    
    return str(destination)


# ============================================================================
# Endpoints
# ============================================================================

@router.post(
    "/ct",
    response_model=UploadCompleteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload CT DICOM series",
    description="Upload CT DICOM files for a case."
)
async def upload_ct(
    case_id: UUID = Form(..., description="Case ID to upload to"),
    files: List[UploadFile] = File(..., description="DICOM files"),
    body_part: Optional[str] = Form(None, description="Body part (e.g., chest, head)"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: TokenPayload = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
) -> UploadCompleteResponse:
    """
    Upload CT DICOM files.
    
    Accepts multiple DICOM files and creates a study with series and images.
    """
    # Verify case exists
    from sqlalchemy import select
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Validate files
    for f in files:
        if not validate_file_extension(f.filename, settings.ALLOWED_CT_EXTENSIONS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {f.filename}. Allowed: {settings.ALLOWED_CT_EXTENSIONS}"
            )
    
    # Create study
    study = Study(
        case_id=case_id,
        modality=Modality.CT,
        body_part=body_part,
        study_date=datetime.utcnow(),
    )
    db.add(study)
    await db.flush()
    
    # Create series
    series = Series(
        study_id=study.id,
        series_number=1,
        series_description="CT Series",
        num_images=len(files),
    )
    db.add(series)
    await db.flush()
    
    # Create upload directory
    upload_dir = Path(settings.UPLOAD_DIR) / str(case_id) / str(study.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save files and create image records
    for idx, file in enumerate(files):
        file_path = upload_dir / f"{idx:04d}_{file.filename}"
        await save_upload_file(file, file_path)
        
        image = Image(
            series_id=series.id,
            file_path=str(file_path),
            slice_index=idx,
        )
        db.add(image)
    
    await db.commit()
    
    return UploadCompleteResponse(
        study_id=str(study.id),
        case_id=str(case_id),
        modality="ct",
        num_images=len(files),
        message=f"Successfully uploaded {len(files)} CT images"
    )


@router.post(
    "/ultrasound",
    response_model=UploadCompleteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload ultrasound images/video",
    description="Upload ultrasound images or video for a case."
)
async def upload_ultrasound(
    case_id: UUID = Form(..., description="Case ID to upload to"),
    files: List[UploadFile] = File(..., description="Ultrasound files"),
    body_part: Optional[str] = Form(None, description="Body part (e.g., thyroid, liver)"),
    is_video: bool = Form(False, description="Whether files are videos"),
    current_user: TokenPayload = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
) -> UploadCompleteResponse:
    """
    Upload ultrasound images or video.
    
    For video files, frames will be extracted automatically.
    """
    # Verify case exists
    from sqlalchemy import select
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Determine allowed extensions
    allowed = settings.ALLOWED_US_VIDEO_EXTENSIONS if is_video else settings.ALLOWED_US_IMAGE_EXTENSIONS
    
    # Validate files
    for f in files:
        if not validate_file_extension(f.filename, allowed):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {f.filename}. Allowed: {allowed}"
            )
    
    # Create study
    study = Study(
        case_id=case_id,
        modality=Modality.ULTRASOUND,
        body_part=body_part,
        study_date=datetime.utcnow(),
    )
    db.add(study)
    await db.flush()
    
    # Create series
    series = Series(
        study_id=study.id,
        series_number=1,
        series_description="Ultrasound Series",
        num_images=len(files),
    )
    db.add(series)
    await db.flush()
    
    # Create upload directory
    upload_dir = Path(settings.UPLOAD_DIR) / str(case_id) / str(study.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save files
    for idx, file in enumerate(files):
        file_path = upload_dir / f"{idx:04d}_{file.filename}"
        await save_upload_file(file, file_path)
        
        image = Image(
            series_id=series.id,
            file_path=str(file_path),
            slice_index=idx,
            is_keyframe=True if is_video else False,
        )
        db.add(image)
    
    await db.commit()
    
    return UploadCompleteResponse(
        study_id=str(study.id),
        case_id=str(case_id),
        modality="ultrasound",
        num_images=len(files),
        message=f"Successfully uploaded {len(files)} ultrasound {'videos' if is_video else 'images'}"
    )


@router.post(
    "/audio",
    response_model=AudioUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload audio recording",
    description="Upload audio recording for transcription."
)
async def upload_audio(
    study_id: UUID = Form(..., description="Study ID to attach audio to"),
    file: UploadFile = File(..., description="Audio file"),
    current_user: TokenPayload = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
) -> AudioUploadResponse:
    """
    Upload audio recording for a study.
    
    The audio will be transcribed automatically.
    """
    # Verify study exists
    from sqlalchemy import select
    result = await db.execute(select(Study).where(Study.id == study_id))
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    # Validate file
    if not validate_file_extension(file.filename, settings.ALLOWED_AUDIO_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {settings.ALLOWED_AUDIO_EXTENSIONS}"
        )
    
    # Create upload directory
    upload_dir = Path(settings.UPLOAD_DIR) / "audio" / str(study_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = upload_dir / f"{uuid4()}_{file.filename}"
    await save_upload_file(file, file_path)
    
    # Create audio recording record
    # Note: Duration would be calculated from the actual audio file
    recording = AudioRecording(
        study_id=study_id,
        file_path=str(file_path),
        duration_seconds=0.0,  # Will be updated after processing
        format=Path(file.filename).suffix.lstrip("."),
    )
    db.add(recording)
    await db.commit()
    await db.refresh(recording)
    
    return AudioUploadResponse(
        recording_id=str(recording.id),
        study_id=str(study_id),
        duration_seconds=recording.duration_seconds,
        message="Audio uploaded successfully. Transcription will begin shortly."
    )


@router.get(
    "/status/{upload_id}",
    response_model=UploadStatusResponse,
    summary="Get upload status",
    description="Check the status of an ongoing upload."
)
async def get_upload_status(
    upload_id: str,
    current_user: TokenPayload = Depends(get_current_user)
) -> UploadStatusResponse:
    """
    Get the status of an upload operation.
    
    Used for tracking progress of large uploads.
    """
    # In a production system, this would check a task queue (Celery/Redis)
    # For now, return a mock response
    return UploadStatusResponse(
        upload_id=upload_id,
        status="completed",
        progress=100.0,
        message="Upload completed successfully",
    )
