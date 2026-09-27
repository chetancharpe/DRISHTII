"""
GoWow Performance & Concurrency Simulation Suite
Implements Sections 71 & 72: Controlled simulation of concurrent candidate answer saving,
verifying server response latency, database session throughput, and error boundaries.
"""

import os
import sys

os.environ["ENVIRONMENT"] = "test"

import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.api.deps import get_db
from app.db.base import Base
from app.core.permissions import RoleEnum
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.exam import Exam, ExamStatus
from app.models.section import ExamSection, SectionQuestion
from app.models.question import Question, QuestionType, QuestionDifficulty
from app.models.question_version import QuestionVersion
from app.core.security import get_password_hash, create_access_token
from app.utils.datetime import utc_now


def run_concurrency_simulation(num_candidates: int = 15, requests_per_candidate: int = 4):
    """
    Executes concurrent simulated candidate sessions saving answers simultaneously.
    Measures latency metrics (p50, p95, max) and error rates.
    """
    db_file = os.path.abspath("gowow_perf_test.db")
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except OSError:
            pass

    engine = create_engine(
        f"sqlite:///{db_file}?timeout=30",
        connect_args={"check_same_thread": False},
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

    # Seed roles
    r_cand = Role(id="r-c", name=RoleEnum.CANDIDATE.value)
    db.add(r_cand)
    db.flush()

    # Seed exam
    exam = Exam(
        id="perf-exam-1",
        title="High Concurrency Assessment",
        status=ExamStatus.LIVE.value,
        duration_seconds=3600,
    )
    db.add(exam)
    db.flush()

    sec = ExamSection(id="perf-sec-1", exam_id=exam.id, title="Section 1", display_order=1)
    db.add(sec)
    db.flush()

    q = Question(
        id="perf-q-1",
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        subject="GK",
        topic="General",
        difficulty=QuestionDifficulty.EASY.value,
    )
    db.add(q)
    db.flush()

    qv = QuestionVersion(
        id="perf-qv-1",
        question_id=q.id,
        version_number=1,
        question_text="Accessible concurrency query prompt.",
        options=[{"id": "opt-1", "text": "A"}, {"id": "opt-2", "text": "B"}],
        correct_answer=["opt-1"],
        accessibility_metadata={"language": "en"},
    )
    db.add(qv)
    db.flush()

    sq = SectionQuestion(section_id=sec.id, question_id=q.id, question_version_id=qv.id, display_order=1)
    db.add(sq)

    # Seed candidate users and tokens
    tokens = []
    for i in range(num_candidates):
        cid = f"perf-cand-{i}"
        u = User(
            id=cid,
            email=f"candidate_{i}@example.com",
            password_hash=get_password_hash("PerfPass123!"),
            first_name=f"Candidate{i}",
            last_name="Test",
            is_active=True,
        )
        db.add(u)
        db.flush()
        db.add(UserRole(user_id=u.id, role_id=r_cand.id))
        token = create_access_token(subject=u.id, role=RoleEnum.CANDIDATE.value, permissions=["exam:take"])
        tokens.append((cid, token))

    db.commit()
    client = TestClient(app)

    # 1. Start sessions for all candidates
    sessions = {}
    for cid, tok in tokens:
        res = client.post("/api/v1/exams/perf-exam-1/sessions", headers={"Authorization": f"Bearer {tok}"})
        assert res.status_code in [200, 201], f"Failed to start session: {res.text}"
        sessions[cid] = (res.json()["id"], tok)

    latencies = []
    errors = 0

    def candidate_workflow(cand_id: str):
        sess_id, tok = sessions[cand_id]
        worker_latencies = []
        for step in range(requests_per_candidate):
            t0 = time.perf_counter()
            resp = client.patch(
                f"/api/v1/exam-sessions/{sess_id}/answers/perf-q-1",
                headers={"Authorization": f"Bearer {tok}"},
                json={"selected_answer": f"opt-{step % 2 + 1}", "version": step + 1},
            )
            elapsed = (time.perf_counter() - t0) * 1000  # ms
            if resp.status_code == 200:
                worker_latencies.append(elapsed)
            else:
                return False, worker_latencies, resp.text
        return True, worker_latencies, None

    tasks = []
    with ThreadPoolExecutor(max_workers=num_candidates) as executor:
        for cid in sessions.keys():
            tasks.append(executor.submit(candidate_workflow, cid))

        for f in as_completed(tasks):
            try:
                success, worker_lats, err_msg = f.result()
                latencies.extend(worker_lats)
                if not success:
                    errors += 1
                    print(f"Candidate error: {err_msg}")
            except Exception as e:
                errors += 1
                print(f"Exception in candidate thread: {e}")

    app.dependency_overrides.clear()
    db.close()

    total_requests = len(tasks)
    p50 = statistics.median(latencies) if latencies else 0
    p95 = statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else max(latencies or [0])
    max_lat = max(latencies or [0])

    print("\n--- Concurrency Simulation Results ---")
    print(f"Total Requests: {total_requests}")
    print(f"Successful Saves: {len(latencies)}")
    print(f"Errors: {errors} (Error rate: {errors / total_requests:.1%})")
    print(f"Latency P50: {p50:.2f} ms")
    print(f"Latency P95: {p95:.2f} ms")
    print(f"Latency Max: {max_lat:.2f} ms")

    assert errors == 0, f"Encountered {errors} concurrency save errors"
    assert p95 < 3000, f"P95 latency exceeded SLA of 3000ms for SQLite (got {p95:.2f}ms)"
    return True


if __name__ == "__main__":
    run_concurrency_simulation(num_candidates=15, requests_per_candidate=4)
