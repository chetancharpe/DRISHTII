import random
import string
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import EntityNotFoundException, GoWowAPIException, UnauthorizedException
from app.core.permissions import RoleEnum, get_permissions_for_role
from app.core.security import create_access_token, create_refresh_token, get_password_hash
from app.models.accessibility_profile import AccessibilityProfile
from app.models.candidate_access_pass import CandidateAccessPass
from app.models.refresh_token import RefreshToken
from app.models.role import Role, UserRole
from app.models.user import User
from app.schemas.auth import AuthUserResponse, TokenResponse
from app.schemas.candidate_pass import CandidateAccessPassCreate, CandidateAccessPassResponse
from app.services.audit_service import log_audit_event
from app.services.auth_service import get_user_role_and_permissions
from app.utils.datetime import utc_now


def _generate_pass_code(prefix: str = "DRISHTI-PASS-") -> str:
    """Generate a high-entropy, human-legible candidate access pass code."""
    num_part = "".join(random.choices(string.digits, k=4))
    char_part = "".join(random.choices(string.ascii_uppercase, k=2))
    return f"{prefix}{num_part}{char_part}"


def list_candidate_passes(db: Session, examiner_id: Optional[str] = None) -> List[CandidateAccessPassResponse]:
    """Retrieve all issued candidate access passes."""
    query = db.query(CandidateAccessPass)
    if examiner_id:
        query = query.filter(
            (CandidateAccessPass.examiner_id == examiner_id) | (CandidateAccessPass.examiner_id.is_(None))
        )
    passes = query.order_by(CandidateAccessPass.created_at.desc()).all()

    results = []
    for p in passes:
        resp = CandidateAccessPassResponse(
            id=p.id,
            pass_code=p.pass_code,
            candidate_id=p.candidate_id,
            candidate_name=p.candidate_name,
            candidate_email=p.candidate_email,
            is_active=p.is_active,
            accommodations=p.accommodations,
            created_at=p.created_at,
            expires_at=p.expires_at,
            last_used_at=p.last_used_at,
            quick_access_url=f"/auth/quick-access?code={p.pass_code}",
        )
        results.append(resp)
    return results


def create_candidate_pass(
    db: Session,
    data: CandidateAccessPassCreate,
    examiner_id: Optional[str] = None,
) -> CandidateAccessPassResponse:
    """
    Teacher/Examiner issues a unique access ID for a visually impaired candidate.
    Auto-provisions a candidate account if none exists with fully configured visual accommodations.
    """
    candidate_user: Optional[User] = None

    # 1. Resolve candidate by ID or Email
    if data.candidate_id:
        candidate_user = db.query(User).filter(User.id == data.candidate_id).first()

    email_candidate = data.candidate_email.strip().lower() if data.candidate_email else None
    if not candidate_user and email_candidate:
        candidate_user = db.query(User).filter(User.email == email_candidate).first()

    # 2. Auto-provision Candidate if not present
    if not candidate_user:
        cleaned_name = data.candidate_name.strip()
        parts = cleaned_name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else "Student"

        slug_name = "".join(c for c in first_name.lower() if c.isalnum())
        fallback_email = email_candidate or f"{slug_name}.{random.randint(100, 999)}@candidate.drishti.local"

        candidate_user = User(
            id=str(uuid.uuid4()),
            email=fallback_email,
            password_hash=get_password_hash(f"Pass@{uuid.uuid4().hex[:10]}!"),
            first_name=first_name,
            last_name=last_name,
            is_active=True,
        )
        db.add(candidate_user)
        db.flush()

        # Assign CANDIDATE role
        candidate_role = db.query(Role).filter(Role.name == RoleEnum.CANDIDATE.value).first()
        if candidate_role:
            user_role = UserRole(user_id=candidate_user.id, role_id=candidate_role.id)
            db.add(user_role)

        # Pre-seed visually-impaired accessibility profile
        profile = AccessibilityProfile(
            user_id=candidate_user.id,
            text_scale="large",
            contrast_mode="high",
            audio_assistance=True,
            screen_reader_mode=True,
            keyboard_navigation=True,
            theme="high_contrast",
            preferred_language="hi",
        )
        db.add(profile)
        db.flush()

    # 3. Formulate unique pass code
    pass_code = data.custom_pass_code.strip().upper() if data.custom_pass_code else None
    if pass_code:
        existing_code = db.query(CandidateAccessPass).filter(CandidateAccessPass.pass_code == pass_code).first()
        if existing_code:
            raise GoWowAPIException(
                status_code=400,
                code="PASS_CODE_EXISTS",
                message=f"Access code '{pass_code}' is already assigned. Please use another code.",
            )
    else:
        # Loop until unique code generated
        for _ in range(10):
            candidate_code = _generate_pass_code()
            if not db.query(CandidateAccessPass).filter(CandidateAccessPass.pass_code == candidate_code).first():
                pass_code = candidate_code
                break
        if not pass_code:
            pass_code = f"DRISHTI-PASS-{uuid.uuid4().hex[:8].upper()}"

    # 4. Save Pass Record
    access_pass = CandidateAccessPass(
        id=str(uuid.uuid4()),
        pass_code=pass_code,
        candidate_id=candidate_user.id,
        examiner_id=examiner_id,
        candidate_name=f"{candidate_user.first_name} {candidate_user.last_name}".strip(),
        candidate_email=candidate_user.email,
        is_active=True,
        accommodations=data.accommodations or "audio_assistance;high_contrast;screen_reader",
        created_at=utc_now(),
        expires_at=utc_now() + timedelta(days=90),
    )
    db.add(access_pass)
    db.commit()
    db.refresh(access_pass)

    log_audit_event(
        db,
        action="CANDIDATE_ACCESS_PASS_ISSUED",
        resource_type="CandidateAccessPass",
        resource_id=access_pass.id,
        actor_id=examiner_id or candidate_user.id,
    )

    return CandidateAccessPassResponse(
        id=access_pass.id,
        pass_code=access_pass.pass_code,
        candidate_id=access_pass.candidate_id,
        candidate_name=access_pass.candidate_name,
        candidate_email=access_pass.candidate_email,
        is_active=access_pass.is_active,
        accommodations=access_pass.accommodations,
        created_at=access_pass.created_at,
        expires_at=access_pass.expires_at,
        last_used_at=access_pass.last_used_at,
        quick_access_url=f"/auth/quick-access?code={access_pass.pass_code}",
    )


