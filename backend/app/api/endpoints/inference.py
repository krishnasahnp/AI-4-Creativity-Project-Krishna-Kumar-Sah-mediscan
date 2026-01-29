"""
MediVision AI - Inference API Endpoints

Handles AI inference job management.

Author: MediVision AI Team
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, TokenPayload
from app.db import get_db, Study, InferenceJob, InferenceStatus

router = APIRouter()


# ============================================================================
# Request/Response Schemas
# ============================================================================

class InferenceStartRequest(BaseModel):
    """Request to start an inference job."""
    study_id: UUID
    job_type: str = Field(
        ...,
        description="Job type: classification, segmentation, report_generation, full_analysis"
    )
    priority: int = Field(default=0, ge=0, le=10)
    options: Optional[dict] = Field(default_factory=dict)


class InferenceJobResponse(BaseModel):
    """Inference job response."""
    id: str
    study_id: str
    job_type: str
    status: str
    priority: int
    model_name: str
    model_version: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    processing_time_ms: Optional[int]
    predictions: Optional[dict]
    confidence_scores: Optional[dict]
    error_message: Optional[str]
    created_at: datetime


class InferenceResultResponse(BaseModel):
    """Detailed inference results."""
    job_id: str
    study_id: str
    status: str
    
    # Classification results
    classification: Optional[dict] = None
    
    # Segmentation results
    segmentation: Optional[dict] = None
    
    # Measurements
    measurements: Optional[dict] = None
    
    # Explanations
    attention_map_path: Optional[str] = None
    grad_cam_path: Optional[str] = None
    
    # Confidence and calibration
    confidence: float
    calibration_info: Optional[dict] = None
    
    # Similar cases (from retrieval)
    similar_cases: Optional[List[dict]] = None


class BatchInferenceRequest(BaseModel):
    """Request to start batch inference."""
    study_ids: List[UUID]
    job_type: str
    priority: int = Field(default=0, ge=0, le=10)


class BatchInferenceResponse(BaseModel):
    """Batch inference response."""
    job_ids: List[str]
    message: str


# ============================================================================
# Endpoints
# ============================================================================

@router.post(
    "/start",
    response_model=InferenceJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start inference job",
    description="Start an AI inference job for a study."
)
async def start_inference(
    request: InferenceStartRequest,
    background_tasks: BackgroundTasks,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> InferenceJobResponse:
    """
    Start an AI inference job.
    
    Job types:
    - **classification**: Classify the study (normal/abnormal)
    - **segmentation**: Generate segmentation masks
    - **report_generation**: Generate AI report
    - **full_analysis**: Run all analyses
    """
    # Verify study exists
    result = await db.execute(select(Study).where(Study.id == request.study_id))
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    # Determine model based on job type and modality
    model_name = "medivision_swin_ct" if study.modality.value == "ct" else "medivision_vit_us"
    model_version = "1.0.0"
    
    # Create inference job
    job = InferenceJob(
        study_id=request.study_id,
        job_type=request.job_type,
        priority=request.priority,
        model_name=model_name,
        model_version=model_version,
        status=InferenceStatus.QUEUED,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    # In production, this would queue the job to Celery
    # background_tasks.add_task(run_inference, job.id)
    
    return InferenceJobResponse(
        id=str(job.id),
        study_id=str(job.study_id),
        job_type=job.job_type,
        status=job.status.value,
        priority=job.priority,
        model_name=job.model_name,
        model_version=job.model_version,
        started_at=job.started_at,
        completed_at=job.completed_at,
        processing_time_ms=job.processing_time_ms,
        predictions=job.predictions,
        confidence_scores=job.confidence_scores,
        error_message=job.error_message,
        created_at=job.created_at,
    )


@router.get(
    "/{job_id}/status",
    response_model=InferenceJobResponse,
    summary="Get job status",
    description="Get the status of an inference job."
)
async def get_job_status(
    job_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> InferenceJobResponse:
    """
    Get the current status of an inference job.
    """
    result = await db.execute(
        select(InferenceJob).where(InferenceJob.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return InferenceJobResponse(
        id=str(job.id),
        study_id=str(job.study_id),
        job_type=job.job_type,
        status=job.status.value,
        priority=job.priority,
        model_name=job.model_name,
        model_version=job.model_version,
        started_at=job.started_at,
        completed_at=job.completed_at,
        processing_time_ms=job.processing_time_ms,
        predictions=job.predictions,
        confidence_scores=job.confidence_scores,
        error_message=job.error_message,
        created_at=job.created_at,
    )


@router.get(
    "/{job_id}/result",
    response_model=InferenceResultResponse,
    summary="Get inference results",
    description="Get detailed results from a completed inference job."
)
async def get_inference_results(
    job_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> InferenceResultResponse:
    """
    Get detailed results from a completed inference job.
    
    Returns classification, segmentation, measurements, and explanations.
    """
    result = await db.execute(
        select(InferenceJob).where(InferenceJob.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.status != InferenceStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job is not complete. Current status: {job.status.value}"
        )
    
    # Extract results from predictions
    predictions = job.predictions or {}
    confidence_scores = job.confidence_scores or {}
    
    return InferenceResultResponse(
        job_id=str(job.id),
        study_id=str(job.study_id),
        status=job.status.value,
        classification=predictions.get("classification"),
        segmentation=predictions.get("segmentation"),
        measurements=predictions.get("measurements"),
        attention_map_path=predictions.get("attention_map_path"),
        grad_cam_path=predictions.get("grad_cam_path"),
        confidence=confidence_scores.get("overall", 0.0),
        calibration_info=predictions.get("calibration"),
        similar_cases=predictions.get("similar_cases"),
    )


@router.post(
    "/batch",
    response_model=BatchInferenceResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start batch inference",
    description="Start inference jobs for multiple studies."
)
async def start_batch_inference(
    request: BatchInferenceRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BatchInferenceResponse:
    """
    Start inference jobs for multiple studies at once.
    """
    job_ids = []
    
    for study_id in request.study_ids:
        # Verify study exists
        result = await db.execute(select(Study).where(Study.id == study_id))
        study = result.scalar_one_or_none()
        
        if study:
            model_name = "medivision_swin_ct" if study.modality.value == "ct" else "medivision_vit_us"
            
            job = InferenceJob(
                study_id=study_id,
                job_type=request.job_type,
                priority=request.priority,
                model_name=model_name,
                model_version="1.0.0",
                status=InferenceStatus.QUEUED,
            )
            db.add(job)
            await db.flush()
            job_ids.append(str(job.id))
    
    await db.commit()
    
    return BatchInferenceResponse(
        job_ids=job_ids,
        message=f"Started {len(job_ids)} inference jobs"
    )


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel inference job",
    description="Cancel a pending or running inference job."
)
async def cancel_inference(
    job_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """
    Cancel an inference job.
    
    Only pending or running jobs can be cancelled.
    """
    result = await db.execute(
        select(InferenceJob).where(InferenceJob.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.status in [InferenceStatus.COMPLETED, InferenceStatus.FAILED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed or failed job"
        )
    
    await db.delete(job)
    await db.commit()
