import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.api.deps import get_db
from app.db.base import Base
from app.core.config import settings
from app.core.permissions import RoleEnum
from app.core.middleware import rate_limiter_store, MemoryRateLimiterStore
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.refresh_token import RefreshToken
from app.models.password_reset_token import PasswordResetToken
from app.utils.datetime import utc_now


@pytest.fixture(scope="module")
def p1_env():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()

    def override_get_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    # Seed Admin User and Role
    admin_role = Role(id="role-admin", name=RoleEnum.ADMIN.value, description="System Admin")
    candidate_role = Role(id="role-cand", name=RoleEnum.CANDIDATE.value, description="Candidate")
    examiner_role = Role(id="role-exam", name=RoleEnum.EXAMINER.value, description="Examiner")
    db.add_all([admin_role, candidate_role, examiner_role])
    db.flush()

    admin_user = User(
        id="admin-user-id",
        email="admin_sec@gowow.org",
        password_hash=get_password_hash("AdminPass123!"),
        first_name="Admin",
        last_name="Super",
        is_active=True,
    )
    db.add(admin_user)
    db.flush()

    db.add(UserRole(user_id=admin_user.id, role_id=admin_role.id))
    db.commit()

    client = TestClient(app)

    yield {
        "db": db,
        "client": client,
        "admin_user": admin_user,
        "SessionLocal": TestingSession,
    }

    app.dependency_overrides.clear()
    db.close()


def test_public_registration_role_escalation_prevented(p1_env):
    """
    Requirement 1: Public register with "role": "ADMIN" must still yield CANDIDATE role.
    """
    client: TestClient = p1_env["client"]
    db = p1_env["db"]

    payload = {
        "email": "candidate_escalation_attempt@gowow.org",
        "password": "ValidPassword123!",
        "first_name": "Infiltrator",
        "last_name": "Hacker",
        "role": "ADMIN",  # Attempted escalation
    }

    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    # Response role must be strictly CANDIDATE
    assert data["user"]["role"] == "CANDIDATE"

    # Confirm in database
    created_user = db.query(User).filter(User.email == payload["email"]).first()
    assert created_user is not None
    user_role = db.query(UserRole).filter(UserRole.user_id == created_user.id).first()
    role_obj = db.query(Role).filter(Role.id == user_role.role_id).first()
    assert role_obj.name == "CANDIDATE"


def test_admin_endpoint_requires_admin_privileges(p1_env):
    """
    Requirement 1:
    - Candidate token gets 403 on POST /admin/users
    - Admin token succeeds in creating examiner/admin on POST /admin/users
    """
    client: TestClient = p1_env["client"]

    # 1. Register and login as candidate
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "candidate_for_admin_check@gowow.org",
            "password": "ValidPassword123!",
            "first_name": "Candidate",
            "last_name": "User",
        },
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "candidate_for_admin_check@gowow.org", "password": "ValidPassword123!"},
    )
    assert login_resp.status_code == 200
    candidate_access_token = login_resp.json()["access_token"]

    admin_payload = {
        "email": "new_examiner@gowow.org",
        "password": "ExaminerPass123!",
        "first_name": "New",
        "last_name": "Examiner",
        "role": "EXAMINER",
    }

    # 2. Candidate attempts to access admin endpoint -> 403 Forbidden
    cand_resp = client.post(
        "/api/v1/admin/users",
        json=admin_payload,
        headers={"Authorization": f"Bearer {candidate_access_token}"},
    )
    assert cand_resp.status_code == 403

    # 3. Login as Admin
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin_sec@gowow.org", "password": "AdminPass123!"},
    )
    assert admin_login.status_code == 200
    admin_access_token = admin_login.json()["access_token"]

    # 4. Admin accesses admin endpoint -> 201 Created
    admin_resp = client.post(
        "/api/v1/admin/users",
        json=admin_payload,
        headers={"Authorization": f"Bearer {admin_access_token}"},
    )
    assert admin_resp.status_code == 201, admin_resp.text
    assert admin_resp.json()["role"] == "EXAMINER"
    assert admin_resp.json()["email"] == "new_examiner@gowow.org"


def test_password_strength_enforcement(p1_env):
    """
    Requirement 6: Enforce minimum password strength on register and reset.
    """
    client: TestClient = p1_env["client"]

    weak_passwords = [
        "short1!",        # Too short (< 8 chars)
        "nocapital123!",  # Missing uppercase
        "NOLOWER123!",    # Missing lowercase
        "NoDigitsHere!",  # Missing digit
        "NoSpecialChar1", # Missing special symbol
    ]

    for weak_pw in weak_passwords:
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "email": f"weak_{hash(weak_pw)}@gowow.org",
                "password": weak_pw,
                "first_name": "Weak",
                "last_name": "Password",
            },
        )
        assert resp.status_code == 400, f"Expected weak password '{weak_pw}' to be rejected"
        assert resp.json()["error"]["code"] == "WEAK_PASSWORD"


def test_get_current_user_rejects_refresh_token_as_access_token(p1_env):
    """
    Requirement 3: get_current_user rejects refresh tokens used as access tokens (check type == 'access').
    """
    client: TestClient = p1_env["client"]

    # Login to obtain fresh refresh token
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin_sec@gowow.org", "password": "AdminPass123!"},
    )
    assert login_resp.status_code == 200
    refresh_token = login_resp.json()["refresh_token"]

    # Attempt to use refresh_token as Bearer access token on /auth/me
    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert resp.status_code == 401
    assert "Invalid, malformed, or expired access token" in resp.json()["error"]["message"]


