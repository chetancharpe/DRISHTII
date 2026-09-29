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
from app.models.section import ExamSection, SectionQuestion


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
                description="GoWow Demo Organization Tenant",
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

                user_org = UserOrganization(user_id=user.id, organization_id=demo_org.id, role_in_org="MEMBER")
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

        # 5. Seed Questions with Accessibility Metadata
        more_questions = [
            {
                "text": "Select the word that is most nearly OPPOSITE in meaning to 'CANDID':",
                "options": [
                    {"id": "opt-1-a", "text": "Outspoken and straightforward"},
                    {"id": "opt-1-b", "text": "Evasive and guarded"},
                    {"id": "opt-1-c", "text": "Impartial and objective"},
                    {"id": "opt-1-d", "text": "Genuine and sincere"},
                ],
                "correct": ["opt-1-b"],
                "subject": "English",
                "topic": "Vocabulary & Antonyms",
                "meta": {"has_alt_text": True, "has_accessible_formula": False, "language": "en"},
            },
            {
                "text": "Identify the grammatically complete and accurate sentence from the options below:",
                "options": [
                    {"id": "opt-2-a", "text": "Neither the candidate nor the invigilators was aware of the delay."},
                    {"id": "opt-2-b", "text": "Neither the candidate nor the invigilators were aware of the delay."},
                    {"id": "opt-2-c", "text": "Neither the candidate or the invigilators were aware of the delay."},
                    {"id": "opt-2-d", "text": "Neither the candidate nor the invigilators had been unaware about the delay."},
                ],
                "correct": ["opt-2-b"],
                "subject": "English",
                "topic": "Grammar & Subject-Verb Agreement",
                "meta": {"has_alt_text": True, "has_accessible_formula": False, "language": "en"},
            },
            {
                "text": "If the price of an essential commodity increases by 25%, by what percentage must consumption decrease to keep expenditure constant?",
                "options": [
                    {"id": "opt-3-a", "text": "15%"},
                    {"id": "opt-3-b", "text": "20%"},
                    {"id": "opt-3-c", "text": "25%"},
                    {"id": "opt-3-d", "text": "33.33%"},
                ],
                "correct": ["opt-3-b"],
                "subject": "Mathematics",
                "topic": "Percentages",
                "meta": {
                    "has_alt_text": True,
                    "has_accessible_formula": True,
                    "formula_speech": "Reduction percentage equals r divided by open parenthesis 100 plus r close parenthesis multiplied by 100",
                    "language": "en",
                },
            },
            {
                "text": "Two pipes A and B can independently fill a water reservoir in 20 minutes and 30 minutes respectively. In how many minutes will both fill it together?",
                "options": [
                    {"id": "opt-4-a", "text": "10 minutes"},
                    {"id": "opt-4-b", "text": "12 minutes"},
                    {"id": "opt-4-c", "text": "15 minutes"},
                    {"id": "opt-4-d", "text": "25 minutes"},
                ],
                "correct": ["opt-4-b"],
                "subject": "Mathematics",
                "topic": "Time and Work",
                "meta": {"has_alt_text": True, "has_accessible_formula": False, "language": "en"},
            },
            {
                "text": "Which Article of the Constitution of India guarantees the Right to Constitutional Remedies (empowering citizens to approach the Supreme Court)?",
                "options": [
                    {"id": "opt-5-a", "text": "Article 19"},
                    {"id": "opt-5-b", "text": "Article 21"},
                    {"id": "opt-5-c", "text": "Article 32"},
                    {"id": "opt-5-d", "text": "Article 44"},
                ],
                "correct": ["opt-5-c"],
                "subject": "General Knowledge",
                "topic": "Indian Polity & Constitution",
                "meta": {"has_alt_text": True, "has_accessible_formula": False, "language": "en"},
            },
            {
                "text": "Which statutory body in India is constitutionally mandated to superintend, direct, and control elections to Parliament and State Legislatures?",
                "options": [
                    {"id": "opt-6-a", "text": "Union Public Service Commission"},
                    {"id": "opt-6-b", "text": "Election Commission of India"},
                    {"id": "opt-6-c", "text": "National Human Rights Commission"},
                    {"id": "opt-6-d", "text": "Law Commission of India"},
                ],
                "correct": ["opt-6-b"],
                "subject": "General Knowledge",
                "topic": "Constitutional Bodies",
                "meta": {"has_alt_text": True, "has_accessible_formula": False, "language": "en"},
            },
        ]

        all_seeded_questions = []
        for q_data in demo_questions + more_questions:
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
                    explanation="Authoritative accessible explanation for candidate review.",
                    marks=2.0,
                    negative_marks=0.66,
                    accessibility_metadata=q_data["meta"],
                    created_by=examiner_user.id,
                )
                db.add(qv)
                db.flush()
                all_seeded_questions.append((q, qv))
            else:
                latest_qv = db.query(QuestionVersion).filter(QuestionVersion.question_id == existing_q.id).order_by(QuestionVersion.version_number.desc()).first()
                all_seeded_questions.append((existing_q, latest_qv))

        # 6. Seed Active Live Examination with Sections
        live_exam = db.query(Exam).filter(Exam.title.like("%Accessible Aptitude Examination%")).first()
        if not live_exam:
            live_exam = Exam(
                id="demo-exam-01",
                organization_id=demo_org.id,
                title="GoWow Accessible Aptitude Examination — 2026",
                description="Standardized institutional demonstration examination evaluating verbal reasoning, numerical competence, and civic knowledge under strict candidate-first accessibility standards.",
                instructions="Total duration is 45 minutes across 3 sections. Marking scheme: +2.0 marks for correct answers, -0.66 marks penalty for incorrect answers. Unanswered questions receive 0 marks. Use keyboard shortcuts (N for next, P for prev, 1-4 for options, M for review, S for submit).",
                status=ExamStatus.LIVE.value,
                duration_seconds=2700,  # 45 mins
                extra_time_seconds=900,  # 15 mins extra
                start_at=now - timedelta(hours=2),
                end_at=now + timedelta(days=14),
                language="en",
                created_by=examiner_user.id,
                published_at=now - timedelta(hours=2),
            )
            db.add(live_exam)
            db.flush()

            # Assign candidate as ELIGIBLE and NOT_ATTEMPTED with 1.5x PwD accommodation multiplier
            cand_live_assign = ExamCandidate(
                exam_id=live_exam.id,
                candidate_id=candidate_user.id,
                eligibility_status=EligibilityStatus.ELIGIBLE.value,
                attempt_status=AttemptStatus.NOT_ATTEMPTED.value,
                time_multiplier=1.5,
            )
            db.add(cand_live_assign)
            db.flush()

            # Create 3 sections
            sec_vrc = ExamSection(
                id="sec-vrc",
                exam_id=live_exam.id,
                title="Verbal Reasoning & Comprehension",
                description="Critical analysis of textual passages, vocabulary discernment, and logical deduction.",
                display_order=1,
                duration_seconds=900,
                navigation_policy="FREE",
                question_count=2,
            )
            sec_qps = ExamSection(
                id="sec-qps",
                exam_id=live_exam.id,
                title="Quantitative Problem Solving",
                description="Mathematical problem solving, percentage distributions, ratios, and algebraic logic.",
                display_order=2,
                duration_seconds=900,
                navigation_policy="FREE",
                question_count=2,
            )
            sec_gia = ExamSection(
                id="sec-gia",
                exam_id=live_exam.id,
                title="General & Institutional Awareness",
                description="Constitutional law, democratic institutions, science and technology, and public policy.",
                display_order=3,
                duration_seconds=900,
                navigation_policy="FREE",
                question_count=2,
            )
            db.add_all([sec_vrc, sec_qps, sec_gia])
            db.flush()

            # Map questions to sections
            for idx, (q, qv) in enumerate(all_seeded_questions[:2]):
                sq = SectionQuestion(
                    section_id=sec_vrc.id,
                    question_id=q.id,
                    question_version_id=qv.id,
                    display_order=idx + 1,
                )
                db.add(sq)

            for idx, (q, qv) in enumerate(all_seeded_questions[2:4]):
                sq = SectionQuestion(
                    section_id=sec_qps.id,
                    question_id=q.id,
                    question_version_id=qv.id,
                    display_order=idx + 1,
                )
                db.add(sq)

            for idx, (q, qv) in enumerate(all_seeded_questions[4:6]):
                sq = SectionQuestion(
                    section_id=sec_gia.id,
                    question_id=q.id,
                    question_version_id=qv.id,
                    display_order=idx + 1,
                )
                db.add(sq)
            db.flush()

        # 7. Seed Past Completed Exam
        demo_exam = db.query(Exam).filter(Exam.title.like("%General Aptitude & Science%")).first()
        if not demo_exam:
            demo_exam = Exam(
                organization_id=demo_org.id,
                title="[DEMO DATA] General Aptitude & Inclusive Science Evaluation",
                description="Comprehensive test validating server-authoritative timer, keyboard hotkeys, and accessible TTS reading.",
                instructions="Use Alt+N for next question, Alt+P for previous, Alt+M to mark for review, and Alt+S to submit.",
                status=ExamStatus.LIVE.value,
                duration_seconds=3600,
                extra_time_seconds=1800,
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
            for q, _ in all_seeded_questions[:3]:
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
            db.flush()

        # 6. Seed Topic Progress for Candidate
        from app.models.learning_profile import TopicProgress, LearningActivity
        from app.models.audit_log import AuditLog

        demo_progress = [
            ("Mathematics", "Percentages", 15, 11, 4, 73.3),
            ("Reasoning Ability", "Coding & Decoding", 12, 10, 2, 83.3),
            ("English Language", "Reading Comprehension", 10, 7, 3, 70.0),
            ("General Knowledge", "Current Affairs", 10, 5, 5, 50.0),
        ]
        for subj, topic, att, corr, incorr, acc in demo_progress:
            tp = db.query(TopicProgress).filter(
                TopicProgress.user_id == candidate_user.id,
                TopicProgress.subject == subj,
                TopicProgress.topic == topic,
            ).first()
            if not tp:
                tp = TopicProgress(
                    user_id=candidate_user.id,
                    subject=subj,
                    topic=topic,
                    questions_attempted=att,
                    correct_answers=corr,
                    incorrect_answers=incorr,
                    accuracy=acc,
                    average_time_seconds=24.5,
                    last_practiced=now - timedelta(days=1),
                )
                db.add(tp)

        # 7. Seed Learning Activities
        demo_activities = [
            ("practice_completed", "Completed English Practice", 480, now - timedelta(hours=3)),
            ("mock_completed", "Finished Reasoning Mock Test", 1800, now - timedelta(days=1)),
            ("practice_completed", "Practiced 20 GK questions", 600, now - timedelta(days=3)),
            ("lesson_completed", "Reviewed Mathematics results", 300, now - timedelta(days=4)),
        ]
        for act_type, title, dur, ts in demo_activities:
            act = db.query(LearningActivity).filter(
                LearningActivity.user_id == candidate_user.id,
                LearningActivity.activity_type == act_type,
                LearningActivity.timestamp == ts,
            ).first()
            if not act:
                act = LearningActivity(
                    user_id=candidate_user.id,
                    activity_type=act_type,
                    duration_seconds=dur,
                    timestamp=ts,
                    metadata_json={"title": title},
                )
                db.add(act)

        # 8. Seed Audit Logs for Admin
        demo_audit_logs = [
            ("EXAM_PUBLISHED", "exam", demo_exam.id if demo_exam else "exam-cds-01", "CDS Examination published following accessibility check", admin_user.id, now - timedelta(days=1)),
            ("USER_CREATED", "user", candidate_user.id, "Candidate user created and enrolled into CDS track", admin_user.id, now - timedelta(days=5)),
            ("ROLE_ASSIGNED", "user", examiner_user.id, "Assigned EXAMINER role to user", admin_user.id, now - timedelta(days=10)),
        ]
        for action, r_type, r_id, details, actor_id, ts in demo_audit_logs:
            log = db.query(AuditLog).filter(
                AuditLog.action == action,
                AuditLog.resource_id == r_id,
            ).first()
            if not log:
                log = AuditLog(
                    action=action,
                    resource_type=r_type,
                    resource_id=r_id,
                    actor_id=actor_id,
                    timestamp=ts,
                    metadata_json={"details": details},
                    ip_address="192.168.1.100",
                )
                db.add(log)

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
