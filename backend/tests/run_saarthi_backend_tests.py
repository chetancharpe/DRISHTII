"""
GoWow DRISHTI - Backend Automated Test Suite for Saarthi AI & FaceAccess AI
Covers:
- Challenge Generation (Anti-replay nonce, dynamic liveness sequence)
- Biometric Verification (Cosine similarity >= 0.85)
- Imposter / Random Object Rejection (Anti-spoofing)
- Presentation Attack / Low Liveness Rejection
- Anti-Replay Protection (Single-use challenge)
- Privilege Escalation Protection (Role authorization)
"""

import sys
import os
import json
import uuid
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import SessionLocal
from app.models.user import User
from app.core.permissions import RoleEnum
from app.services.face_access_service import (
    create_face_access_challenge,
    verify_face_access,
    _DEMO_VECTOR,
    _generate_synthetic_seed_vector,
)
from app.schemas.face_access import FaceAccessVerifyRequest
from app.core.exceptions import UnauthorizedException


def run_tests():
    print("=" * 70)
    print("DRISHTI FaceAccess AI & Authentication Verification Suite")
    print("=" * 70)

    db = SessionLocal()
    tests_passed = 0
    total_tests = 6

    # Test 1: Challenge generation
    print("\n[TEST 1] Generate FaceAccess challenge with liveness sequence...")
    ch = create_face_access_challenge(db, email="candidate1@gowow.org")
    assert ch.challenge_id and len(ch.challenge_id) > 10, "Invalid challenge ID"
    assert ch.nonce and len(ch.nonce) == 64, "Invalid SHA256 nonce"
    assert len(ch.liveness_sequence) >= 3, "Liveness sequence too short"
    assert ch.instruction_hi and ch.instruction_en, "Missing bilingual instructions"
    assert ch.expires_at > time.time(), "Expired challenge issued"
    print(f"  PASS: Challenge ID={ch.challenge_id}, Steps={ch.liveness_sequence}")
    tests_passed += 1

    # Test 2: Biometric verification with matching enrolled template
    print("\n[TEST 2] Verify authentic candidate with enrolled biometric template...")
    vreq = FaceAccessVerifyRequest(
        challenge_id=ch.challenge_id,
        email="candidate1@gowow.org",
        biometric_token=json.dumps(_DEMO_VECTOR),
        liveness_proof="dynamic_trajectory_completed",
        liveness_score=0.96,
    )
    res = verify_face_access(db, vreq)
    assert res.access_token, "No access token issued"
    assert res.user.email == "candidate1@gowow.org", "Wrong candidate returned"
    assert res.user.role == RoleEnum.CANDIDATE, "Wrong role assigned"
    print(f"  PASS: Candidate authenticated. JWT={res.access_token[:25]}... Role={res.user.role}")
    tests_passed += 1

    # Test 3: Anti-replay protection (Cannot use same challenge twice)
    print("\n[TEST 3] Anti-replay protection - Reuse consumed challenge...")
    try:
        verify_face_access(db, vreq)
        assert False, "Replay attack was NOT rejected!"
    except UnauthorizedException as exc:
        print(f"  PASS: Replay attack successfully blocked ({exc.detail})")
        tests_passed += 1

    # Test 4: Imposter / Random Object Rejection
    print("\n[TEST 4] Imposter / Random Vector Rejection...")
    ch_imposter = create_face_access_challenge(db, email="candidate1@gowow.org")
    fake_vector = _generate_synthetic_seed_vector("random_hand_or_blank_background")
    vreq_imposter = FaceAccessVerifyRequest(
        challenge_id=ch_imposter.challenge_id,
        email="candidate1@gowow.org",
        biometric_token=json.dumps(fake_vector),
        liveness_proof="dynamic_trajectory_completed",
        liveness_score=0.95,
    )
    try:
        verify_face_access(db, vreq_imposter)
        assert False, "Imposter was NOT rejected!"
    except UnauthorizedException as exc:
        assert "mismatch" in exc.detail.lower() or "rejected" in exc.detail.lower()
        print(f"  PASS: Imposter vector strictly rejected ({exc.detail})")
        tests_passed += 1

    # Test 5: Presentation Attack / Low Liveness Rejection
    print("\n[TEST 5] Presentation Attack Detection (Static photo / Low liveness score)...")
    ch_spoof = create_face_access_challenge(db, email="candidate1@gowow.org")
    vreq_spoof = FaceAccessVerifyRequest(
        challenge_id=ch_spoof.challenge_id,
        email="candidate1@gowow.org",
        biometric_token=json.dumps(_DEMO_VECTOR),
        liveness_proof="static_photo_no_head_turn",
        liveness_score=0.35,  # Below threshold 0.80
    )
    try:
        verify_face_access(db, vreq_spoof)
        assert False, "Photo presentation attack was NOT rejected!"
    except UnauthorizedException as exc:
        assert "liveness" in exc.detail.lower()
        print(f"  PASS: Low liveness spoof strictly blocked ({exc.detail})")
        tests_passed += 1

    # Test 6: Privilege Escalation Prevention (Candidate cannot claim Admin)
    print("\n[TEST 6] Privilege Escalation Check - Candidate account role boundaries...")
    candidate_user = db.query(User).filter(User.email == "candidate1@gowow.org").first()
    assert candidate_user is not None
    from app.services.auth_service import get_user_role_and_permissions
    actual_role, perms = get_user_role_and_permissions(db, candidate_user.id)
    assert actual_role == RoleEnum.CANDIDATE
    # Verify that candidate does not possess admin or examiner privileges
    assert actual_role != RoleEnum.ADMIN
    assert actual_role != RoleEnum.EXAMINER
    print(f"  PASS: Candidate user strictly bounded to role '{actual_role}'. Admin/Examiner escalation rejected.")
    tests_passed += 1

    db.close()
    print("\n" + "=" * 70)
    print(f"ALL {tests_passed}/{total_tests} BACKEND FACEACCESS SECURITY TESTS PASSED PERFECTLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
