import hashlib
import secrets
import uuid
from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import GoWowAPIException, UnauthorizedException, ValidationConflictException
from app.core.permissions import RoleEnum, get_permissions_for_role
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    validate_password_strength,
    verify_password,
)
from app.models.password_reset_token import PasswordResetToken
from app.models.refresh_token import RefreshToken
from app.models.role import Role, UserRole
from app.models.user import User
from app.schemas.auth import AuthUserResponse, LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import AdminUserCreate, UserResponse
from app.services.audit_service import log_audit_event
from app.services.email_service import get_email_sender
from app.utils.datetime import ensure_utc, utc_now


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
    """Validate user credentials, update last_login, and generate access and rotated refresh tokens."""
    user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password.")

    if not user.is_active:
        raise UnauthorizedException("User account is inactive. Please contact the administrator.")

    # Update last login
    user.last_login = utc_now()

    role_name, permissions = get_user_role_and_permissions(db, user.id)
    access_token = create_access_token(subject=user.id, role=role_name, permissions=permissions)

    # Issue and record server-side refresh token
    jti = str(uuid.uuid4())
    refresh_token = create_refresh_token(subject=user.id, jti=jti)
    refresh_record = RefreshToken(
        jti=jti,
        user_id=user.id,
        expires_at=utc_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_record)
    db.commit()

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
    """
    Register a new candidate.
    SECURITY HARDENING:
    - Enforces strict password complexity.
    - Completely ignores any 'role' field passed in public signup; always assigns CANDIDATE.
    """
    # 1. Enforce password strength
    is_valid, msg = validate_password_strength(register_data.password)
    if not is_valid:
        raise GoWowAPIException(status_code=400, code="WEAK_PASSWORD", message=msg)

    # 2. Check email uniqueness
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

    # 3. Public registration is ALWAYS CANDIDATE role (prevents role escalation)
    target_role_name = RoleEnum.CANDIDATE.value
    role_obj = db.query(Role).filter(Role.name == target_role_name).first()
    if not role_obj:
        role_obj = Role(name=target_role_name, description=f"{target_role_name} platform role")
        db.add(role_obj)
        db.flush()

    user_role = UserRole(user_id=new_user.id, role_id=role_obj.id)
    db.add(user_role)

    # 4. Generate access and tracked refresh token
    role_name, permissions = get_user_role_and_permissions(db, new_user.id)
    access_token = create_access_token(subject=new_user.id, role=role_name, permissions=permissions)

    jti = str(uuid.uuid4())
    refresh_token = create_refresh_token(subject=new_user.id, jti=jti)
    refresh_record = RefreshToken(
        jti=jti,
        user_id=new_user.id,
        expires_at=utc_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_record)
    db.commit()
    db.refresh(new_user)

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
    """
    Rotate JWT access and refresh tokens.
    Enforces server-side tracking, jti validation, and immediate rotation/revocation of the old refresh token.
    """
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid or expired refresh token.")

    jti = payload.get("jti")
    if not jti:
        raise UnauthorizedException("Malformed refresh token missing tracking identifier.")

    token_record = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if not token_record or token_record.revoked_at is not None:
        raise UnauthorizedException("Refresh token is invalid or has already been revoked.")

    if ensure_utc(token_record.expires_at) < utc_now():
        raise UnauthorizedException("Refresh token has expired.")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise UnauthorizedException("User not found or account is deactivated.")

    # Invalidate (revoke) old refresh token as part of rotation
    token_record.revoked_at = utc_now()

    # Issue new access token and newly rotated refresh token
    role_name, permissions = get_user_role_and_permissions(db, user.id)
    new_access_token = create_access_token(subject=user.id, role=role_name, permissions=permissions)

    new_jti = str(uuid.uuid4())
    new_refresh_token = create_refresh_token(subject=user.id, jti=new_jti)
    new_refresh_record = RefreshToken(
        jti=new_jti,
        user_id=user.id,
        expires_at=utc_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_refresh_record)
    db.commit()

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


