"""
MediVision AI - Database Module

Database models, session management, and utilities.
"""

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.session import engine, async_session_maker, get_db
from app.db.models import (
    User,
    UserRole,
    Case,
    CaseStatus,
    Study,
    StudyStatus,
    Series,
    Image,
    Annotation,
    AnnotationType,
    Report,
    AudioRecording,
    InferenceJob,
    InferenceStatus,
    AuditLog,
    Modality,
    QualityLevel,
)

__all__ = [
    # Base
    "Base",
    "TimestampMixin",
    "UUIDMixin",
    # Session
    "engine",
    "async_session_maker",
    "get_db",
    # Models
    "User",
    "UserRole",
    "Case",
    "CaseStatus",
    "Study",
    "StudyStatus",
    "Series",
    "Image",
    "Annotation",
    "AnnotationType",
    "Report",
    "AudioRecording",
    "InferenceJob",
    "InferenceStatus",
    "AuditLog",
    "Modality",
    "QualityLevel",
]
