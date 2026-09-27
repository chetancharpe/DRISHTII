from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class GoWowAPIException(HTTPException):
    """Base API Exception ensuring standardized error response format."""
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.code = code
        self.message = message
        self.details = details or {}


class EntityNotFoundException(GoWowAPIException):
    def __init__(self, entity_name: str, identifier: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=f"{entity_name} with identifier '{identifier}' was not found.",
        )


class UnauthorizedException(GoWowAPIException):
    def __init__(self, message: str = "Invalid or expired authentication credentials."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message=message,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(GoWowAPIException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            message=message,
        )


class ValidationConflictException(GoWowAPIException):
    def __init__(self, message: str, code: str = "CONFLICT"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code=code,
            message=message,
        )


class ExamNotAvailableException(GoWowAPIException):
    def __init__(self, message: str = "This examination is not currently available."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="EXAM_NOT_AVAILABLE",
            message=message,
        )


class SessionExpiredException(GoWowAPIException):
    def __init__(self, message: str = "The exam session has reached official server expiry time."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="SESSION_EXPIRED",
            message=message,
        )


class AlreadySubmittedException(GoWowAPIException):
    def __init__(self, message: str = "This examination session has already been submitted."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="ALREADY_SUBMITTED",
            message=message,
        )


class AccessibilityGateException(GoWowAPIException):
    def __init__(self, reasons: list[str]):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="ACCESSIBILITY_VALIDATION_FAILED",
            message=f"Exam publication blocked by accessibility gate: {'; '.join(reasons)}",
            details={"accessibility_errors": reasons},
        )
        self.errors = reasons

