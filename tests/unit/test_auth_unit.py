import pytest
from datetime import timedelta
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def test_password_hashing_and_verification():
    raw_pass = "CandidateSecure123!"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False


def test_access_token_creation_and_decoding():
    user_id = "user-uuid-1234"
    role = "CANDIDATE"
    permissions = ["exam:take", "result:view"]

    token = create_access_token(
        subject=user_id,
        role=role,
        permissions=permissions,
        expires_delta=timedelta(minutes=30),
    )
    assert isinstance(token, str)

    payload = decode_token(token)
    assert payload is not None
    assert payload.get("sub") == user_id
    assert payload.get("role") == role
    assert payload.get("permissions") == permissions
    assert payload.get("type") == "access"


def test_refresh_token_creation():
    user_id = "user-uuid-5678"
    token = create_refresh_token(subject=user_id)
    payload = decode_token(token)
    assert payload is not None
    assert payload.get("sub") == user_id
    assert payload.get("type") == "refresh"
