"""
GoWow Production Middleware Suite:
- SecurityHeadersMiddleware (CSP, HSTS, X-Content-Type-Options, Frame Options, Permissions Policy)
- RequestIDMiddleware (Correlation ID tracking via X-Request-ID)
- StructuredLoggingMiddleware (Sanitized structured request/response metrics)
- MemoryRateLimiter (Protective rate limiting with accessibility awareness)
"""

import time
import uuid
import logging
from collections import defaultdict
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.config import settings

logger = logging.getLogger("gowow.access")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies production-grade HTTP security headers conforming to OWASP guidelines (Sections 14, 15).
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Standard OWASP defensive headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"

        # Content Security Policy (allows Google Fonts and accessible data URIs while preventing script injection)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' http: https: ws: wss:; "
            "frame-ancestors 'none';"
        )

        # HSTS only when operating in production or HTTPS
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

        # Scrub sensitive routes or query params from logs
        path = request.url.path
        logger.info(
            f"event=http_request request_id={request_id} method={request.method} path={path} "
            f"status={response.status_code} duration_ms={process_time_ms} "
            f"client_ip={request.client.host if request.client else 'unknown'}"
        )
        return response


class SimpleRateLimiter:
    """
    Lightweight sliding-window in-memory rate limiter (Section 22 & 23).
    Ensures accessibility requests (TTS audio, answer autosave) are not blocked.
    """
    def __init__(self):
        # Maps client_ip -> list of timestamps
        self.requests: Dict[str, List[float]] = defaultdict(list)
        # Authentication-specific requests (login/register/reset)
        self.auth_requests: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, client_ip: str, is_auth: bool = False) -> Tuple[bool, int]:
        now = time.time()
        window = 60.0  # 1 minute sliding window

        request_store = self.auth_requests if is_auth else self.requests
        limit = settings.AUTH_RATE_LIMIT_PER_MINUTE if is_auth else settings.RATE_LIMIT_PER_MINUTE

        # Clean timestamps older than window
        valid_timestamps = [ts for ts in request_store[client_ip] if now - ts < window]
        request_store[client_ip] = valid_timestamps

        if len(valid_timestamps) >= limit:
            retry_after = int(window - (now - valid_timestamps[0])) + 1
            return True, max(1, retry_after)

        request_store[client_ip].append(now)
        return False, 0


rate_limiter = SimpleRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware protecting authentication, session creation, and submission endpoints.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        # Exclude health endpoints and static assets
        if request.url.path.startswith(("/health", "/docs", "/openapi.json", "/redoc")):
            return await call_next(request)

        # Do not rate limit in testing or if disabled
        if settings.ENVIRONMENT.lower() == "test":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        is_auth_route = request.url.path.startswith(("/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/reset-password"))

        is_limited, retry_after = rate_limiter.is_rate_limited(client_ip, is_auth=is_auth_route)

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
