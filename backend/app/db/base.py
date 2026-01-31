"""
MediVision AI - SQLAlchemy Base Model

Base model class with common fields and utilities.

Author: MediVision AI Team
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, func
from sqlalchemy.types import Uuid as UUID
from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    
    Provides common functionality:
    - UUID primary keys
    - Automatic table naming
    - Created/updated timestamps
    """
    
    # Generate __tablename__ automatically from class name
    @declared_attr.directive
    def __tablename__(cls) -> str:
        """Generate table name from class name (snake_case)."""
        # Convert CamelCase to snake_case
        name = cls.__name__
        return ''.join(
            ['_' + c.lower() if c.isupper() else c for c in name]
        ).lstrip('_')
    
    def to_dict(self) -> dict[str, Any]:
        """
        Convert model instance to dictionary.
        
        Useful for serialization and API responses.
        Handles UUID and datetime conversion.
        
        Returns:
            dict: Model data as dictionary
        """
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, uuid.UUID):
                value = str(value)
            elif isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result
    
    def __repr__(self) -> str:
        """Generate a readable representation of the model."""
        class_name = self.__class__.__name__
        attrs = []
        for column in self.__table__.columns:
            if column.name in ('id', 'name', 'email', 'status'):
                value = getattr(self, column.name, None)
                if value is not None:
                    attrs.append(f"{column.name}={value!r}")
        return f"<{class_name}({', '.join(attrs)})>"


class TimestampMixin:
    """
    Mixin for created_at and updated_at timestamps.
    
    Usage:
        class MyModel(Base, TimestampMixin):
            ...
    """
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class UUIDMixin:
    """
    Mixin for UUID primary key.
    
    Usage:
        class MyModel(Base, UUIDMixin):
            ...
    """
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
