from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    AuthUserResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.services.auth_service import (
    authenticate_user,
    get_user_role_and_permissions,
    refresh_user_token,
    register_user,
    request_password_reset,
    reset_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT access and refresh tokens."""
    return authenticate_user(db, login_data)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(register_data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new candidate or examiner account."""
    return register_user(db, register_data)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Rotate JWT access token using a valid refresh token."""
    return refresh_user_token(db, data.refresh_token)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request password reset instructions.
    Uses generic response to prevent account enumeration attacks (Sections 19 & 20).
    """
    return request_password_reset(db, data.email)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password_route(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset user password using single-use cryptographic token.
    """
    return reset_password(db, data.token, data.new_password)


@router.get("/me", response_model=AuthUserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve currently authenticated user profile with verified role and permissions."""
    role_name, permissions = get_user_role_and_permissions(db, current_user.id)
    return AuthUserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=role_name,
        permissions=permissions,
        is_active=current_user.is_active,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(current_user: User = Depends(get_current_user)):
    """Stateless logout confirmation endpoint."""
    return None