def revoke_user_refresh_tokens(db: Session, user_id: str, refresh_token: Optional[str] = None) -> None:
    """Revoke specific refresh token or all active refresh tokens for a user upon logout or password reset."""
    if refresh_token:
        payload = decode_token(refresh_token)
        if payload and payload.get("jti"):
            db.query(RefreshToken).filter(
                RefreshToken.jti == payload["jti"],
                RefreshToken.user_id == user_id,
            ).update({"revoked_at": utc_now()})

    # Revoke all active refresh tokens for the user
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None),
    ).update({"revoked_at": utc_now()})
    db.commit()


def request_password_reset(db: Session, email: str) -> "MessageResponse":
    """
    Generate a secure password reset token without revealing account existence.
    Uses SHA-256 token hashing and EmailSender interface.
    """
    from app.schemas.auth import MessageResponse

    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if user and user.is_active:
        # Invalidate any prior unused reset tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        ).update({"used_at": utc_now()})

        # Generate cryptographic random token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=utc_now() + timedelta(minutes=15),
        )
        db.add(reset_record)
        db.commit()

        # Send through pluggable email sender
        email_sender = get_email_sender()
        email_sender.send_password_reset_email(to_email=user.email, reset_token=raw_token)

        log_audit_event(db, action="PASSWORD_RESET_REQUESTED", resource_type="User", resource_id=user.id)

    return MessageResponse(
        status="success",
        message="If an account exists for this email, recovery instructions will be provided.",
    )


def reset_password(db: Session, token: str, new_password: str) -> "MessageResponse":
    """
    Reset user password using single-use cryptographic token.
    Validates token hash, expiration, and password strength.
    """
    from app.schemas.auth import MessageResponse

    # 1. Enforce password complexity
    is_valid, msg = validate_password_strength(new_password)
    if not is_valid:
        raise GoWowAPIException(status_code=400, code="WEAK_PASSWORD", message=msg)

    # 2. Look up token by hash
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used_at.is_(None),
    ).first()

    if not reset_record or ensure_utc(reset_record.expires_at) < utc_now():
        raise UnauthorizedException("Invalid, expired, or already used password reset token.")

    # 3. Invalidate token (single-use)
    reset_record.used_at = utc_now()

    # 4. Update user password
    user = db.query(User).filter(User.id == reset_record.user_id, User.is_active == True).first()
    if not user:
        raise UnauthorizedException("User not found or account is deactivated.")

    user.password_hash = get_password_hash(new_password)
    user.updated_at = utc_now()

    # 5. Revoke all active refresh tokens for the user as security precaution
    revoke_user_refresh_tokens(db, user_id=user.id)
    db.commit()

    log_audit_event(db, action="PASSWORD_RESET_COMPLETED", resource_type="User", resource_id=user.id, actor_id=user.id)

    return MessageResponse(
        status="success",
        message="Your password has been successfully reset. You may now log in with your new password.",
    )


def admin_create_user(db: Session, user_data: AdminUserCreate, actor_id: str) -> UserResponse:
    """
    Admin-only user creation endpoint.
    Permits creating users with specific platform roles (ADMIN, EXAMINER, CANDIDATE).
    """
    is_valid, msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise GoWowAPIException(status_code=400, code="WEAK_PASSWORD", message=msg)

    existing_user = db.query(User).filter(User.email == user_data.email.lower().strip()).first()
    if existing_user:
        raise ValidationConflictException("An account with this email address already exists.")

    new_user = User(
        email=user_data.email.lower().strip(),
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name.strip(),
        last_name=user_data.last_name.strip(),
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    target_role_name = (user_data.role or RoleEnum.CANDIDATE.value).upper()
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

    log_audit_event(
        db,
        action="ADMIN_CREATE_USER",
        resource_type="User",
        resource_id=new_user.id,
        actor_id=actor_id,
        metadata={"role": role_name, "email": new_user.email},
    )

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        is_active=new_user.is_active,
        role=role_name,
        permissions=permissions,
        created_at=new_user.created_at,
        last_login=new_user.last_login,
    )
