"""
MediVision AI - Reports API Endpoints

Handles report generation, editing, and export.

Author: MediVision AI Team
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, require_clinician, TokenPayload
from app.db import get_db, Study, Report

router = APIRouter()


# ============================================================================
# Request/Response Schemas
# ============================================================================

class ReportGenerateRequest(BaseModel):
    """Request to generate AI report."""
    study_id: UUID
    include_ai_findings: bool = True
    include_similar_cases: bool = True
    template_type: str = Field(default="standard", description="standard, brief, detailed")


class ReportUpdateRequest(BaseModel):
    """Request to update report content."""
    indication: Optional[str] = None
    technique: Optional[str] = None
    comparison: Optional[str] = None
    findings: Optional[str] = None
    impression: Optional[str] = None
    recommendations: Optional[str] = None
    measurements: Optional[dict] = None


class ReportResponse(BaseModel):
    """Report response."""
    id: str
    study_id: str
    indication: Optional[str]
    technique: Optional[str]
    comparison: Optional[str]
    findings: Optional[str]
    impression: Optional[str]
    recommendations: Optional[str]
    measurements: Optional[dict]
    generated_by: str
    model_version: Optional[str]
    confidence_score: Optional[float]
    is_draft: bool
    is_signed: bool
    signed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class ReportSignRequest(BaseModel):
    """Request to sign a report."""
    disclaimer_accepted: bool = Field(
        ...,
        description="User must accept the disclaimer"
    )


# ============================================================================
# Endpoints
# ============================================================================

@router.get(
    "/{study_id}",
    response_model=ReportResponse,
    summary="Get report for study",
    description="Get the report associated with a study."
)
async def get_report(
    study_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ReportResponse:
    """
    Get the report for a study.
    
    Returns the most recent report if multiple exist.
    """
    result = await db.execute(
        select(Report)
        .where(Report.study_id == study_id)
        .order_by(Report.created_at.desc())
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found for this study"
        )
    
    return ReportResponse(
        id=str(report.id),
        study_id=str(report.study_id),
        indication=report.indication,
        technique=report.technique,
        comparison=report.comparison,
        findings=report.findings,
        impression=report.impression,
        recommendations=report.recommendations,
        measurements=report.measurements,
        generated_by=report.generated_by,
        model_version=report.model_version,
        confidence_score=report.confidence_score,
        is_draft=report.is_draft,
        is_signed=report.is_signed,
        signed_at=report.signed_at,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.post(
    "/generate",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate AI report",
    description="Generate a structured report using AI."
)
async def generate_report(
    request: ReportGenerateRequest,
    current_user: TokenPayload = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
) -> ReportResponse:
    """
    Generate a structured radiology report using AI.
    
    The report is generated based on:
    - AI classification and segmentation results
    - Extracted measurements
    - Similar case references (optional)
    
    The generated report is marked as draft and requires review.
    """
    # Verify study exists
    result = await db.execute(select(Study).where(Study.id == request.study_id))
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    # In production, this would call the LLM service
    # For now, create a placeholder report
    report = Report(
        study_id=request.study_id,
        indication="AI-generated indication based on study metadata.",
        technique=f"{study.modality.value.upper()} imaging performed.",
        findings="AI-generated findings based on model predictions. [REQUIRES CLINICAL REVIEW]",
        impression="AI-generated impression. [REQUIRES CLINICAL VERIFICATION]",
        recommendations="Clinical correlation recommended.",
        generated_by="ai",
        model_version="medivision-llm-v1.0.0",
        confidence_score=0.85,
        is_draft=True,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    
    return ReportResponse(
        id=str(report.id),
        study_id=str(report.study_id),
        indication=report.indication,
        technique=report.technique,
        comparison=report.comparison,
        findings=report.findings,
        impression=report.impression,
        recommendations=report.recommendations,
        measurements=report.measurements,
        generated_by=report.generated_by,
        model_version=report.model_version,
        confidence_score=report.confidence_score,
        is_draft=report.is_draft,
        is_signed=report.is_signed,
        signed_at=report.signed_at,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.put(
    "/{report_id}",
    response_model=ReportResponse,
    summary="Update report",
    description="Update report content."
)
async def update_report(
    report_id: UUID,
    request: ReportUpdateRequest,
    current_user: TokenPayload = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
) -> ReportResponse:
    """
    Update report content.
    
    Once a report is signed, it cannot be modified.
    """
    result = await db.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    if report.is_signed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a signed report"
        )
    
    # Update fields
    if request.indication is not None:
        report.indication = request.indication
    if request.technique is not None:
        report.technique = request.technique
    if request.comparison is not None:
        report.comparison = request.comparison
    if request.findings is not None:
        report.findings = request.findings
    if request.impression is not None:
        report.impression = request.impression
    if request.recommendations is not None:
        report.recommendations = request.recommendations
    if request.measurements is not None:
        report.measurements = request.measurements
    
    # Mark as hybrid if AI-generated and now edited
    if report.generated_by == "ai":
        report.generated_by = "hybrid"
    
    await db.commit()
    await db.refresh(report)
    
    return ReportResponse(
        id=str(report.id),
        study_id=str(report.study_id),
        indication=report.indication,
        technique=report.technique,
        comparison=report.comparison,
        findings=report.findings,
        impression=report.impression,
        recommendations=report.recommendations,
        measurements=report.measurements,
        generated_by=report.generated_by,
        model_version=report.model_version,
        confidence_score=report.confidence_score,
        is_draft=report.is_draft,
        is_signed=report.is_signed,
        signed_at=report.signed_at,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.post(
    "/{report_id}/sign",
    response_model=ReportResponse,
    summary="Sign report",
    description="Sign and finalize a report."
)
async def sign_report(
    report_id: UUID,
    request: ReportSignRequest,
    current_user: TokenPayload = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
) -> ReportResponse:
    """
    Sign a report.
    
    Signing finalizes the report and prevents further modifications.
    User must accept the disclaimer.
    """
    if not request.disclaimer_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must accept the disclaimer to sign the report"
        )
    
    result = await db.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    if report.is_signed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report is already signed"
        )
    
    report.is_signed = True
    report.is_draft = False
    report.signed_by = UUID(current_user.sub)
    report.signed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(report)
    
    return ReportResponse(
        id=str(report.id),
        study_id=str(report.study_id),
        indication=report.indication,
        technique=report.technique,
        comparison=report.comparison,
        findings=report.findings,
        impression=report.impression,
        recommendations=report.recommendations,
        measurements=report.measurements,
        generated_by=report.generated_by,
        model_version=report.model_version,
        confidence_score=report.confidence_score,
        is_draft=report.is_draft,
        is_signed=report.is_signed,
        signed_at=report.signed_at,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.get(
    "/{report_id}/export/pdf",
    summary="Export report as PDF",
    description="Export the report as a PDF document."
)
async def export_report_pdf(
    report_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export report as PDF.
    
    Generates and returns a PDF file of the report.
    """
    result = await db.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # In production, this would generate a PDF using reportlab
    # For now, return report data as JSON
    return {
        "message": "PDF generation would be implemented here",
        "report_id": str(report.id),
        "content": {
            "indication": report.indication,
            "technique": report.technique,
            "findings": report.findings,
            "impression": report.impression,
            "recommendations": report.recommendations,
        }
    }


@router.get(
    "/{report_id}/export/fhir",
    summary="Export report as FHIR JSON",
    description="Export the report in FHIR-compatible JSON format."
)
async def export_report_fhir(
    report_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Export report as FHIR-compatible JSON.
    
    Returns the report formatted according to FHIR DiagnosticReport resource.
    """
    result = await db.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # FHIR DiagnosticReport resource
    fhir_report = {
        "resourceType": "DiagnosticReport",
        "id": str(report.id),
        "status": "final" if report.is_signed else "preliminary",
        "category": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
                        "code": "RAD",
                        "display": "Radiology"
                    }
                ]
            }
        ],
        "code": {
            "text": "Imaging Report"
        },
        "effectiveDateTime": report.created_at.isoformat(),
        "conclusion": report.impression,
        "presentedForm": [
            {
                "contentType": "text/plain",
                "data": report.findings
            }
        ]
    }
    
    return fhir_report
