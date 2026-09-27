import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "GoWow Accessible Examination Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Logging
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "sqlite:///./gowow.db"

    # Security
    JWT_SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    HSTS_SECONDS: int = 31536000

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    AUTH_RATE_LIMIT_PER_MINUTE: int = 10

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
            origins = [origin.strip() for origin in v.split(",") if origin.strip()]
            return origins
        elif isinstance(v, (list, str)):
            return v
        raise ValueError("Invalid format for CORS_ORIGINS")

    @field_validator("JWT_SECRET_KEY")
    def validate_jwt_secret(cls, v, info):
        # Prevent deploying with short or default key in production
        env = os.environ.get("ENVIRONMENT", "development").lower()
        if env == "production":
            if not v or len(v) < 32 or "09d25e094faa6ca2" in v:
                raise ValueError("CRITICAL: Production deployment requires a secure, custom 64-character JWT_SECRET_KEY.")
        return v

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
