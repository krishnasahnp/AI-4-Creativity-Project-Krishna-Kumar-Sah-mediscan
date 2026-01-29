"""
MediVision AI - Logging Configuration

Centralized logging setup using Loguru for beautiful,
informative log output with rotation and retention policies.

Author: MediVision AI Team
"""

import sys
from pathlib import Path

from loguru import logger

from app.core.config import settings


def setup_logging() -> None:
    """
    Configure application-wide logging.
    
    Sets up console and file logging with appropriate formatting,
    rotation, and retention policies for production use.
    """
    # Remove default handler
    logger.remove()
    
    # Console handler with colored output
    logger.add(
        sys.stderr,
        format=settings.LOG_FORMAT,
        level=settings.LOG_LEVEL,
        colorize=True,
        backtrace=True,
        diagnose=settings.DEBUG,
    )
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # File handler for general logs
    logger.add(
        log_dir / "medivision_{time:YYYY-MM-DD}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="DEBUG" if settings.DEBUG else "INFO",
        rotation="00:00",  # Rotate at midnight
        retention="30 days",  # Keep logs for 30 days
        compression="zip",
        backtrace=True,
        diagnose=settings.DEBUG,
    )
    
    # Separate file for errors
    logger.add(
        log_dir / "errors_{time:YYYY-MM-DD}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="ERROR",
        rotation="00:00",
        retention="90 days",
        compression="zip",
        backtrace=True,
        diagnose=True,
    )
    
    # Audit log for sensitive operations
    logger.add(
        log_dir / "audit_{time:YYYY-MM-DD}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {extra[user_id]} | {extra[action]} | {message}",
        level="INFO",
        rotation="00:00",
        retention="365 days",  # Keep audit logs for 1 year
        compression="zip",
        filter=lambda record: record["extra"].get("audit", False),
    )
    
    logger.info("📝 Logging configured successfully")


def get_audit_logger():
    """
    Get a logger bound with audit context.
    
    Usage:
        audit = get_audit_logger()
        audit.bind(user_id="123", action="login").info("User logged in")
    
    Returns:
        Logger: Loguru logger with audit filter
    """
    return logger.bind(audit=True)


def log_request(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: str = "anonymous"
) -> None:
    """
    Log an HTTP request for monitoring.
    
    Args:
        method: HTTP method (GET, POST, etc.)
        path: Request path
        status_code: Response status code
        duration_ms: Request duration in milliseconds
        user_id: User ID if authenticated
    """
    # Color code based on status
    if status_code < 300:
        level = "INFO"
    elif status_code < 400:
        level = "WARNING"
    else:
        level = "ERROR"
    
    logger.log(
        level,
        f"{method} {path} → {status_code} ({duration_ms:.2f}ms) [user: {user_id}]"
    )


def log_inference(
    model_name: str,
    study_id: str,
    duration_ms: float,
    success: bool,
    confidence: float = None
) -> None:
    """
    Log an AI inference operation.
    
    Args:
        model_name: Name of the AI model used
        study_id: ID of the study processed
        duration_ms: Inference duration in milliseconds
        success: Whether inference completed successfully
        confidence: Prediction confidence score if applicable
    """
    status = "✅" if success else "❌"
    conf_str = f" (conf: {confidence:.2f})" if confidence else ""
    
    logger.info(
        f"{status} Inference [{model_name}] study={study_id} "
        f"duration={duration_ms:.2f}ms{conf_str}"
    )