def revoke_candidate_pass(db: Session, pass_id: str, examiner_id: Optional[str] = None) -> bool:
    """Revoke or deactivate an access pass."""
    access_pass = db.query(CandidateAccessPass).filter(CandidateAccessPass.id == pass_id).first()
    if not access_pass:
        raise EntityNotFoundException("CandidateAccessPass", pass_id)

    access_pass.is_active = False
    db.commit()

    log_audit_event(
        db,
        action="CANDIDATE_ACCESS_PASS_REVOKED",
        resource_type="CandidateAccessPass",
        resource_id=pass_id,
        actor_id=examiner_id or "system",
    )
    return True


def authenticate_candidate_quick_access(db: Session, pass_code: str) -> TokenResponse:
    """
    Authenticate candidate directly using their Unique Pass ID (No password required).
    Empowers visually impaired candidates to enter immediately with full accessibility features active.
    """
    cleaned_code = pass_code.strip()
    if not cleaned_code:
        raise UnauthorizedException("Please provide a valid candidate access pass code.")

    # Match case-insensitively
    access_pass = (
        db.query(CandidateAccessPass)
        .filter(CandidateAccessPass.pass_code.ilike(cleaned_code))
        .first()
    )

    if not access_pass or not access_pass.is_active:
        raise UnauthorizedException(
            f"Invalid or inactive pass code '{cleaned_code}'. Please check with your teacher/examiner."
        )

    # Check expiry
    if access_pass.expires_at and access_pass.expires_at < utc_now():
        raise UnauthorizedException(
            "This access pass has expired. Please ask your examiner to issue an updated pass."
        )

    # Fetch user
    candidate_user = db.query(User).filter(User.id == access_pass.candidate_id).first()
    if not candidate_user or not candidate_user.is_active:
        raise UnauthorizedException("Associated candidate account is inactive or not found.")

    # Update telemetry
    access_pass.last_used_at = utc_now()
    candidate_user.last_login = utc_now()

    role_name, permissions = get_user_role_and_permissions(db, candidate_user.id)
    access_token = create_access_token(subject=candidate_user.id, role=role_name, permissions=permissions)

    jti = str(uuid.uuid4())
    refresh_token = create_refresh_token(subject=candidate_user.id, jti=jti)
    refresh_record = RefreshToken(
        jti=jti,
        user_id=candidate_user.id,
        expires_at=utc_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_record)
    db.commit()

    log_audit_event(
        db,
        action="CANDIDATE_QUICK_ACCESS_LOGIN",
        resource_type="User",
        resource_id=candidate_user.id,
        actor_id=candidate_user.id,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=AuthUserResponse(
            id=candidate_user.id,
            email=candidate_user.email,
            first_name=candidate_user.first_name,
            last_name=candidate_user.last_name,
            role=role_name,
            permissions=permissions,
            is_active=candidate_user.is_active,
        ),
    )
