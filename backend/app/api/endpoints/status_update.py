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
    # Get study
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
    
    # Build response
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
        status=study.status.value,
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
