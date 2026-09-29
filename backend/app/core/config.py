import logging
import os
import secrets
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "DRISHTI Accessible Examination Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Logging
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "sqlite:///./gowow.db"

    # Security
    JWT_SECRET_KEY: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    HSTS_SECONDS: int = 31536000

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    AUTH_RATE_LIMIT_PER_MINUTE: int = 10
    EXAM_AUTOSAVE_RATE_LIMIT_PER_MINUTE: int = 300
    REDIS_URL: Optional[str] = None

    # Backup & Retention
    BACKUP_RETENTION_DAYS: int = 30

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            origins = [origin.strip().rstrip("/") for origin in v.split(",") if origin.strip()]
            return origins
        elif isinstance(v, list):
            return [str(o).strip().rstrip("/") for o in v if str(o).strip()]
        elif isinstance(v, str):
            return v
        raise ValueError("Invalid format for CORS_ORIGINS")

    @field_validator("JWT_SECRET_KEY", mode="before")
    def validate_jwt_secret(cls, v):
        env = os.environ.get("ENVIRONMENT", "development").lower()
        if env == "production":
            if not v or len(str(v)) < 32 or "09d25e094faa6ca2" in str(v):
                raise ValueError("CRITICAL: Production deployment requires a secure, custom 32+ character JWT_SECRET_KEY.")
            return str(v)
        
        # In non-production, if key is not configured, generate ephemeral random secret
        if not v or not str(v).strip():
            ephemeral_key = secrets.token_hex(32)
            logging.getLogger("gowow.security").warning(
                "SECURITY WARNING: No JWT_SECRET_KEY provided. Auto-generated ephemeral random secret for this session. (Value will not be logged)"
            )
            return ephemeral_key
        return str(v)

    # Grace period in seconds for submission transit
    SUBMISSION_GRACE_PERIOD_SECONDS: int = 30

    # Development Seed Credentials (never use in production)
    DEV_ADMIN_EMAIL: str = "admin@gowow.org"
    DEV_ADMIN_PASSWORD: str = "AdminSecurePass123!"
    DEV_EXAMINER_EMAIL: str = "examiner@gowow.org"
    DEV_EXAMINER_PASSWORD: str = "ExaminerSecure123!"
    DEV_CANDIDATE_EMAIL: str = "candidate1@gowow.org"
    DEV_CANDIDATE_PASSWORD: str = "CandidateSecure123!"


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
