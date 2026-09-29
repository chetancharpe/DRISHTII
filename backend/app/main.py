import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import (
    accessibility,
    admin,
    analytics,
    auth,
    candidate,
    exams,
    learning,
    mock_tests,
    questions,
    results,
    sessions,
)
from sqlalchemy import text
from app.core.config import settings
from app.core.exceptions import GoWowAPIException
from app.core.middleware import (
    RateLimitMiddleware,
    RequestIDMiddleware,
    SecurityHeadersMiddleware,
    StructuredLoggingMiddleware,
)
from app.db.base import Base
from app.db.database import engine

# Auto-create tables if they do not exist (idempotent, safe in all environments)
if not os.environ.get("USE_ALEMBIC"):
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        import logging
        logging.getLogger("uvicorn.error").warning(f"Schema auto-creation check: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Accessible Examination & Practice Learning Platform Backend API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# 1. Structured Logging Middleware
app.add_middleware(StructuredLoggingMiddleware)

# 2. Rate Limiting Middleware (Section 22 & 23)
app.add_middleware(RateLimitMiddleware)

# 3. Security Headers Middleware (Section 14 & 15)
app.add_middleware(SecurityHeadersMiddleware)

# 4. Correlation / Request ID Middleware (Section 36)
app.add_middleware(RequestIDMiddleware)

# 5. CORS Middleware (Section 16: Supports configured origins + all Vercel deployments)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standardized Custom Exception Handler (Section 50 & 65)
@app.exception_handler(GoWowAPIException)
async def gowow_api_exception_handler(request: Request, exc: GoWowAPIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
        headers=exc.headers,
    )


# Centralized Unhandled Exception Handler (Never exposes Python traceback or DB internals)
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log exception internally without exposing secrets or stack traces
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again or contact support.",
            }
        },
    )


# Health Check Endpoints (Section 37)
@app.get("/health", tags=["Health"])
def health_check():
    """Basic health check indicating FastAPI process is running."""
    return {
        "status": "ok",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health/live", tags=["Health"])
def liveness_probe():
    """Liveness probe for orchestrators (Kubernetes / Docker healthcheck)."""
    return {"status": "alive"}


@app.get("/health/ready", tags=["Health"])
def readiness_probe():
    """Readiness probe verifying database connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "version": settings.VERSION,
        }
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": "Database connectivity check failed.",
            },
        )



# Mount API V1 Routers
api_v1_prefix = settings.API_V1_STR

app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(accessibility.router, prefix=api_v1_prefix)
app.include_router(learning.router, prefix=api_v1_prefix)
app.include_router(exams.router, prefix=api_v1_prefix)
app.include_router(sessions.router, prefix=api_v1_prefix)
app.include_router(results.router, prefix=api_v1_prefix)
app.include_router(questions.router, prefix=api_v1_prefix)
app.include_router(analytics.router, prefix=api_v1_prefix)
app.include_router(admin.router, prefix=api_v1_prefix)
app.include_router(candidate.router, prefix=api_v1_prefix)
app.include_router(mock_tests.router, prefix=api_v1_prefix)

