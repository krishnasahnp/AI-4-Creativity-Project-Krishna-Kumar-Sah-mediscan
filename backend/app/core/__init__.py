"""
MediVision AI Core Module

Core functionality including configuration, security, and logging.
"""

from app.core.config import settings, get_settings
from app.core.security import (
    hash_password,
    verify_password,
    create_token_pair,
    get_current_user,
    require_role,
)

__all__ = [
    "settings",
    "get_settings",
    "hash_password",
    "verify_password",
    "create_token_pair",
    "get_current_user",
    "require_role",
]
