"""
GoWow Demo Mode & Sample Data Seeder (Sections 101 & 102)
Initializes isolated, clearly labeled DEMO DATA for demonstrations, evaluation drills, and local testing.
Safeguards prevent accidental execution in production without explicit confirmation.
"""

import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.database import SessionLocal, engine
from app.db.base import Base
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.organization import Organization, UserOrganization
from app.models.exam import Exam, ExamStatus
from app.models.question import Question, QuestionType, QuestionDifficulty
from app.models.question_version import QuestionVersion
from app.models.exam_candidate import ExamCandidate, EligibilityStatus, AttemptStatus
from app.models.exam_session import ExamSession, SessionStatus
from app.models.exam_answer import ExamAnswer
from app.models.result import Result, ResultStatus
from app.models.accessibility_profile import AccessibilityProfile


def seed_demo_data(force: bool = False):
    if settings.ENVIRONMENT.lower() == "production" and not force:
        print("[CRITICAL SAFETY ERROR] Cannot seed demo data in PRODUCTION environment without --force flag!")
        sys.exit(1)

    print("=================================================================")
    print("  GoWow Initializing Isolated Demo Environment [DEMO DATA]       ")
    print("=================================================================")

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        now = datetime.now(timezone.utc)

        # 1. Seed Roles
        roles = {}
        for r_name in ["CANDIDATE", "EXAMINER", "ADMIN"]:
            role = db.query(Role).filter(Role.name == r_name).first()
            if not role:
                role = Role(name=r_name, description=f"{r_name} platform role")
                db.add(role)
                db.flush()
            roles[r_name] = role

        # 2. Seed Demo Organization
        demo_org = db.query(Organization).filter(Organization.name == "GoWow Inclusive Academy [DEMO]").first()
        if not demo_org:
            demo_org = Organization(
                name="GoWow Inclusive Academy [DEMO]",
                code="GOWOW-DEMO",
                is_active=True,
            )
            db.add(demo_org)
            db.flush()

        # 3. Seed Users
        def create_user_if_missing(email, password, fname, lname, role_name):
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    password_hash=get_password_hash(password),
                    first_name=fname,
                    last_name=lname,
                    is_active=True,
                )
                db.add(user)
                db.flush()

                user_role = UserRole(user_id=user.id, role_id=roles[role_name].id)
                db.add(user_role)

                user_org = UserOrganization(user_id=user.id, organization_id=demo_org.id, role="MEMBER")
                db.add(user_org)

                # Initialize accessibility profile for candidate
                if role_name == "CANDIDATE":
                    profile = AccessibilityProfile(
                        user_id=user.id,
                        text_scale="large",
                        contrast_mode="standard",
                        speech_rate=1.0,
                        preferred_language="en",
                    )
                    db.add(profile)

                db.flush()
            return user

        admin_user = create_user_if_missing(
            settings.DEV_ADMIN_EMAIL, settings.DEV_ADMIN_PASSWORD, "Demo", "Admin [DEMO]", "ADMIN"
        )
        examiner_user = create_user_if_missing(
            settings.DEV_EXAMINER_EMAIL, settings.DEV_EXAMINER_PASSWORD, "Demo", "Examiner [DEMO]", "EXAMINER"
        )
        candidate_user = create_user_if_missing(
            settings.DEV_CANDIDATE_EMAIL, settings.DEV_CANDIDATE_PASSWORD, "Demo", "Candidate [DEMO]", "CANDIDATE"
        )

        # 4. Seed Accessible Questions
        demo_questions = [
            {
                "text": "What is the primary function of the mitochondria in eukaryotic cells?",
                "options": [
                    {"id": "opt-1", "text": "Cellular respiration and ATP generation"},
                    {"id": "opt-2", "text": "Photosynthesis and glucose synthesis"},
                    {"id": "opt-3", "text": "Protein packaging in Golgi apparatus"},
                    {"id": "opt-4", "text": "Lipid degradation and waste filtration"},
                ],
                "correct": ["opt-1"],
                "subject": "Biology",
                "topic": "Cell Structure",
                "meta": {
                    "has_alt_text": True,
                    "has_accessible_formula": False,
                    "language": "en",
                },
            },
            {
                "text": "Evaluate the quadratic expression: $$f(x) = x^2 - 4x + 4$$ when $x = 3$.",
                "options": [
                    {"id": "opt-1", "text": "0"},
                    {"id": "opt-2", "text": "1"},
                    {"id": "opt-3", "text": "2"},
                    {"id": "opt-4", "text": "4"},
                ],
                "correct": ["opt-2"],
                "subject": "Mathematics",
                "topic": "Algebra",
                "meta": {
                    "has_alt_text": True,
                    "has_accessible_formula": True,
                    "formula_speech": "f of x equals x squared minus 4x plus 4",
                    "language": "en",
                },
            },
            {
                "text": "Which principle of WCAG ensures that user interface components must be operable without a mouse?",
                "options": [
                    {"id": "opt-1", "text": "Perceivable"},
                    {"id": "opt-2", "text": "Operable (Keyboard Accessible 2.1.1)"},
                    {"id": "opt-3", "text": "Understandable"},
                    {"id": "opt-4", "text": "Robust"},
                ],
                "correct": ["opt-2"],
                "subject": "Accessibility",
                "topic": "WCAG 2.1 Principles",
                "meta": {
                    "has_alt_text": True,
                    "has_accessible_formula": False,
                    "language": "en",
                },
            },
        ]

        question_entities = []
        for q_data in demo_questions:
            existing_q = db.query(Question).filter(Question.subject == q_data["subject"], Question.topic == q_data["topic"]).first()
            if not existing_q:
                q = Question(
                    question_type=QuestionType.MULTIPLE_CHOICE.value,
                    subject=q_data["subject"],
                    topic=q_data["topic"],
                    difficulty=QuestionDifficulty.MEDIUM.value,
                    language="en",
                    created_by=examiner_user.id,
                )
                db.add(q)
                db.flush()

                qv = QuestionVersion(
                    question_id=q.id,
                    version_number=1,
                    question_text=q_data["text"],
                    options=q_data["options"],
                    correct_answer=q_data["correct"],
                    explanation="Detailed accessible explanation for demo review.",
                    marks=1.0,
                    negative_marks=0.0,
                    accessibility_metadata=q_data["meta"],
                    created_by=examiner_user.id,
                )
                db.add(qv)
                db.flush()
                question_entities.append(q)
            else:
                question_entities.append(existing_q)

        # 5. Seed Demo Exam
        demo_exam = db.query(Exam).filter(Exam.title.like("%General Aptitude & Science%")).first()
        if not demo_exam:
            demo_exam = Exam(
                organization_id=demo_org.id,
                title="[DEMO DATA] General Aptitude & Inclusive Science Evaluation",
                description="Comprehensive test validating server-authoritative timer, keyboard hotkeys, and accessible TTS reading.",
                instructions="Use Alt+N for next question, Alt+P for previous, Alt+M to mark for review, and Alt+S to submit.",
                status=ExamStatus.LIVE.value,
                duration_seconds=3600,
                extra_time_seconds=1800, # Compensatory time
                start_at=now - timedelta(hours=1),
                end_at=now + timedelta(days=7),
                language="en",
                created_by=examiner_user.id,
                published_at=now,
            )
            db.add(demo_exam)
            db.flush()

            # Assign candidate
            assignment = ExamCandidate(
                exam_id=demo_exam.id,
                candidate_id=candidate_user.id,
                eligibility_status=EligibilityStatus.ELIGIBLE.value,
                attempt_status=AttemptStatus.COMPLETED.value,
            )
            db.add(assignment)
            db.flush()

            # Create Completed Session
            session = ExamSession(
                exam_id=demo_exam.id,
                candidate_id=candidate_user.id,
                status=SessionStatus.SUBMITTED.value,
                server_started_at=now - timedelta(minutes=45),
                server_expires_at=now + timedelta(minutes=15),
                submitted_at=now - timedelta(minutes=5),
            )
            db.add(session)
            db.flush()

            # Create Answers
            for q in question_entities:
                ans = ExamAnswer(
                    session_id=session.id,
                    question_id=q.id,
                    selected_answer="opt-1",
                    is_final=True,
                )
                db.add(ans)

            # Create Result
            result = Result(
                exam_id=demo_exam.id,
                candidate_id=candidate_user.id,
                session_id=session.id,
                score=2.0,
                maximum_score=3.0,
                percentage=66.7,
                correct_count=2,
                incorrect_count=1,
                unanswered_count=0,
                status=ResultStatus.PUBLISHED.value,
                published_at=now,
            )
            db.add(result)

        db.commit()
        print("\n[SUCCESS] Demo Environment Seeded Successfully!")
        print(f"  Demo Admin:     {settings.DEV_ADMIN_EMAIL} / {settings.DEV_ADMIN_PASSWORD}")
        print(f"  Demo Examiner:  {settings.DEV_EXAMINER_EMAIL} / {settings.DEV_EXAMINER_PASSWORD}")
        print(f"  Demo Candidate: {settings.DEV_CANDIDATE_EMAIL} / {settings.DEV_CANDIDATE_PASSWORD}")
        print(f"  Demo Exam ID:   {demo_exam.id if demo_exam else 'Created'}")
        print("=================================================================\n")

    except Exception as exc:
        db.rollback()
        print(f"[Seeder Error] {str(exc)}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    force_run = "--force" in sys.argv
    seed_demo_data(force=force_run)
