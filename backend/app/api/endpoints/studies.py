"""
MediVision AI - Studies API Endpoints

Handles study management and retrieval.

Author: MediVision AI Team
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_user, TokenPayload
from app.db import get_db, Study, Series, Image, Modality, StudyStatus

router = APIRouter()


# ============================================================================
# Request/Response Schemas
# ============================================================================

class ImageResponse(BaseModel):
    """Image information response."""
    id: str
    slice_index: Optional[int] = 0
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
    status: str
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


class StudyListContext(BaseModel):
    """Study context for list view."""
    patient_name: Optional[str]
    patient_id: str
    case_priority: int


class StudyListItem(BaseModel):
    """Brief study information for listing."""
    id: str
    description: Optional[str]
    modality: str
    status: str
    study_date: Optional[datetime]
    series_count: int
    image_count: int
    created_at: datetime
    patient: StudyListContext 


class StudyListResponse(BaseModel):
    """Paginated study list response."""
    items: List[StudyListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class StudyUpdateRequest(BaseModel):
    """Request to update study information."""
    body_part: Optional[str] = None
    study_description: Optional[str] = None
    metadata: Optional[dict] = None


class StudyStatusUpdateRequest(BaseModel):
    """Request to update study status."""
    status: StudyStatus


# ============================================================================
# Endpoints
# ============================================================================

from sqlalchemy import func, or_
from app.db import Case

@router.get(
    "",
    response_model=StudyListResponse,
    summary="List studies",
    description="Get a paginated list of studies with optional filtering."
)
async def list_studies(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    modality: Optional[Modality] = Query(None, description="Filter by modality"),
    search: Optional[str] = Query(None, description="Search in patient ID, name, or description"),
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> StudyListResponse:
    """
    List studies with pagination and filters.
    """
    # Build query
    query = select(Study).join(Case).options(selectinload(Study.case), selectinload(Study.series_list))
    count_query = select(func.count(Study.id)).join(Case)
    
    # Apply filters
    if modality:
        query = query.where(Study.modality == modality)
        count_query = count_query.where(Study.modality == modality)
    
    if search:
        search_filter = or_(
            Case.patient_id.ilike(f"%{search}%"),
            Case.patient_name.ilike(f"%{search}%"),
            Study.study_description.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Study.created_at.desc()).offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    studies = result.scalars().all()
    
    # Transform
    items = []
    for study in studies:
        # Calculate totals
        series_count = len(study.series_list)
        image_count = sum(s.num_images for s in study.series_list)
        
        items.append(StudyListItem(
            id=str(study.id),
            description=study.study_description or "Untitled Study",
            modality=study.modality.value,
            study_date=study.study_date or study.created_at or datetime.utcnow(),
            series_count=series_count,
            image_count=image_count,
            created_at=study.created_at,
            status=study.status.value,
            patient=StudyListContext(
                patient_name=study.case.patient_name,
                patient_id=study.case.patient_id,
                case_priority=study.case.priority
            )
        ))

    total_pages = (total + page_size - 1) // page_size

    return StudyListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

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
                for img in sorted(s.images, key=lambda x: x.slice_index or 0)
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
        status=study.status.value,
        body_part=study.body_part,
        study_date=study.study_date or study.created_at or datetime.utcnow(),
        study_description=study.study_description,
        institution_name=study.institution_name,
        manufacturer=study.manufacturer,
        model_name=study.model_name,
        metadata=study.meta_data or {},
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
        study.meta_data = {**(study.meta_data or {}), **request.metadata}
    
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
        study_date=study.study_date or study.created_at or datetime.utcnow(),
        study_description=study.study_description,
        institution_name=study.institution_name,
        manufacturer=study.manufacturer,
        model_name=study.model_name,
        metadata=study.meta_data or {},
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


@router.patch(
    "/{study_id}/status",
    response_model=StudyDetailResponse,
    summary="Update study status",
    description="Update the processing status of a study."
)
async def update_study_status(
    study_id: UUID,
    request: StudyStatusUpdateRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> StudyDetailResponse:
    """
    Update study status.
    
    - **study_id**: Study UUID
    - **status**: New status (pending, analysed, reports_generated)
    """
    # Get study with relations
    result = await db.execute(
        select(Study).where(Study.id == study_id).options(
            selectinload(Study.series_list).selectinload(Series.images)
        )
    )
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    # Update status
    study.status = request.status
    await db.commit()
    await db.refresh(study)
    
    # Build series response
    series_list = []
    for s in study.series_list:
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
            for img in sorted(s.images, key=lambda x: x.slice_index or 0)
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
        status=study.status.value,
        body_part=study.body_part,
        study_date=study.study_date or study.created_at or datetime.utcnow(),
        study_description=study.study_description,
        institution_name=study.institution_name,
        manufacturer=study.manufacturer,
        model_name=study.model_name,
        metadata=study.meta_data or {},
        created_at=study.created_at,
        updated_at=study.updated_at,
        series=series_list,
    )


@router.delete(
    "/{study_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete study",
    description="Delete a study and all associated series and images."
)
async def delete_study(
    study_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a study by ID.
    
    This will cascade delete all series and images.
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
