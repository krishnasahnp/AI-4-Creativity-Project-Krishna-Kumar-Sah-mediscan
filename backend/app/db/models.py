"""
MediVision AI - Database Models

SQLAlchemy ORM models for the MediVision AI platform.
Includes models for users, cases, studies, images, annotations, reports, and audio.

Author: MediVision AI Team
"""

import enum
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, func, Index
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


# ============================================================================
# Enums
# ============================================================================

class UserRole(str, enum.Enum):
    """User role enumeration."""
    ADMIN = "admin"
    CLINICIAN = "clinician"
    STUDENT = "student"


class Modality(str, enum.Enum):
    """Medical imaging modality."""
    CT = "ct"
    ULTRASOUND = "ultrasound"
    XRAY = "xray"
    MRI = "mri"


class CaseStatus(str, enum.Enum):
    """Case processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class InferenceStatus(str, enum.Enum):
    """Inference job status."""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AnnotationType(str, enum.Enum):
    """Type of annotation."""
    CLASSIFICATION = "classification"
    SEGMENTATION = "segmentation"
    MEASUREMENT = "measurement"
    LANDMARK = "landmark"


class QualityLevel(str, enum.Enum):
    """Image/audio quality level."""
    GOOD = "good"
    MEDIUM = "medium"
    POOR = "poor"


# ============================================================================
# User Model
# ============================================================================

class User(Base, UUIDMixin, TimestampMixin):
    """
    User account model.
    
    Stores authentication and profile information for platform users.
    """
    
    email: Mapped[str] = mapped_column(
        String(256), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    full_name: Mapped[str] = mapped_column(String(256), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.STUDENT, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    cases: Mapped[List["Case"]] = relationship(
        "Case", back_populates="created_by_user", lazy="selectin"
    )
    
    # Indexes
    __table_args__ = (
        Index("ix_user_email_active", "email", "is_active"),
    )


# ============================================================================
# Case Model (Patient Study Container)
# ============================================================================

class Case(Base, UUIDMixin, TimestampMixin):
    """
    Medical case container.
    
    Represents a patient case containing one or more imaging studies.
    Patient data is anonymized using pseudonymous identifiers.
    """
    
    patient_id: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True,
        comment="Anonymized patient identifier"
    )
    status: Mapped[CaseStatus] = mapped_column(
        Enum(CaseStatus), default=CaseStatus.PENDING, nullable=False
    )
    tags: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), default=list)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    
    # Foreign keys
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False
    )
    
    # Relationships
    created_by_user: Mapped["User"] = relationship("User", back_populates="cases")
    studies: Mapped[List["Study"]] = relationship(
        "Study", back_populates="case", lazy="selectin", cascade="all, delete-orphan"
    )
    
    # Indexes
    __table_args__ = (
        Index("ix_case_patient_status", "patient_id", "status"),
        Index("ix_case_created_at", "created_at"),
    )


# ============================================================================
# Study Model
# ============================================================================

class Study(Base, UUIDMixin, TimestampMixin):
    """
    Imaging study model.
    
    Represents a single imaging session (e.g., one CT scan session).
    """
    
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("case.id", ondelete="CASCADE"), nullable=False
    )
    modality: Mapped[Modality] = mapped_column(Enum(Modality), nullable=False)
    body_part: Mapped[Optional[str]] = mapped_column(String(64))
    study_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    study_description: Mapped[Optional[str]] = mapped_column(String(256))
    
    # DICOM metadata
    study_instance_uid: Mapped[Optional[str]] = mapped_column(String(128), unique=True)
    accession_number: Mapped[Optional[str]] = mapped_column(String(64))
    
    # Device/scanner info
    institution_name: Mapped[Optional[str]] = mapped_column(String(128))
    manufacturer: Mapped[Optional[str]] = mapped_column(String(128))
    model_name: Mapped[Optional[str]] = mapped_column(String(128))
    
    # Additional metadata as JSON
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    
    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="studies")
    series_list: Mapped[List["Series"]] = relationship(
        "Series", back_populates="study", lazy="selectin", cascade="all, delete-orphan"
    )
    reports: Mapped[List["Report"]] = relationship(
        "Report", back_populates="study", lazy="selectin", cascade="all, delete-orphan"
    )
    audio_recordings: Mapped[List["AudioRecording"]] = relationship(
        "AudioRecording", back_populates="study", lazy="selectin", cascade="all, delete-orphan"
    )
    inference_jobs: Mapped[List["InferenceJob"]] = relationship(
        "InferenceJob", back_populates="study", lazy="selectin", cascade="all, delete-orphan"
    )


# ============================================================================
# Series Model
# ============================================================================

class Series(Base, UUIDMixin, TimestampMixin):
    """
    Image series model.
    
    A study contains one or more series (e.g., axial, coronal, sagittal).
    """
    
    study_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study.id", ondelete="CASCADE"), nullable=False
    )
    series_number: Mapped[int] = mapped_column(Integer, default=1)
    series_description: Mapped[Optional[str]] = mapped_column(String(256))
    series_instance_uid: Mapped[Optional[str]] = mapped_column(String(128), unique=True)
    
    # Series properties
    num_images: Mapped[int] = mapped_column(Integer, default=0)
    slice_thickness: Mapped[Optional[float]] = mapped_column(Float)
    pixel_spacing: Mapped[Optional[List[float]]] = mapped_column(ARRAY(Float))
    
    # Relationships
    study: Mapped["Study"] = relationship("Study", back_populates="series_list")
    images: Mapped[List["Image"]] = relationship(
        "Image", back_populates="series", lazy="selectin", cascade="all, delete-orphan"
    )


# ============================================================================
# Image Model
# ============================================================================

class Image(Base, UUIDMixin, TimestampMixin):
    """
    Individual image/frame model.
    
    Represents a single DICOM slice, ultrasound frame, or image file.
    """
    
    series_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("series.id", ondelete="CASCADE"), nullable=False
    )
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    slice_index: Mapped[int] = mapped_column(Integer, default=0)
    
    # Image properties
    rows: Mapped[Optional[int]] = mapped_column(Integer)
    columns: Mapped[Optional[int]] = mapped_column(Integer)
    bits_allocated: Mapped[Optional[int]] = mapped_column(Integer)
    
    # Position and orientation
    image_position: Mapped[Optional[List[float]]] = mapped_column(ARRAY(Float))
    image_orientation: Mapped[Optional[List[float]]] = mapped_column(ARRAY(Float))
    slice_location: Mapped[Optional[float]] = mapped_column(Float)
    
    # Windowing defaults
    window_center: Mapped[Optional[float]] = mapped_column(Float)
    window_width: Mapped[Optional[float]] = mapped_column(Float)
    
    # Quality metrics
    quality_score: Mapped[Optional[float]] = mapped_column(Float)
    blur_score: Mapped[Optional[float]] = mapped_column(Float)
    contrast_score: Mapped[Optional[float]] = mapped_column(Float)
    
    # Additional metadata
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    
    # For ultrasound videos - is this a keyframe?
    is_keyframe: Mapped[bool] = mapped_column(Boolean, default=False)
    frame_time_ms: Mapped[Optional[float]] = mapped_column(Float)
    
    # Relationships
    series: Mapped["Series"] = relationship("Series", back_populates="images")
    annotations: Mapped[List["Annotation"]] = relationship(
        "Annotation", back_populates="image", lazy="selectin", cascade="all, delete-orphan"
    )
    
    # Indexes
    __table_args__ = (
        Index("ix_image_series_slice", "series_id", "slice_index"),
    )


# ============================================================================
# Annotation Model
# ============================================================================

class Annotation(Base, UUIDMixin, TimestampMixin):
    """
    Image annotation model.
    
    Stores classifications, segmentation masks, measurements, and landmarks.
    """
    
    image_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("image.id", ondelete="CASCADE"), nullable=False
    )
    annotation_type: Mapped[AnnotationType] = mapped_column(
        Enum(AnnotationType), nullable=False
    )
    
    # Label/value (format depends on type)
    # Classification: {"class": "abnormal", "confidence": 0.95}
    # Measurement: {"diameter_mm": 15.2, "area_mm2": 182.3}
    label_value: Mapped[dict] = mapped_column(JSONB, nullable=False)
    
    # For segmentation: path to mask file
    mask_path: Mapped[Optional[str]] = mapped_column(String(512))
    
    # Source of annotation
    source: Mapped[str] = mapped_column(
        String(32), default="ai",
        comment="ai, human, or hybrid"
    )
    annotator_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id")
    )
    
    # Confidence and calibration
    confidence: Mapped[Optional[float]] = mapped_column(Float)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Model info if AI-generated
    model_version: Mapped[Optional[str]] = mapped_column(String(64))
    
    # Relationships
    image: Mapped["Image"] = relationship("Image", back_populates="annotations")


# ============================================================================
# Report Model
# ============================================================================

class Report(Base, UUIDMixin, TimestampMixin):
    """
    Radiology report model.
    
    Stores structured reports generated by AI or created by clinicians.
    """
    
    study_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study.id", ondelete="CASCADE"), nullable=False
    )
    
    # Structured report sections
    indication: Mapped[Optional[str]] = mapped_column(Text)
    technique: Mapped[Optional[str]] = mapped_column(Text)
    comparison: Mapped[Optional[str]] = mapped_column(Text)
    findings: Mapped[Optional[str]] = mapped_column(Text)
    impression: Mapped[Optional[str]] = mapped_column(Text)
    recommendations: Mapped[Optional[str]] = mapped_column(Text)
    
    # Structured data
    measurements: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    
    # Generation metadata
    generated_by: Mapped[str] = mapped_column(
        String(32), default="human",
        comment="human, ai, or hybrid"
    )
    model_version: Mapped[Optional[str]] = mapped_column(String(64))
    confidence_score: Mapped[Optional[float]] = mapped_column(Float)
    
    # Status
    is_draft: Mapped[bool] = mapped_column(Boolean, default=True)
    is_signed: Mapped[bool] = mapped_column(Boolean, default=False)
    signed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id")
    )
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Export paths
    pdf_path: Mapped[Optional[str]] = mapped_column(String(512))
    
    # Relationships
    study: Mapped["Study"] = relationship("Study", back_populates="reports")


# ============================================================================
# Audio Recording Model
# ============================================================================

class AudioRecording(Base, UUIDMixin, TimestampMixin):
    """
    Audio recording model for voice dictation.
    
    Stores audio files, transcripts, and quality metrics.
    """
    
    study_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study.id", ondelete="CASCADE"), nullable=False
    )
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    
    # Audio properties
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    sample_rate: Mapped[int] = mapped_column(Integer, default=16000)
    channels: Mapped[int] = mapped_column(Integer, default=1)
    format: Mapped[str] = mapped_column(String(16), default="wav")
    
    # Transcription
    transcript: Mapped[Optional[str]] = mapped_column(Text)
    word_timestamps: Mapped[Optional[List[dict]]] = mapped_column(JSONB)
    language: Mapped[str] = mapped_column(String(8), default="en")
    
    # Quality metrics
    quality_level: Mapped[Optional[QualityLevel]] = mapped_column(Enum(QualityLevel))
    snr_db: Mapped[Optional[float]] = mapped_column(Float)
    has_background_noise: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Speaker diarization (if multiple speakers)
    speaker_segments: Mapped[Optional[List[dict]]] = mapped_column(JSONB)
    
    # Processing status
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    study: Mapped["Study"] = relationship("Study", back_populates="audio_recordings")


# ============================================================================
# Inference Job Model
# ============================================================================

class InferenceJob(Base, UUIDMixin, TimestampMixin):
    """
    AI inference job tracking model.
    
    Tracks the status and results of AI processing jobs.
    """
    
    study_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study.id", ondelete="CASCADE"), nullable=False
    )
    
    # Job info
    job_type: Mapped[str] = mapped_column(
        String(64), nullable=False,
        comment="classification, segmentation, report_generation, etc."
    )
    status: Mapped[InferenceStatus] = mapped_column(
        Enum(InferenceStatus), default=InferenceStatus.QUEUED, nullable=False
    )
    priority: Mapped[int] = mapped_column(Integer, default=0)
    
    # Model info
    model_name: Mapped[str] = mapped_column(String(64), nullable=False)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    
    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    processing_time_ms: Mapped[Optional[int]] = mapped_column(Integer)
    
    # Results
    predictions: Mapped[Optional[dict]] = mapped_column(JSONB)
    confidence_scores: Mapped[Optional[dict]] = mapped_column(JSONB)
    
    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Input/output hashes for reproducibility
    input_hash: Mapped[Optional[str]] = mapped_column(String(128))
    output_hash: Mapped[Optional[str]] = mapped_column(String(128))
    
    # Relationships
    study: Mapped["Study"] = relationship("Study", back_populates="inference_jobs")
    
    # Indexes
    __table_args__ = (
        Index("ix_inference_job_status", "status"),
        Index("ix_inference_job_created", "created_at"),
    )


# ============================================================================
# Audit Log Model
# ============================================================================

class AuditLog(Base, UUIDMixin):
    """
    Audit log for tracking sensitive operations.
    
    Maintains an immutable record of important actions for compliance.
    """
    
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id")
    )
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[Optional[str]] = mapped_column(String(128))
    
    # Details
    details: Mapped[Optional[dict]] = mapped_column(JSONB)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(String(512))
    
    # Indexes
    __table_args__ = (
        Index("ix_audit_log_user_action", "user_id", "action"),
        Index("ix_audit_log_resource", "resource_type", "resource_id"),
    )
