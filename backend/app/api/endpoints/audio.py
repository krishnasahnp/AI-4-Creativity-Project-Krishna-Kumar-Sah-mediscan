"""
MediVision AI - Audio Processing API

Author: MediVision AI Team
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, TokenPayload
from app.db import get_db, AudioRecording, QualityLevel

router = APIRouter()


class TranscriptionResponse(BaseModel):
    recording_id: str
    transcript: str
    language: str
    duration_seconds: float


class AudioQualityResponse(BaseModel):
    recording_id: str
    quality_level: str
    snr_db: float
    has_background_noise: bool


@router.post("/{recording_id}/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    recording_id: UUID,
    language: str = "en",
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TranscriptionResponse:
    result = await db.execute(select(AudioRecording).where(AudioRecording.id == recording_id))
    recording = result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
    
    mock_transcript = "CT scan shows small nodular opacity in right lower lobe."
    recording.transcript = mock_transcript
    recording.is_processed = True
    await db.commit()
    
    return TranscriptionResponse(
        recording_id=str(recording_id),
        transcript=mock_transcript,
        language=language,
        duration_seconds=recording.duration_seconds
    )


@router.get("/{recording_id}/quality", response_model=AudioQualityResponse)
async def get_audio_quality(
    recording_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> AudioQualityResponse:
    result = await db.execute(select(AudioRecording).where(AudioRecording.id == recording_id))
    recording = result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
    
    return AudioQualityResponse(
        recording_id=str(recording_id),
        quality_level="good",
        snr_db=25.5,
        has_background_noise=False
    )
