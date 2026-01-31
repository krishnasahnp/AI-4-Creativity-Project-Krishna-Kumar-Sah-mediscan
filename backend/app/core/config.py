"""
MediVision AI - Application Configuration

Centralized configuration management using Pydantic Settings.
Loads configuration from environment variables and .env files.

Author: MediVision AI Team
"""

from functools import lru_cache
from typing import List, Optional

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    All sensitive values should be set via environment variables
    or a .env file, never hardcoded in the codebase.
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )
    
    # Application Settings
    PROJECT_NAME: str = "MediVision AI"
    DEBUG: bool = Field(default=False, description="Enable debug mode")
    PORT: int = Field(default=8000, description="Server port")
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = Field(
        default="your-super-secret-key-change-in-production",
        description="Secret key for JWT encoding"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        description="JWT access token expiration time in minutes"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        description="JWT refresh token expiration time in days"
    )
    ALGORITHM: str = "HS256"
    
    # Database
    POSTGRES_HOST: str = Field(default="localhost", description="PostgreSQL host")
    POSTGRES_PORT: int = Field(default=5432, description="PostgreSQL port")
    POSTGRES_USER: str = Field(default="medivision", description="PostgreSQL user")
    POSTGRES_PASSWORD: str = Field(default="medivision123", description="PostgreSQL password")
    POSTGRES_DB: str = Field(default="medivision_db", description="PostgreSQL database name")
    
    # Allow overriding via env var
    DATABASE_URL_VAL: Optional[str] = Field(default=None, alias="DATABASE_URL")

    @property
    def DATABASE_URL(self) -> str:
        """Construct the async database URL."""
        if self.DATABASE_URL_VAL:
            return self.DATABASE_URL_VAL
            
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Construct the sync database URL for migrations."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    # Redis
    REDIS_HOST: str = Field(default="localhost", description="Redis host")
    REDIS_PORT: int = Field(default=6379, description="Redis port")
    REDIS_DB: int = Field(default=0, description="Redis database number")
    
    @property
    def REDIS_URL(self) -> str:
        """Construct the Redis URL."""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="Allowed CORS origins"
    )
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    # File Storage
    UPLOAD_DIR: str = Field(
        default="./uploads",
        description="Directory for uploaded files"
    )
    MAX_UPLOAD_SIZE_MB: int = Field(
        default=500,
        description="Maximum file upload size in MB"
    )
    ALLOWED_CT_EXTENSIONS: List[str] = [".dcm", ".dicom", ".zip", ".jpg", ".jpeg", ".png", ".webp"]
    ALLOWED_US_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".dcm"]
    ALLOWED_US_VIDEO_EXTENSIONS: List[str] = [".mp4", ".avi", ".mov"]
    ALLOWED_AUDIO_EXTENSIONS: List[str] = [".wav", ".mp3", ".m4a", ".ogg"]
    
    # AI Model Paths
    MODEL_DIR: str = Field(
        default="./models",
        description="Directory for AI model weights"
    )
    CT_CLASSIFIER_MODEL: str = "ct_classifier_swin.pt"
    CT_SEGMENTATION_MODEL: str = "ct_segmentation_swin.pt"
    US_CLASSIFIER_MODEL: str = "us_classifier_vit.pt"
    MULTIMODAL_MODEL: str = "multimodal_retriever.pt"
    LLM_MODEL_NAME: str = "mistralai/Mistral-7B-Instruct-v0.2"
    LLM_LORA_PATH: Optional[str] = None
    WHISPER_MODEL_SIZE: str = "base"  # tiny, base, small, medium, large
    
    # AI Inference Settings
    DEVICE: str = Field(
        default="cuda",
        description="Device for inference (cuda, cpu, mps)"
    )
    BATCH_SIZE: int = Field(default=4, description="Inference batch size")
    NUM_WORKERS: int = Field(default=4, description="DataLoader workers")
    
    # External Services (optional)
    S3_BUCKET: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_REGION: Optional[str] = None
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(
        default="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        description="Log format string"
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Uses LRU cache to avoid re-reading environment variables
    on every access. Clear cache with get_settings.cache_clear()
    if settings need to be reloaded.
    
    Returns:
        Settings: Application settings instance
    """
    return Settings()


# Global settings instance
settings = get_settings()
