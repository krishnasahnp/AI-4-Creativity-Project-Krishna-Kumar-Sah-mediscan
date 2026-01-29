"""
MediVision AI - Studies API Endpoints

Handles study management and retrieval.

Author: MediVision AI Team
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_user, TokenPayload
from app.db import get_db, Study, Series, Image, Modality

router = APIRouter()


# ============================================================================
# Request/Response Schemas
# ============================================================================

class ImageResponse(BaseModel):
    """Image information response."""
    id: str
    slice_index: int
    file_path: str
    rows: Optional[int]
    columns: Optional[int]
    quality_score: Optional[float]
    is_keyframe: bool


class SeriesResponse(BaseModel):
    """Series information response."""
    id: str
    series_number: int
    series_description: Optional[str]
    num_images: int
    slice_thickness: Optional[float]
    images: List[ImageResponse] = []


class StudyDetailResponse(BaseModel):
    """Detailed study response."""
    id: str
    case_id: str
    modality: str
    body_part: Optional[str]
    study_date: Optional[datetime]
    study_description: Optional[str]
    institution_name: Optional[str]
    manufacturer: Optional[str]
    model_name: Optional[str]
    metadata: dict
    created_at: datetime
    updated_at: datetime
    series: List[SeriesResponse] = []


class StudyUpdateRequest(BaseModel):
    """Request to update study information."""
    body_part: Optional[str] = None
    study_description: Optional[str] = None
    metadata: Optional[dict] = None


# ============================================================================
# Endpoints
# ============================================================================

@router.get(
    "/{study_id}",
    response_model=StudyDetailResponse,
    summary="Get study details",
    description="Get detailed information about a study including all series and images."
)
async def get_study(
    study_id: UUID,
    include_images: bool = True,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> StudyDetailResponse:
    """
    Get a study by ID with its series and images.
    
    - **study_id**: Study UUID
    - **include_images**: Whether to include image details
    """
    query = select(Study).where(Study.id == study_id)
    
    if include_images:
        query = query.options(
            selectinload(Study.series_list).selectinload(Series.images)
        )
    else:
        query = query.options(selectinload(Study.series_list))
    
    result = await db.execute(query)
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    # Build series response
    series_list = []
    for s in study.series_list:
        images = []
        if include_images:
            images = [
                ImageResponse(
                    id=str(img.id),
                    slice_index=img.slice_index,
                    file_path=img.file_path,
                    rows=img.rows,
                    columns=img.columns,
                    quality_score=img.quality_score,
                    is_keyframe=img.is_keyframe,
                )
                for img in sorted(s.images, key=lambda x: x.slice_index)
            ]
        
        series_list.append(SeriesResponse(
            id=str(s.id),
            series_number=s.series_number,
            series_description=s.series_description,
            num_images=s.num_images,
            slice_thickness=s.slice_thickness,
            images=images,
        ))
    
    return StudyDetailResponse(
        id=str(study.id),
        case_id=str(study.case_id),
        modality=study.modality.value,
        body_part=study.body_part,
        study_date=study.study_date,
        study_description=study.study_description,
        institution_name=study.institution_name,
        manufacturer=study.manufacturer,
        model_name=study.model_name,
        metadata=study.metadata or {},
        created_at=study.created_at,
        updated_at=study.updated_at,
        series=series_list,
    )


@router.put(
    "/{study_id}",
    response_model=StudyDetailResponse,
    summary="Update study",
    description="Update study information."
)
async def update_study(
    study_id: UUID,
    request: StudyUpdateRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> StudyDetailResponse:
    """
    Update study information.
    """
    result = await db.execute(
        select(Study)
        .options(selectinload(Study.series_list))
        .where(Study.id == study_id)
    )
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    # Update fields
    if request.body_part is not None:
        study.body_part = request.body_part
    if request.study_description is not None:
        study.study_description = request.study_description
    if request.metadata is not None:
        study.metadata = {**(study.metadata or {}), **request.metadata}
    
    await db.commit()
    await db.refresh(study)
    
    series_list = [
        SeriesResponse(
            id=str(s.id),
            series_number=s.series_number,
            series_description=s.series_description,
            num_images=s.num_images,
            slice_thickness=s.slice_thickness,
            images=[],
        )
        for s in study.series_list
    ]
    
    return StudyDetailResponse(
        id=str(study.id),
        case_id=str(study.case_id),
        modality=study.modality.value,
        body_part=study.body_part,
        study_date=study.study_date,
        study_description=study.study_description,
        institution_name=study.institution_name,
        manufacturer=study.manufacturer,
        model_name=study.model_name,
        metadata=study.metadata or {},
        created_at=study.created_at,
        updated_at=study.updated_at,
        series=series_list,
    )


@router.get(
    "/{study_id}/images/{image_id}",
    summary="Get image file",
    description="Get the raw image file for viewing."
)
async def get_image(
    study_id: UUID,
    image_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get image file for viewing.
    
    Returns the image file path for streaming.
    """
    # Verify image exists and belongs to study
    result = await db.execute(
        select(Image)
        .join(Series)
        .join(Study)
        .where(Image.id == image_id, Study.id == study_id)
    )
    image = result.scalar_one_or_none()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # In production, you would use FileResponse or stream the file
    # For now, return the path
    return {
        "id": str(image.id),
        "file_path": image.file_path,
        "window_center": image.window_center,
        "window_width": image.window_width,
    }


@router.delete(
    "/{study_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete study",
    description="Delete a study and all its data."
)
async def delete_study(
    study_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """
    Delete a study and all associated data.
    """
    result = await db.execute(
        select(Study).where(Study.id == study_id)
    )
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    await db.delete(study)
    await db.commit()
