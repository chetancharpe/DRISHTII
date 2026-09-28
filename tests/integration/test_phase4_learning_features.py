import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.api.deps import get_db
from app.db.base import Base
from app.core.permissions import RoleEnum
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.role import Role, UserRole


@pytest.fixture(scope="module")
def phase4_env():
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

    # Roles
    cand_role = Role(id="role-cnd", name=RoleEnum.CANDIDATE.value, description="Candidate")
    db.add(cand_role)

    # Candidate User
    cand_user = User(
        id="cand-p4-01",
        email="candidate.p4@test.com",
        password_hash=get_password_hash("ValidPass123!"),
        first_name="Priya",
        last_name="Sharma",
        is_active=True,
    )
    db.add(cand_user)
    db.commit()

    db.add(UserRole(user_id=cand_user.id, role_id=cand_role.id))
    db.commit()

    cand_token = create_access_token(
        subject=cand_user.id,
        role=RoleEnum.CANDIDATE.value,
    )

    client = TestClient(app)

    yield {
        "client": client,
        "cand_token": cand_token,
        "cand_user": cand_user,
        "db": db,
    }

    app.dependency_overrides.clear()


def test_audio_state_lifecycle_sleep_safe(phase4_env):
    """
    Test sleep-safe resume:
    1. Query initial audio state (returns defaults).
    2. Update audio position and add bookmarks.
    3. Re-query and verify state is safely persisted in DB.
    """
    client = phase4_env["client"]
    token = phase4_env["cand_token"]
    headers = {"Authorization": f"Bearer {token}"}
    topic_id = "percentages"

    # 1. Initial State
    res = client.get(f"/api/v1/learning/topics/{topic_id}/audio-state", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["topic_id"] == topic_id
    assert data["audio_position_seconds"] == 0.0
    assert data["audio_completed"] is False
    assert data["audio_bookmarks"] == []
    assert data["audio_playback_speed"] == 1.0

    # 2. Update State (simulating candidate pausing at 2m 14s with bookmark)
    update_payload = {
        "audio_position_seconds": 134.5,
        "audio_completed": False,
        "audio_bookmarks": [
            {
                "id": "bm-1",
                "timestamp_seconds": 75.0,
                "label": "Formula derivation",
                "created_at": "2026-09-28T18:40:00Z",
            }
        ],
        "audio_playback_speed": 1.25,
    }
    put_res = client.put(f"/api/v1/learning/topics/{topic_id}/audio-state", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    saved = put_res.json()
    assert saved["audio_position_seconds"] == 134.5
    assert len(saved["audio_bookmarks"]) == 1
    assert saved["audio_bookmarks"][0]["label"] == "Formula derivation"
    assert saved["audio_playback_speed"] == 1.25

    # 3. Sleep-Safe Verification (re-query as if page reloaded)
    verify_res = client.get(f"/api/v1/learning/topics/{topic_id}/audio-state", headers=headers)
    assert verify_res.status_code == 200
    verified = verify_res.json()
    assert verified["audio_position_seconds"] == 134.5
    assert verified["audio_playback_speed"] == 1.25
    assert len(verified["audio_bookmarks"]) == 1
    assert verified["audio_bookmarks"][0]["label"] == "Formula derivation"
