"""
MediVision AI - Cases API Endpoints

Handles case (patient study container) management.

Author: MediVision AI Team
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_user, require_clinician, TokenPayload
from app.db import get_db, Case, CaseStatus, Study, Modality

router = APIRouter()


# ============================================================================
# Request/Response Schemas
# ============================================================================

class CaseCreateRequest(BaseModel):
    """Request to create a new case."""
    patient_id: str = Field(..., min_length=1, max_length=64, description="Anonymized patient ID")
    patient_name: str = Field(..., min_length=1, max_length=256, description="Patient Name")
    tags: Optional[List[str]] = Field(default_factory=list)
    notes: Optional[str] = None
    priority: int = Field(default=0, ge=0, le=10)


class CaseUpdateRequest(BaseModel):
    """Request to update a case."""
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    priority: Optional[int] = Field(default=None, ge=0, le=10)
    status: Optional[CaseStatus] = None


class StudySummary(BaseModel):
    """Brief study information for case listing."""
    id: str
    modality: str
    body_part: Optional[str]
    study_date: Optional[datetime]
    created_at: datetime
    status: str




class CaseResponse(BaseModel):
    """Case response with studies."""
    id: str
    patient_id: str
    patient_name: Optional[str]
    status: str
    tags: List[str]
    notes: Optional[str]
    priority: int
    created_at: datetime
    updated_at: datetime
    studies: List[StudySummary] = []

    class Config:
        from_attributes = True


class CaseListResponse(BaseModel):
    """Paginated case list response."""
    items: List[CaseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CaseStats(BaseModel):
    """Case statistics."""
    total_cases: int
    pending: int
    processing: int
    completed: int
    failed: int
    by_modality: dict


# ============================================================================
# Endpoints
# ============================================================================

@router.get(
    "",
    response_model=CaseListResponse,
    summary="List cases",
    description="Get a paginated list of cases with optional filtering."
)
async def list_cases(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[CaseStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in patient ID or notes"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CaseListResponse:
    """
    List cases with pagination and optional filters.
    
    - **page**: Page number (1-indexed)
    - **page_size**: Number of items per page
    - **status**: Filter by case status
    - **search**: Search in patient ID or notes
    - **tag**: Filter by tag
    """
    # Build query
    query = select(Case).options(selectinload(Case.studies))
    count_query = select(func.count(Case.id))
    
    # Apply filters
    if status:
        query = query.where(Case.status == status)
        count_query = count_query.where(Case.status == status)
    
    if search:
        search_filter = or_(
            Case.patient_id.ilike(f"%{search}%"),
            Case.patient_name.ilike(f"%{search}%"),
            Case.notes.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    if tag:
        query = query.where(Case.tags.contains([tag]))
        count_query = count_query.where(Case.tags.contains([tag]))
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Case.created_at.desc()).offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    cases = result.scalars().all()
    
    # Transform to response
    items = []
    for case in cases:
        studies = [
            StudySummary(
                id=str(s.id),
                modality=s.modality.value,
                body_part=s.body_part,
                study_date=s.study_date,
                created_at=s.created_at,
                status=s.status.value,
            )
            for s in case.studies
        ]
        items.append(CaseResponse(
            id=str(case.id),
            patient_id=case.patient_id,
            patient_name=case.patient_name,
            status=case.status.value,
            tags=case.tags or [],
            notes=case.notes,
            priority=case.priority,
            created_at=case.created_at,
            updated_at=case.updated_at,
            studies=studies,
        ))
    
    total_pages = (total + page_size - 1) // page_size
    
    return CaseListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post(
    "",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new case",
    description="Create a new case for a patient."
)
async def create_case(
    request: CaseCreateRequest,
    current_user: TokenPayload = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
) -> CaseResponse:
    """
    Create a new case.
    
    Requires clinician or admin role.
    """
    case = Case(
        patient_id=request.patient_id,
        patient_name=request.patient_name,
        tags=request.tags or [],
        notes=request.notes,
        priority=request.priority,
        created_by=UUID(current_user.sub),
    )
    db.add(case)
    await db.commit()
    await db.refresh(case)
    
    return CaseResponse(
        id=str(case.id),
        patient_id=case.patient_id,
        patient_name=case.patient_name,
        status=case.status.value,
        tags=case.tags or [],
        notes=case.notes,
        priority=case.priority,
        created_at=case.created_at,
        updated_at=case.updated_at,
        studies=[],
    )


@router.get(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Get case details",
    description="Get detailed information about a specific case."
)
async def get_case(
    case_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CaseResponse:
    """
    Get a case by ID with its studies.
    """
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.studies))
        .where(Case.id == case_id)
    )
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    studies = [
        StudySummary(
            id=str(s.id),
            modality=s.modality.value,
            body_part=s.body_part,
            study_date=s.study_date,
            created_at=s.created_at,
            status=s.status.value,
        )
        for s in case.studies
    ]
    
    return CaseResponse(
        id=str(case.id),
        patient_id=case.patient_id,
        patient_name=case.patient_name,
        status=case.status.value,
        tags=case.tags or [],
        notes=case.notes,
        priority=case.priority,
        created_at=case.created_at,
        updated_at=case.updated_at,
        studies=studies,
    )


@router.put(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Update a case",
    description="Update case information."
)
async def update_case(
    case_id: UUID,
    request: CaseUpdateRequest,
    current_user: TokenPayload = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
) -> CaseResponse:
    """
    Update a case.
    
    Requires clinician or admin role.
    """
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.studies))
        .where(Case.id == case_id)
    )
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Update fields if provided
    if request.tags is not None:
        case.tags = request.tags
    if request.notes is not None:
        case.notes = request.notes
    if request.priority is not None:
        case.priority = request.priority
    if request.status is not None:
        case.status = request.status
    
    await db.commit()
    await db.refresh(case)
    
    studies = [
        StudySummary(
            id=str(s.id),
            modality=s.modality.value,
            body_part=s.body_part,
            study_date=s.study_date,
            created_at=s.created_at,
            status=s.status.value,
        )
        for s in case.studies
    ]
    
    return CaseResponse(
        id=str(case.id),
        patient_id=case.patient_id,
        patient_name=case.patient_name,
        status=case.status.value,
        tags=case.tags or [],
        notes=case.notes,
        priority=case.priority,
        created_at=case.created_at,
        updated_at=case.updated_at,
        studies=studies,
    )


@router.delete(
    "/{case_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a case",
    description="Delete a case and all its studies."
)
async def delete_case(
    case_id: UUID,
    current_user: TokenPayload = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
) -> None:
    """
    Delete a case.
    
    This will cascade delete all associated studies, images, and annotations.
    Requires clinician or admin role.
    """
    result = await db.execute(
        select(Case).where(Case.id == case_id)
    )
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    await db.delete(case)
    await db.commit()


@router.get(
    "/stats/overview",
    response_model=CaseStats,
    summary="Get case statistics",
    description="Get statistics about cases."
)
async def get_case_stats(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CaseStats:
    """
    Get overview statistics for cases.
    """
    # Count by status
    status_counts = {}
    for s in CaseStatus:
        result = await db.execute(
            select(func.count(Case.id)).where(Case.status == s)
        )
        status_counts[s.value] = result.scalar()
    
    # Count by modality (through studies)
    modality_counts = {}
    for m in Modality:
        result = await db.execute(
            select(func.count(Study.id)).where(Study.modality == m)
        )
        modality_counts[m.value] = result.scalar()
    
    # Total cases
    result = await db.execute(select(func.count(Case.id)))
    total = result.scalar()
    
    return CaseStats(
        total_cases=total,
        pending=status_counts.get("pending", 0),
        processing=status_counts.get("processing", 0),
        completed=status_counts.get("completed", 0),
        failed=status_counts.get("failed", 0),
        by_modality=modality_counts,
    )
