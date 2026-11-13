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
from app.schemas.candidate_pass import CandidateQuickAccessRequest
from app.schemas.face_access import (
    FaceAccessChallengeRequest,
    FaceAccessChallengeResponse,
    FaceAccessEnrollRequest,
    FaceAccessEnrollResponse,
    FaceAccessVerifyRequest,
)
from app.services.candidate_pass_service import authenticate_candidate_quick_access
from app.services.face_access_service import (
    create_face_access_challenge,
    enroll_face_access,
    get_face_access_status,
    revoke_face_access,
    verify_face_access,
)
from typing import Optional
from app.services.auth_service import (
    authenticate_user,
    get_user_role_and_permissions,
    refresh_user_token,
    register_user,
    request_password_reset,
    reset_password,
    revoke_user_refresh_tokens,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT access and refresh tokens."""
    return authenticate_user(db, login_data)


@router.post("/quick-access", response_model=TokenResponse)
def quick_access(data: CandidateQuickAccessRequest, db: Session = Depends(get_db)):
    """Authenticate candidate directly with Unique Access Pass ID (No password required)."""
    return authenticate_candidate_quick_access(db, data.pass_code)


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
def logout(
    data: Optional[RefreshTokenRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke refresh token(s) and conclude authenticated session."""
    revoke_user_refresh_tokens(
        db,
        user_id=current_user.id,
        refresh_token=data.refresh_token if data else None,
    )
    return None


# ============================================================================
# DRISHTI FACEACCESS AI (Accessible Biometric Authentication & Verification)
# ============================================================================

@router.post("/face-access/challenge", response_model=FaceAccessChallengeResponse)
def get_face_access_challenge(
    data: Optional[FaceAccessChallengeRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Generate an anti-replay challenge session for Drishti FaceAccess AI.
    Returns challenge ID, cryptographic nonce, randomized liveness action, and Hindi/English instructions.
    """
    email = data.email if data else None
    return create_face_access_challenge(db, email=email)


@router.post("/face-access/verify", response_model=TokenResponse)
def verify_face_access_route(
    data: FaceAccessVerifyRequest,
    db: Session = Depends(get_db),
):
    """
    Verifies FaceAccess AI alignment, liveness challenge, and biometric token.
    Issues JWT access and refresh tokens without requiring a password.
    """
    return verify_face_access(db, data)


@router.post("/face-access/enroll", response_model=FaceAccessEnrollResponse)
def enroll_face_access_route(
    data: FaceAccessEnrollRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Enrolls candidate's facial biometric template under informed consent.
    Hashes biometric vectors so raw video/images are never stored.
    """
    return enroll_face_access(
        db,
        user_id=current_user.id,
        biometric_token=data.biometric_token,
        consent_agreed=data.consent_agreed,
    )


@router.delete("/face-access")
def revoke_face_access_route(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Withdraws consent and permanently deletes all stored FaceAccess biometric templates.
    """
    return revoke_face_access(db, user_id=current_user.id)


@router.get("/face-access/status")
def check_face_access_status(
    current_user: User = Depends(get_current_user),
):
    """
    Check whether the candidate has FaceAccess AI biometric login enabled.
    """
    return get_face_access_status(user_id=current_user.id)


