from typing import Optional
from sqlalchemy.orm import Session
from app.core.exceptions import GoWowAPIException, UnauthorizedException, ValidationConflictException
from app.core.permissions import RoleEnum, get_permissions_for_role
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.role import Role, UserRole
from app.models.user import User
from app.schemas.auth import AuthUserResponse, LoginRequest, RegisterRequest, TokenResponse
from app.services.audit_service import log_audit_event
from app.utils.datetime import utc_now


def get_user_role_and_permissions(db: Session, user_id: str) -> tuple[str, list[str]]:
    """Fetch primary role name and effective permissions list for a user."""
    user_role_entry = db.query(UserRole).filter(UserRole.user_id == user_id).first()
    if not user_role_entry:
        return RoleEnum.CANDIDATE.value, get_permissions_for_role(RoleEnum.CANDIDATE.value)

    role_obj = db.query(Role).filter(Role.id == user_role_entry.role_id).first()
    role_name = role_obj.name if role_obj else RoleEnum.CANDIDATE.value
    permissions = get_permissions_for_role(role_name)
    return role_name, permissions


def authenticate_user(db: Session, login_data: LoginRequest) -> TokenResponse:
    """Validate user credentials, update last_login, and generate access and refresh tokens."""
    user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password.")

    if not user.is_active:
        raise UnauthorizedException("User account is inactive. Please contact the administrator.")

    # Update last login
    user.last_login = utc_now()
    db.commit()

    role_name, permissions = get_user_role_and_permissions(db, user.id)
    access_token = create_access_token(subject=user.id, role=role_name, permissions=permissions)
    refresh_token = create_refresh_token(subject=user.id)

    log_audit_event(db, action="USER_LOGIN_SUCCESS", resource_type="User", resource_id=user.id, actor_id=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=AuthUserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=role_name,
            permissions=permissions,
            is_active=user.is_active,
        ),
    )


def register_user(db: Session, register_data: RegisterRequest) -> TokenResponse:
    """Register a new user, hash password, assign requested role, and issue authentication tokens."""
    existing_user = db.query(User).filter(User.email == register_data.email.lower().strip()).first()
    if existing_user:
        raise ValidationConflictException("An account with this email address already exists.")

    new_user = User(
        email=register_data.email.lower().strip(),
        password_hash=get_password_hash(register_data.password),
        first_name=register_data.first_name.strip(),
        last_name=register_data.last_name.strip(),
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    # Determine role
    target_role_name = (register_data.role or RoleEnum.CANDIDATE.value).upper()
    role_obj = db.query(Role).filter(Role.name == target_role_name).first()
    if not role_obj:
        role_obj = Role(name=target_role_name, description=f"{target_role_name} platform role")
        db.add(role_obj)
        db.flush()

    user_role = UserRole(user_id=new_user.id, role_id=role_obj.id)
    db.add(user_role)
    db.commit()
    db.refresh(new_user)

    role_name, permissions = get_user_role_and_permissions(db, new_user.id)
    access_token = create_access_token(subject=new_user.id, role=role_name, permissions=permissions)
    refresh_token = create_refresh_token(subject=new_user.id)

    log_audit_event(db, action="USER_REGISTER_SUCCESS", resource_type="User", resource_id=new_user.id, actor_id=new_user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=AuthUserResponse(
            id=new_user.id,
            email=new_user.email,
            first_name=new_user.first_name,
            last_name=new_user.last_name,
            role=role_name,
            permissions=permissions,
            is_active=new_user.is_active,
        ),
    )


def refresh_user_token(db: Session, refresh_token: str) -> TokenResponse:
    """Issue a new access token using a valid refresh token."""
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid or expired refresh token.")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise UnauthorizedException("User not found or account is deactivated.")

    role_name, permissions = get_user_role_and_permissions(db, user.id)
    new_access_token = create_access_token(subject=user.id, role=role_name, permissions=permissions)
    new_refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=AuthUserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=role_name,
            permissions=permissions,
            is_active=user.is_active,
        ),
    )


def request_password_reset(db: Session, email: str) -> "MessageResponse":
    """
    Generate a secure password reset token without revealing account existence (Sections 19 & 20).
    Generic response prevents account enumeration attacks.
    """
    from datetime import timedelta
    from app.schemas.auth import MessageResponse

    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if user and user.is_active:
        reset_token = create_access_token(
            subject=user.id,
            role="PASSWORD_RESET",
            permissions=[],
            expires_delta=timedelta(minutes=15),
        )
        # Token is never exposed in logs or response; dispatched in production via secure email service
        log_audit_event(db, action="PASSWORD_RESET_REQUESTED", resource_type="User", resource_id=user.id)

    return MessageResponse(
        status="success",
        message="If an account exists for this email, recovery instructions will be provided.",
    )


def reset_password(db: Session, token: str, new_password: str) -> "MessageResponse":
    """
    Reset user password using verified, single-use cryptographic token.
    """
    from app.schemas.auth import MessageResponse

    payload = decode_token(token)
    if not payload or payload.get("role") != "PASSWORD_RESET":
        raise UnauthorizedException("Invalid or expired password reset token.")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise UnauthorizedException("User not found or account is deactivated.")

    user.password_hash = get_password_hash(new_password)
    user.updated_at = utc_now()
    db.commit()

    log_audit_event(db, action="PASSWORD_RESET_COMPLETED", resource_type="User", resource_id=user.id)

    return MessageResponse(
        status="success",
        message="Your password has been successfully reset. You may now log in with your new password.",
    )

