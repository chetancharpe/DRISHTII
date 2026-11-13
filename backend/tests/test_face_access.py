import os
import sys
import json

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.face_access_service import _DEMO_VECTOR, _generate_synthetic_seed_vector

client = TestClient(app)


def test_face_access_challenge_endpoint():
    """Test challenge creation returns anti-replay nonce, dynamic sequence, and bilingual instructions."""
    response = client.post("/api/v1/auth/face-access/challenge", json={"email": "candidate1@gowow.org"})
    assert response.status_code == 200
    data = response.json()
    assert "challenge_id" in data
    assert "nonce" in data
    assert "liveness_sequence" in data
    assert isinstance(data["liveness_sequence"], list)
    assert len(data["liveness_sequence"]) >= 3
    assert "instruction_en" in data
    assert "instruction_hi" in data
    assert data["expires_at"] > 0


def test_face_access_verify_matching_enrolled_identity():
    """Test verification succeeds when matching the registered candidate's enrolled biometric template."""
    ch_resp = client.post("/api/v1/auth/face-access/challenge", json={"email": "candidate1@gowow.org"})
    assert ch_resp.status_code == 200
    ch_data = ch_resp.json()

    # Pass the matching enrolled vector for candidate1@gowow.org
    verify_payload = {
        "challenge_id": ch_data["challenge_id"],
        "email": "candidate1@gowow.org",
        "biometric_token": json.dumps(_DEMO_VECTOR),
        "liveness_proof": "dynamic_trajectory_completed",
        "liveness_score": 0.95,
    }
    verify_resp = client.post("/api/v1/auth/face-access/verify", json=verify_payload)
    assert verify_resp.status_code == 200
    token_data = verify_resp.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["email"] == "candidate1@gowow.org"


def test_face_access_mismatched_identity_rejected():
    """Test verification strictly REJECTS a mismatched person or fake biometric vector."""
    ch_resp = client.post("/api/v1/auth/face-access/challenge", json={"email": "candidate1@gowow.org"})
    ch_data = ch_resp.json()

    # Completely different orthogonal vector (an imposter / random face)
    imposter_vector = _generate_synthetic_seed_vector("completely_different_imposter_face")
    verify_payload = {
        "challenge_id": ch_data["challenge_id"],
        "email": "candidate1@gowow.org",
        "biometric_token": json.dumps(imposter_vector),
        "liveness_proof": "dynamic_trajectory_completed",
        "liveness_score": 0.95,
    }
    verify_resp = client.post("/api/v1/auth/face-access/verify", json=verify_payload)
    # Must fail with 401 Unauthorized (Identity Mismatch)
    assert verify_resp.status_code == 401
    assert "mismatch" in verify_resp.json()["detail"].lower()


def test_face_access_low_liveness_rejected():
    """Verify that presentation attacks (static photo / low liveness score) are rejected."""
    ch_resp = client.post("/api/v1/auth/face-access/challenge", json={"email": "candidate1@gowow.org"})
    ch_data = ch_resp.json()

    verify_payload = {
        "challenge_id": ch_data["challenge_id"],
        "email": "candidate1@gowow.org",
        "biometric_token": json.dumps(_DEMO_VECTOR),
        "liveness_proof": "static_photo_no_yaw",
        "liveness_score": 0.45,  # Low score < 0.80
    }
    resp = client.post("/api/v1/auth/face-access/verify", json=verify_payload)
    assert resp.status_code == 401
    assert "liveness" in resp.json()["detail"].lower()


def test_face_access_unenrolled_account_rejected():
    """Verify that an account with no biometric enrollment cannot authenticate."""
    ch_resp = client.post("/api/v1/auth/face-access/challenge", json={"email": "examiner@gowow.org"})
    ch_data = ch_resp.json()

    verify_payload = {
        "challenge_id": ch_data["challenge_id"],
        "email": "examiner@gowow.org",
        "biometric_token": json.dumps(_DEMO_VECTOR),
        "liveness_proof": "steady_hold",
        "liveness_score": 0.95,
    }
    resp = client.post("/api/v1/auth/face-access/verify", json=verify_payload)
    assert resp.status_code == 401
    assert "enrolled" in resp.json()["detail"].lower()


def test_face_access_anti_replay_protection():
    """Verify that a challenge cannot be reused twice."""
    ch_resp = client.post("/api/v1/auth/face-access/challenge", json={"email": "candidate1@gowow.org"})
    ch_data = ch_resp.json()

    verify_payload = {
        "challenge_id": ch_data["challenge_id"],
        "email": "candidate1@gowow.org",
        "biometric_token": json.dumps(_DEMO_VECTOR),
        "liveness_proof": "dynamic_trajectory_completed",
        "liveness_score": 0.95,
    }

    # First attempt: succeeds
    resp1 = client.post("/api/v1/auth/face-access/verify", json=verify_payload)
    assert resp1.status_code == 200

    # Second attempt: rejected (anti-replay)
    resp2 = client.post("/api/v1/auth/face-access/verify", json=verify_payload)
    assert resp2.status_code == 401