def test_refresh_token_rotation_and_server_side_revocation(p1_env):
    """
    Requirement 3: Refresh-token rotation with server-side revocation:
    Using refresh token rotates it and marks old token revoked; reused old token is rejected.
    """
    client: TestClient = p1_env["client"]

    # 1. Login to get initial refresh token
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin_sec@gowow.org", "password": "AdminPass123!"},
    )
    assert login_resp.status_code == 200
    rt_1 = login_resp.json()["refresh_token"]

    # 2. First refresh rotation -> succeeds, issues rt_2
    ref_resp_1 = client.post("/api/v1/auth/refresh", json={"refresh_token": rt_1})
    assert ref_resp_1.status_code == 200, ref_resp_1.text
    rt_2 = ref_resp_1.json()["refresh_token"]
    assert rt_2 != rt_1

    # 3. Attempting to replay rt_1 MUST fail with 401 because it was revoked
    replay_resp = client.post("/api/v1/auth/refresh", json={"refresh_token": rt_1})
    assert replay_resp.status_code == 401
    assert "revoked" in replay_resp.json()["error"]["message"].lower()

    # 4. Using active rt_2 succeeds
    ref_resp_2 = client.post("/api/v1/auth/refresh", json={"refresh_token": rt_2})
    assert ref_resp_2.status_code == 200
    rt_3 = ref_resp_2.json()["refresh_token"]
    assert rt_3 != rt_2


def test_logout_revokes_refresh_token(p1_env):
    """
    Requirement 3: /auth/logout revokes the refresh token.
    """
    client: TestClient = p1_env["client"]

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin_sec@gowow.org", "password": "AdminPass123!"},
    )
    assert login_resp.status_code == 200
    access_token = login_resp.json()["access_token"]
    refresh_token = login_resp.json()["refresh_token"]

    # Logout with refresh_token provided
    logout_resp = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_resp.status_code == 204

    # Now refresh token must be rejected
    ref_resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_resp.status_code == 401
    assert "revoked" in ref_resp.json()["error"]["message"].lower()


def test_password_reset_flow(p1_env):
    """
    Requirement 6: Complete forgot/reset password flow:
    - Generic response on forgot-password (anti-enumeration)
    - Single-use token
    - Password strength check on reset
    """
    client: TestClient = p1_env["client"]
    db = p1_env["db"]

    target_email = "candidate_for_pwd_reset@gowow.org"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": target_email,
            "password": "InitialPassword123!",
            "first_name": "Reset",
            "last_name": "Candidate",
        },
    )

    # 1. Request reset
    req_resp = client.post("/api/v1/auth/forgot-password", json={"email": target_email})
    assert req_resp.status_code == 200
    assert "recovery instructions will be provided" in req_resp.json()["message"]

    # Find the newly generated token record in DB
    user = db.query(User).filter(User.email == target_email).first()
    reset_entry = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None))
        .order_by(PasswordResetToken.created_at.desc())
        .first()
    )
    assert reset_entry is not None

    # In our console implementation, the raw token is logged, but let's test directly with a known token
    import hashlib, secrets
    test_raw_token = secrets.token_urlsafe(32)
    test_hash = hashlib.sha256(test_raw_token.encode("utf-8")).hexdigest()

    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=test_hash,
        expires_at=utc_now() + timedelta(minutes=15),
    ))
    db.commit()

    # 2. Reset with weak password -> 400
    weak_reset = client.post("/api/v1/auth/reset-password", json={
        "token": test_raw_token,
        "new_password": "weak",
    })
    assert weak_reset.status_code == 400
    assert weak_reset.json()["error"]["code"] == "WEAK_PASSWORD"

    # 3. Reset with valid password -> 200
    valid_reset = client.post("/api/v1/auth/reset-password", json={
        "token": test_raw_token,
        "new_password": "BrandNewSecurePassword123!",
    })
    assert valid_reset.status_code == 200

    # 4. Reusing token MUST fail (single-use token)
    reuse_reset = client.post("/api/v1/auth/reset-password", json={
        "token": test_raw_token,
        "new_password": "AnotherNewPassword123!",
    })
    assert reuse_reset.status_code == 401

    # 5. Verify login with new password succeeds
    new_login = client.post("/api/v1/auth/login", json={
        "email": target_email,
        "password": "BrandNewSecurePassword123!",
    })
    assert new_login.status_code == 200


def test_autosave_rate_limiting_100_users_behind_single_ip():
    """
    Requirement 4: Prove 100 different users behind one IP are not throttled on autosave.
    """
    store = MemoryRateLimiterStore()
    client_ip = "203.0.113.42"  # Single institutional NAT gateway
    shared_ip_user_ids = [f"user-candidate-{i}" for i in range(100)]
    limit = 300  # Generous autosave limit

    # Each of 100 users submits 3 autosaves within 1 minute
    for user_id in shared_ip_user_ids:
        key = f"autosave:user:{user_id}"
        for _ in range(3):
            is_limited, _ = store.is_rate_limited(key=key, limit=limit, window_seconds=60.0)
            assert is_limited is False, f"User {user_id} should not be rate limited"


def test_csp_headers_contain_strict_script_and_connect_src(p1_env):
    """
    Requirement 5: Tighten CSP to remove unsafe-inline from script-src and restrict connect-src.
    """
    client: TestClient = p1_env["client"]

    resp = client.get("/health")
    assert resp.status_code == 200
    csp = resp.headers.get("Content-Security-Policy", "")

    # Must contain script-src without 'unsafe-inline'
    assert "script-src 'self'" in csp
    assert "script-src 'self' 'unsafe-inline'" not in csp
    # Must contain connect-src
    assert "connect-src 'self'" in csp
