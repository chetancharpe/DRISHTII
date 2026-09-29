from datetime import timedelta
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.permissions import RoleEnum, get_permissions_for_role
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.database import SessionLocal, engine
from app.models.accessibility_profile import AccessibilityProfile
from app.models.exam import Exam, ExamStatus
from app.models.exam_candidate import AttemptStatus, EligibilityStatus, ExamCandidate
from app.models.learning_profile import LearningActivity, LearningProfile, Recommendation, TopicProgress
from app.models.organization import Organization, UserOrganization
from app.models.question import Question, QuestionDifficulty, QuestionType
from app.models.question_version import QuestionVersion
from app.models.role import Role, RolePermission, UserRole
from app.models.section import ExamSection, SectionQuestion
from app.models.user import User
from app.utils.datetime import utc_now


def seed_database():
    """Seed initial development dataset with realistic accessible examinations and learning records."""
    db: Session = SessionLocal()
    try:
        # Create all tables if not exist
        Base.metadata.create_all(bind=engine)

        # 1. Seed Roles and Granular Permissions
        roles_data = [
            (RoleEnum.ADMIN.value, "Platform Administrator with full governance privileges"),
            (RoleEnum.EXAMINER.value, "Examination author, evaluator, and scheduling coordinator"),
            (RoleEnum.CANDIDATE.value, "Candidate learner taking practice tests and live examinations"),
        ]

        roles_map = {}
        for role_name, role_desc in roles_data:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name, description=role_desc)
                db.add(role)
                db.flush()
                # Attach permissions
                for perm in get_permissions_for_role(role_name):
                    db.add(RolePermission(role_id=role.id, permission_name=perm))
            roles_map[role_name] = role

        db.commit()

        # 2. Seed Organizations
        org_data = [
            ("National Accessible Testing Board", "National government body coordinating equitable digital competitive examinations"),
            ("Apex Visionary Academy", "Premier accessible preparatory academy for civil services and STEM competitive exams"),
        ]
        orgs = []
        for name, desc in org_data:
            org = db.query(Organization).filter(Organization.name == name).first()
            if not org:
                org = Organization(name=name, description=desc, is_active=True)
                db.add(org)
                db.flush()
            orgs.append(org)
        db.commit()

        # 3. Seed Users
        # Admin
        admin_user = db.query(User).filter(User.email == settings.DEV_ADMIN_EMAIL).first()
        if not admin_user:
            admin_user = User(
                email=settings.DEV_ADMIN_EMAIL,
                password_hash=get_password_hash(settings.DEV_ADMIN_PASSWORD),
                first_name="Priya",
                last_name="Sharma",
                is_active=True,
            )
            db.add(admin_user)
            db.flush()
            db.add(UserRole(user_id=admin_user.id, role_id=roles_map[RoleEnum.ADMIN.value].id))
            db.add(UserOrganization(user_id=admin_user.id, organization_id=orgs[0].id, role_in_org="ADMIN"))

        # Examiner
        examiner_user = db.query(User).filter(User.email == settings.DEV_EXAMINER_EMAIL).first()
        if not examiner_user:
            examiner_user = User(
                email=settings.DEV_EXAMINER_EMAIL,
                password_hash=get_password_hash(settings.DEV_EXAMINER_PASSWORD),
                first_name="Dr. Rajesh",
                last_name="Verma",
                is_active=True,
            )
            db.add(examiner_user)
            db.flush()
            db.add(UserRole(user_id=examiner_user.id, role_id=roles_map[RoleEnum.EXAMINER.value].id))
            db.add(UserOrganization(user_id=examiner_user.id, organization_id=orgs[0].id, role_in_org="EXAMINER"))

        # Candidates (3 diverse candidate profiles)
        candidates = []
        cand_specs = [
            (settings.DEV_CANDIDATE_EMAIL, settings.DEV_CANDIDATE_PASSWORD, "Ananya", "Iyer", "large", "high_contrast", True, False),
            ("candidate2@gowow.org", "CandidateSecure123!", "Rohan", "Kapoor", "default", "standard", False, True),
            ("candidate3@gowow.org", "CandidateSecure123!", "Sanya", "Mirza", "maximum", "extra_high_contrast", True, True),
        ]

        for email, pwd, fn, ln, txt_scale, contrast, screen_reader, audio in cand_specs:
            cand = db.query(User).filter(User.email == email).first()
            if not cand:
                cand = User(
                    email=email,
                    password_hash=get_password_hash(pwd),
                    first_name=fn,
                    last_name=ln,
                    is_active=True,
                )
                db.add(cand)
                db.flush()
                db.add(UserRole(user_id=cand.id, role_id=roles_map[RoleEnum.CANDIDATE.value].id))

                # Seed Personalized Accessibility Profile
                db.add(
                    AccessibilityProfile(
                        user_id=cand.id,
                        text_scale=txt_scale,
                        contrast_mode=contrast,
                        theme="dark" if contrast != "standard" else "system",
                        screen_reader_mode=screen_reader,
                        audio_assistance=audio,
                        speech_rate=1.25 if screen_reader else 1.0,
                        preferred_language="en",
                        simplified_interface=screen_reader,
                    )
                )

                # Seed Learning Profile
                db.add(
                    LearningProfile(
                        user_id=cand.id,
                        preferred_subjects=["Mathematics", "Logical Reasoning", "English"],
                        daily_goal_questions=15,
                        weekly_goal_questions=75,
                        difficulty_preference="adaptive",
                    )
                )

                # Seed Topic Progress
                db.add(
                    TopicProgress(
                        user_id=cand.id,
                        subject="Mathematics",
                        topic="Percentages",
                        questions_attempted=20,
                        correct_answers=14,
                        incorrect_answers=6,
                        accuracy=70.0,
                        average_time_seconds=42.0,
                        last_practiced=utc_now(),
                    )
                )
                db.add(
                    TopicProgress(
                        user_id=cand.id,
                        subject="Mathematics",
                        topic="Probability",
                        questions_attempted=15,
                        correct_answers=8,
                        incorrect_answers=7,
                        accuracy=53.3,
                        average_time_seconds=65.0,
                        last_practiced=utc_now(),
                    )
                )

                # Seed Recommendation
                db.add(
                    Recommendation(
                        user_id=cand.id,
                        recommendation_type="review",
                        subject="Mathematics",
                        topic="Probability",
                        reason="Your recent accuracy in Probability is 53%. Consider reviewing the conceptual lesson first.",
                        priority="high",
                    )
                )

            candidates.append(cand)

        db.commit()

        # 4. Seed Accessible Questions
        q_data = [
            {
                "subject": "Mathematics",
                "topic": "Algebra",
                "difficulty": QuestionDifficulty.MEDIUM.value,
                "text": "If x² + 2x + 1 = 0, what is the value of x?",
                "options": [
                    {"id": "opt-1", "text": "x = -1", "aria_label": "Option A: x equals negative one"},
                    {"id": "opt-2", "text": "x = 1", "aria_label": "Option B: x equals one"},
                    {"id": "opt-3", "text": "x = 0", "aria_label": "Option C: x equals zero"},
                    {"id": "opt-4", "text": "x = 2", "aria_label": "Option D: x equals two"},
                ],
                "correct": "opt-1",
                "explanation": "Factoring the quadratic equation gives (x + 1)² = 0, hence x = -1.",
                "marks": 2.0,
                "negative_marks": 0.5,
                "a11y": {
                    "has_alt_text": False,
                    "has_accessible_formula": True,
                    "formula_spoken_text": "x squared plus two x plus one equals zero",
                    "has_table_headers": False,
                    "language": "en",
                    "accessibility_validation_status": "VALIDATED",
                },
            },
            {
                "subject": "Mathematics",
                "topic": "Probability",
                "difficulty": QuestionDifficulty.EASY.value,
                "text": "A standard six-sided die is rolled once. What is the probability of rolling an even number?",
                "options": [
                    {"id": "opt-1", "text": "1/2", "aria_label": "Option A: one half or 50 percent"},
                    {"id": "opt-2", "text": "1/3", "aria_label": "Option B: one third"},
                    {"id": "opt-3", "text": "1/6", "aria_label": "Option C: one sixth"},
                    {"id": "opt-4", "text": "2/3", "aria_label": "Option D: two thirds"},
                ],
                "correct": "opt-1",
                "explanation": "The favorable outcomes are 2, 4, 6 (3 outcomes) out of 6 total possibilities: 3/6 = 1/2.",
                "marks": 1.0,
                "negative_marks": 0.25,
                "a11y": {
                    "has_alt_text": False,
                    "has_accessible_formula": False,
                    "has_table_headers": False,
                    "language": "en",
                    "accessibility_validation_status": "VALIDATED",
                },
            },
            {
                "subject": "Logical Reasoning",
                "topic": "Syllogisms",
                "difficulty": QuestionDifficulty.MEDIUM.value,
                "text": "Statements: All roses are flowers. Some flowers fade quickly. Conclusion: Some roses fade quickly.",
                "options": [
                    {"id": "opt-1", "text": "Conclusion is definitely true", "aria_label": "Option A: Conclusion is definitely true"},
                    {"id": "opt-2", "text": "Conclusion does not necessarily follow", "aria_label": "Option B: Conclusion does not necessarily follow"},
                    {"id": "opt-3", "text": "Conclusion is definitely false", "aria_label": "Option C: Conclusion is definitely false"},
                ],
                "correct": "opt-2",
                "explanation": "The flowers that fade quickly may not be roses; hence the conclusion is not guaranteed.",
                "marks": 1.5,
                "negative_marks": 0.5,
                "a11y": {
                    "has_alt_text": False,
                    "has_accessible_formula": False,
                    "has_table_headers": False,
                    "language": "en",
                    "accessibility_validation_status": "VALIDATED",
                },
            },
        ]

        created_questions = []
        for q_item in q_data:
            existing_q = db.query(Question).filter(Question.subject == q_item["subject"], Question.topic == q_item["topic"]).first()
            if not existing_q:
                q = Question(
                    question_type=QuestionType.MULTIPLE_CHOICE.value,
                    subject=q_item["subject"],
                    topic=q_item["topic"],
                    difficulty=q_item["difficulty"],
                    language="en",
                    created_by=examiner_user.id,
                    is_active=True,
                )
                db.add(q)
                db.flush()

                qv = QuestionVersion(
                    question_id=q.id,
                    version_number=1,
                    question_text=q_item["text"],
                    options=q_item["options"],
                    correct_answer=q_item["correct"],
                    explanation=q_item["explanation"],
                    marks=q_item["marks"],
                    negative_marks=q_item["negative_marks"],
                    accessibility_metadata=q_item["a11y"],
                    created_by=examiner_user.id,
                )
                db.add(qv)
                created_questions.append(q)
            else:
                created_questions.append(existing_q)

        db.commit()

        # 5. Seed Examinations
        now = utc_now()
        exams_specs = [
            ("All India Civil Services Mock Test — Paper I", 3600, 1200, ExamStatus.READY.value),
            ("National Banking Aptitude Examination 2026", 5400, 1800, ExamStatus.SCHEDULED.value),
            ("STEM Foundation & Logic Diagnostic", 1800, 600, ExamStatus.READY.value),
        ]

        for title, dur, extra, stat in exams_specs:
            exam = db.query(Exam).filter(Exam.title == title).first()
            if not exam:
                exam = Exam(
                    organization_id=orgs[0].id,
                    title=title,
                    description="Official accessible computer-based examination with screen reader and audio accommodation.",
                    instructions="Keyboard navigation enabled. Press TAB to move, ARROW keys to select options, Alt+S to submit.",
                    status=stat,
                    duration_seconds=dur,
                    extra_time_seconds=extra,
                    start_at=now - timedelta(days=1),
                    end_at=now + timedelta(days=14),
                    language="en",
                    created_by=examiner_user.id,
                    published_at=now - timedelta(days=1),
                )
                db.add(exam)
                db.flush()

                # Add section
                sec = ExamSection(
                    exam_id=exam.id,
                    title="Section A: Core Aptitude",
                    description="Analytical and Quantitative reasoning section",
                    display_order=1,
                    navigation_policy="FREE",
                    question_count=len(created_questions),
                )
                db.add(sec)
                db.flush()

                for idx, q in enumerate(created_questions):
                    qv = db.query(QuestionVersion).filter(QuestionVersion.question_id == q.id).first()
                    if qv:
                        db.add(
                            SectionQuestion(
                                section_id=sec.id,
                                question_id=q.id,
                                question_version_id=qv.id,
                                display_order=idx + 1,
                            )
                        )

                # Assign candidates with realistic accommodation multipliers (1.0x standard, 1.5x PwD accommodation)
                for idx, cand in enumerate(candidates):
                    mult = 1.5 if idx % 2 == 1 else 1.0
                    db.add(
                        ExamCandidate(
                            exam_id=exam.id,
                            candidate_id=cand.id,
                            eligibility_status=EligibilityStatus.ELIGIBLE.value,
                            attempt_status=AttemptStatus.NOT_ATTEMPTED.value,
                            time_multiplier=mult,
                        )
                    )

        db.commit()
        print("Database seeded successfully with accessible examination dataset.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
