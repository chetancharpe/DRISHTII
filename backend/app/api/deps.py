from typing import Generator, List, Optional
from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.permissions import RoleEnum, has_permission
from app.core.security import decode_token
from app.db.database import get_db
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate Bearer JWT and retrieve authenticated User entity."""
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Authentication token required.")

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedException("Invalid, malformed, or expired access token.")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token payload missing subject identifier.")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise UnauthorizedException("User account not found or deactivated.")

    # Attach token claims to request user context
    setattr(user, "token_role", payload.get("role", RoleEnum.CANDIDATE.value))
    setattr(user, "token_permissions", payload.get("permissions", []))

    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Validate Bearer JWT if present; returns User entity or None without raising 401."""
    if not credentials or not credentials.credentials:
        return None

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        return None

    setattr(user, "token_role", payload.get("role", RoleEnum.CANDIDATE.value))
    setattr(user, "token_permissions", payload.get("permissions", []))
    return user


def require_role(allowed_roles: List[str]):
    """Enforce endpoint access by role name."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = getattr(current_user, "token_role", RoleEnum.CANDIDATE.value)
        if user_role not in allowed_roles and user_role != RoleEnum.ADMIN.value:
            raise ForbiddenException(f"Action requires one of the following roles: {', '.join(allowed_roles)}")
        return current_user
    return role_checker


def require_permission(required_permission: str):
    """Enforce endpoint access by granular permission code."""
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = getattr(current_user, "token_role", RoleEnum.CANDIDATE.value)
        user_permissions = getattr(current_user, "token_permissions", [])
        if not has_permission(user_role, user_permissions, required_permission):
            raise ForbiddenException(f"Missing required permission: '{required_permission}'.")
        return current_user
    return permission_checker


def require_examiner_access(current_user: User = Depends(get_current_user)) -> User:
    """Require EXAMINER or ADMIN role."""
    user_role = getattr(current_user, "token_role", RoleEnum.CANDIDATE.value)
    if user_role not in [RoleEnum.EXAMINER.value, RoleEnum.ADMIN.value]:
        raise ForbiddenException("Examiner or administrator privileges required.")
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require ADMIN role."""
    user_role = getattr(current_user, "token_role", RoleEnum.CANDIDATE.value)
    if user_role != RoleEnum.ADMIN.value:
        raise ForbiddenException("Administrator privileges required.")
    return current_user
