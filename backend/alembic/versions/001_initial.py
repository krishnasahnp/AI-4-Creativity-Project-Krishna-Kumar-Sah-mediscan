"""Initial schema

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-29

This migration creates all initial tables for MediVision AI.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(256), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(256), nullable=False),
        sa.Column('full_name', sa.String(256)),
        sa.Column('role', sa.String(32), nullable=False, default='clinician'),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # Cases table
    op.create_table(
        'cases',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('patient_id', sa.String(64), nullable=False, index=True),
        sa.Column('status', sa.String(32), default='pending'),
        sa.Column('clinical_notes', sa.Text),
        sa.Column('tags', postgresql.ARRAY(sa.String)),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # Studies table
    op.create_table(
        'studies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cases.id', ondelete='CASCADE')),
        sa.Column('modality', sa.String(16), nullable=False),
        sa.Column('body_part', sa.String(64)),
        sa.Column('study_date', sa.Date),
        sa.Column('description', sa.Text),
        sa.Column('metadata', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Series table
    op.create_table(
        'series',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('study_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('studies.id', ondelete='CASCADE')),
        sa.Column('series_number', sa.Integer),
        sa.Column('description', sa.String(256)),
        sa.Column('num_images', sa.Integer, default=0),
        sa.Column('metadata', postgresql.JSONB),
    )

    # Images table
    op.create_table(
        'images',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('series_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('series.id', ondelete='CASCADE')),
        sa.Column('file_path', sa.String(512), nullable=False),
        sa.Column('slice_index', sa.Integer),
        sa.Column('pixel_spacing', postgresql.ARRAY(sa.Float)),
        sa.Column('slice_thickness', sa.Float),
        sa.Column('window_center', sa.Float),
        sa.Column('window_width', sa.Float),
        sa.Column('metadata', postgresql.JSONB),
    )

    # Annotations table
    op.create_table(
        'annotations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('image_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('images.id', ondelete='CASCADE')),
        sa.Column('study_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('studies.id', ondelete='CASCADE')),
        sa.Column('annotation_type', sa.String(32), nullable=False),
        sa.Column('label_value', postgresql.JSONB),
        sa.Column('mask_path', sa.String(512)),
        sa.Column('confidence', sa.Float),
        sa.Column('model_version', sa.String(64)),
        sa.Column('annotator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Reports table
    op.create_table(
        'reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('study_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('studies.id', ondelete='CASCADE'), unique=True),
        sa.Column('indication', sa.Text),
        sa.Column('technique', sa.Text),
        sa.Column('findings', sa.Text),
        sa.Column('impression', sa.Text),
        sa.Column('recommendations', sa.Text),
        sa.Column('measurements', postgresql.JSONB),
        sa.Column('generated_by', sa.String(32)),
        sa.Column('status', sa.String(32), default='draft'),
        sa.Column('signed_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('signed_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # Audio recordings table
    op.create_table(
        'audio_recordings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('study_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('studies.id', ondelete='CASCADE')),
        sa.Column('file_path', sa.String(512), nullable=False),
        sa.Column('duration_seconds', sa.Float),
        sa.Column('sample_rate', sa.Integer),
        sa.Column('transcript', sa.Text),
        sa.Column('timestamps', postgresql.JSONB),
        sa.Column('speaker_roles', postgresql.JSONB),
        sa.Column('quality_score', sa.Float),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Inference jobs table
    op.create_table(
        'inference_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('study_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('studies.id', ondelete='CASCADE')),
        sa.Column('job_type', sa.String(64), nullable=False),
        sa.Column('status', sa.String(32), default='pending'),
        sa.Column('priority', sa.Integer, default=0),
        sa.Column('model_version', sa.String(64)),
        sa.Column('input_params', postgresql.JSONB),
        sa.Column('result', postgresql.JSONB),
        sa.Column('error_message', sa.Text),
        sa.Column('processing_time_ms', sa.Integer),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('started_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
    )

    # Audit logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('action', sa.String(64), nullable=False),
        sa.Column('resource_type', sa.String(64)),
        sa.Column('resource_id', sa.String(64)),
        sa.Column('details', postgresql.JSONB),
        sa.Column('ip_address', sa.String(64)),
        sa.Column('user_agent', sa.String(512)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Create indexes
    op.create_index('ix_cases_status', 'cases', ['status'])
    op.create_index('ix_studies_modality', 'studies', ['modality'])
    op.create_index('ix_inference_jobs_status', 'inference_jobs', ['status'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('inference_jobs')
    op.drop_table('audio_recordings')
    op.drop_table('reports')
    op.drop_table('annotations')
    op.drop_table('images')
    op.drop_table('series')
    op.drop_table('studies')
    op.drop_table('cases')
    op.drop_table('users')
