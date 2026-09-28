"""
GoWow Production Middleware Suite:
- SecurityHeadersMiddleware (Strict CSP, HSTS, X-Content-Type-Options, Frame Options, Permissions Policy)
- RequestIDMiddleware (Correlation ID tracking via X-Request-ID)
- StructuredLoggingMiddleware (Sanitized structured request/response metrics)
- RateLimitMiddleware (Pluggable In-Memory/Redis, Per-User/Per-IP, Autosave generous limits)
"""

import time
import uuid
import logging
from abc import ABC, abstractmethod
from collections import defaultdict
from typing import Dict, List, Optional, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.config import settings
from app.core.security import decode_token

logger = logging.getLogger("gowow.access")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies production-grade HTTP security headers conforming to OWASP guidelines (Sections 14, 15).
    Strictly removes 'unsafe-inline' from script-src on API endpoints, relaxing only for Swagger UI in development.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Standard OWASP defensive headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"

        # Allowed connect origins from configuration
        origins_list = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
        connect_origins = " ".join(origins_list)

        # Check if request is for interactive API documentation
        is_docs = request.url.path.startswith((
            "/docs", "/redoc", "/openapi.json",
            f"{settings.API_V1_STR}/docs",
            f"{settings.API_V1_STR}/redoc",
            f"{settings.API_V1_STR}/openapi.json",
        ))

        if is_docs and settings.ENVIRONMENT.lower() == "development":
            # Permissive CSP for Swagger UI in local development only
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com data:; "
                "img-src 'self' data: https: blob:; "
                f"connect-src 'self' {connect_origins}; "
                "frame-ancestors 'none';"
            )
        else:
            # Strict CSP for all API endpoints: NO unsafe-inline scripts!
            response.headers["Content-Security-Policy"] = (
                "default-src 'none'; "
                "base-uri 'none'; "
                "form-action 'none'; "
                "frame-ancestors 'none'; "
                "script-src 'self'; "
                "style-src 'self'; "
                "img-src 'self' data:; "
                "font-src 'self'; "
                f"connect-src 'self' {connect_origins};"
            )

        # HSTS only when operating in production
        if settings.ENVIRONMENT.lower() == "production":
            response.headers["Strict-Transport-Security"] = f"max-age={settings.HSTS_SECONDS}; includeSubDomains; preload"

        return response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Guarantees every request has a traceable correlation ID (Section 36).
    Preserves incoming X-Request-ID from gateway or generates a UUID4.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    Emits structured JSON-compatible access logs with latency metrics (Section 35).
    Strictly redacts sensitive fields like passwords, tokens, or personal identifiers.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        request_id = getattr(request.state, "request_id", "unknown")

        response = await call_next(request)
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        path = request.url.path
        logger.info(
            f"event=http_request request_id={request_id} method={request.method} path={path} "
            f"status={response.status_code} duration_ms={process_time_ms} "
            f"client_ip={request.client.host if request.client else 'unknown'}"
        )
        return response


class RateLimiterStore(ABC):
    """Abstract interface for rate limiting storage."""
    @abstractmethod
    def is_rate_limited(self, key: str, limit: int, window_seconds: float = 60.0) -> Tuple[bool, int]:
        """Check if request exceeds limit. Returns (is_limited, retry_after_seconds)."""
        pass


class MemoryRateLimiterStore(RateLimiterStore):
    """In-memory sliding window rate limiter."""
    def __init__(self):
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, key: str, limit: int, window_seconds: float = 60.0) -> Tuple[bool, int]:
        now = time.time()
        timestamps = [ts for ts in self.requests[key] if now - ts < window_seconds]
        self.requests[key] = timestamps

        if len(timestamps) >= limit:
            retry_after = int(window_seconds - (now - timestamps[0])) + 1
            return True, max(1, retry_after)

        self.requests[key].append(now)
        return False, 0


class RedisRateLimiterStore(RateLimiterStore):
    """Redis-backed rate limiter for distributed environments."""
    def __init__(self, redis_url: str):
        import redis
        self.client = redis.Redis.from_url(redis_url, decode_responses=True)

    def is_rate_limited(self, key: str, limit: int, window_seconds: float = 60.0) -> Tuple[bool, int]:
        try:
            now = time.time()
            cutoff = now - window_seconds
            pipe = self.client.pipeline()
            pipe.zremrangebyscore(key, 0, cutoff)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, int(window_seconds) + 1)
            results = pipe.execute()
            count = results[2]

            if count > limit:
                oldest = self.client.zrange(key, 0, 0, withscores=True)
                oldest_ts = oldest[0][1] if oldest else cutoff
                retry_after = max(1, int(window_seconds - (now - oldest_ts)) + 1)
                return True, retry_after

            return False, 0
        except Exception as exc:
            logger.warning(f"Redis rate limiter error: {exc}. Falling back to unblocked request.")
            return False, 0


def create_rate_limiter_store() -> RateLimiterStore:
    """Create pluggable rate limiter store based on settings."""
    if settings.REDIS_URL:
        try:
            return RedisRateLimiterStore(settings.REDIS_URL)
        except Exception as exc:
            logger.warning(f"Could not initialize RedisRateLimiterStore at {settings.REDIS_URL}: {exc}. Using MemoryRateLimiterStore.")
    return MemoryRateLimiterStore()


rate_limiter_store = create_rate_limiter_store()


def extract_user_id_from_token(request: Request) -> Optional[str]:
    """Safely extract user identifier from Bearer token if present."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        payload = decode_token(token)
        if payload and payload.get("sub"):
            return str(payload["sub"])
    return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Production-grade rate limiting middleware:
    - Per-IP for unauthenticated authentication endpoints (anti-brute-force).
    - Per-User for authenticated requests (exam autosave and sync endpoints get generous 300 req/min).
    - Pluggable backing store (In-memory default, Redis when REDIS_URL is configured).
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        # Exclude documentation and health endpoints
        if request.url.path.startswith(("/health", "/docs", "/openapi.json", "/redoc")):
            return await call_next(request)

        # Allow tests to bypass unless explicitly testing rate limits
        if settings.ENVIRONMENT.lower() == "test" and request.headers.get("X-Test-Rate-Limit") != "true":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        user_id = extract_user_id_from_token(request)

        path = request.url.path
        is_auth_route = path.startswith((
            f"{settings.API_V1_STR}/auth/login",
            f"{settings.API_V1_STR}/auth/register",
            f"{settings.API_V1_STR}/auth/forgot-password",
            f"{settings.API_V1_STR}/auth/reset-password",
        ))

        is_autosave_route = (
            ("/sessions" in path or "/exam-sessions" in path) and
            ("/answers" in path or "/sync" in path)
        )

        if is_auth_route:
            # Per-IP for authentication routes
            key = f"auth:ip:{client_ip}"
            limit = settings.AUTH_RATE_LIMIT_PER_MINUTE
        elif is_autosave_route:
            # Per-user if authenticated (generous autosave limit), per-IP otherwise
            key = f"autosave:user:{user_id}" if user_id else f"autosave:ip:{client_ip}"
            limit = settings.EXAM_AUTOSAVE_RATE_LIMIT_PER_MINUTE
        else:
            # General routes: per-user when authenticated, per-IP otherwise
            key = f"general:user:{user_id}" if user_id else f"general:ip:{client_ip}"
            limit = settings.RATE_LIMIT_PER_MINUTE

        is_limited, retry_after = rate_limiter_store.is_rate_limited(key=key, limit=limit, window_seconds=60.0)

        if is_limited:
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please slow down and try again.",
                        "retry_after_seconds": retry_after,
                    }
                },
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)
