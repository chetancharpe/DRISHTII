"""
Database Curriculum and Educational Content Seeder.
Migrates static curriculum subjects, topics, lesson sections, practice question bank,
and CDS mock examinations into SQLAlchemy database tables.
"""

from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.curriculum import (
    CURRICULUM_SUBJECTS,
    CURRICULUM_TOPICS,
    PRACTICE_QUESTIONS_MASTER,
    MOCK_TESTS_MASTER,
)
from app.db.base import Base
from app.db.database import SessionLocal, engine
from app.models.curriculum import CurriculumSubject, CurriculumTopic
from app.models.exam import Exam, ExamStatus
from app.models.exam_candidate import AttemptStatus, EligibilityStatus, ExamCandidate
from app.models.organization import Organization
from app.models.question import Question, QuestionDifficulty, QuestionType
from app.models.question_version import QuestionVersion
from app.models.section import ExamSection, SectionQuestion
from app.models.user import User
from app.utils.datetime import utc_now


def seed_curriculum_and_mock_tests(db: Optional[Session] = None):
    """
    Idempotent seeding function to populate database tables with complete CDS curriculum,
    rich lesson sections, question bank versions, and ready-to-attempt examinations.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # 1. Ensure all schema tables exist
        Base.metadata.create_all(bind=engine)

        # 2. Lookup or define creator (Examiner or Admin)
        examiner = db.query(User).filter(User.email == settings.DEV_EXAMINER_EMAIL).first()
        if not examiner:
            examiner = db.query(User).first()
        creator_id = examiner.id if examiner else "system-examiner-01"

        # Lookup primary organization
        org = db.query(Organization).first()
        org_id = org.id if org else "default-org-01"

        # 3. Seed Curriculum Subjects
        for idx, subj in enumerate(CURRICULUM_SUBJECTS):
            s_id = subj["id"]
            existing_s = db.query(CurriculumSubject).filter(CurriculumSubject.id == s_id).first()
            if not existing_s:
                new_s = CurriculumSubject(
                    id=s_id,
                    exam_id=subj.get("examId", "cds"),
                    name=subj["name"],
                    code=subj["code"],
                    description=subj["description"],
                    icon_name=subj["iconName"],
                    total_topics_count=subj.get("totalTopicsCount", 3),
                    recommended_topic_id=subj.get("recommendedTopicId"),
                    display_order=idx + 1,
                )
                db.add(new_s)
            else:
                existing_s.name = subj["name"]
                existing_s.code = subj["code"]
                existing_s.description = subj["description"]
                existing_s.icon_name = subj["iconName"]
                existing_s.recommended_topic_id = subj.get("recommendedTopicId")

        db.commit()

        # 4. Seed Curriculum Topics and Lessons
        for s_id, topics in CURRICULUM_TOPICS.items():
            for t_idx, topic in enumerate(topics):
                t_id = topic["id"]
                existing_t = db.query(CurriculumTopic).filter(CurriculumTopic.id == t_id).first()
                if not existing_t:
                    new_t = CurriculumTopic(
                        id=t_id,
                        subject_id=s_id,
                        name=topic["name"],
                        short_description=topic["shortDescription"],
                        completed_lessons=topic.get("completedLessons", 0),
                        total_lessons=topic.get("totalLessons", 10),
                        estimated_minutes=topic.get("estimatedMinutes", 15),
                        is_recommended=topic.get("isRecommended", False),
                        practice_available=topic.get("practiceAvailable", True),
                        practice_count=topic.get("practiceCount", 15),
                        display_order=t_idx + 1,
                        learning_objectives=topic.get("learningObjectives", []),
                        overview=topic.get("overview", ""),
                        sections=topic.get("sections", []),
                        quick_recap=topic.get("quickRecap", []),
                        audio_narrative=topic.get("audioNarrative"),
                    )
                    db.add(new_t)
                else:
                    existing_t.name = topic["name"]
                    existing_t.short_description = topic["shortDescription"]
                    existing_t.learning_objectives = topic.get("learningObjectives", [])
                    existing_t.overview = topic.get("overview", "")
                    existing_t.sections = topic.get("sections", [])
                    existing_t.quick_recap = topic.get("quickRecap", [])
                    existing_t.audio_narrative = topic.get("audioNarrative")

        db.commit()

        # 5. Seed Practice Questions into Question and QuestionVersion tables
        for q in PRACTICE_QUESTIONS_MASTER:
            q_id = q["id"]
            existing_q = db.query(Question).filter(Question.id == q_id).first()
            if not existing_q:
                q_type = q.get("type", "single_choice")
                diff = q.get("difficulty", "medium")
                new_q = Question(
                    id=q_id,
                    question_type=q_type,
                    subject=q["subjectName"],
                    topic=q["topicName"],
                    difficulty=diff,
                    language="en",
                    created_by=creator_id,
                    is_active=True,
                )
                db.add(new_q)
                db.flush()

                correct_ans = q["correctOptionIds"][0] if q.get("correctOptionIds") else "A"
                v1 = QuestionVersion(
                    question_id=new_q.id,
                    version_number=1,
                    question_text=q["questionText"],
                    options=q["options"],
                    correct_answer=correct_ans,
                    explanation=q.get("explanation"),
                    marks=1.0,
                    negative_marks=0.33,
                    accessibility_metadata={
                        "has_alt_text": False,
                        "has_accessible_formula": False,
                        "audio_description": q.get("audioDescription"),
                        "hint": q.get("hint"),
                        "accessibility_validation_status": "VALIDATED",
                    },
                    created_by=creator_id,
                )
                db.add(v1)

        db.commit()

        # 6. Seed Mock Examinations into Exam, ExamSection, and SectionQuestion tables
        now = utc_now()
        candidates = db.query(User).filter(User.is_active == True).all()

        for test in MOCK_TESTS_MASTER:
            test_id = test["id"]
            existing_exam = db.query(Exam).filter(Exam.id == test_id).first()
            dur_secs = test.get("durationMinutes", 45) * 60
            extra_secs = dur_secs // 3  # 33% compensatory time for accommodation

            if not existing_exam:
                new_exam = Exam(
                    id=test_id,
                    organization_id=org_id,
                    title=test["title"],
                    description=test["description"],
                    instructions="\n".join(test.get("instructionsSummary", [])),
                    status=ExamStatus.READY.value,
                    duration_seconds=dur_secs,
                    extra_time_seconds=extra_secs,
                    start_at=now,
                    end_at=now,
                    language="en",
                    created_by=creator_id,
                    published_at=now,
                )
                db.add(new_exam)
                db.flush()

                for s_idx, sec in enumerate(test.get("sections", [])):
                    sec_id = sec["id"]
                    questions_list = sec.get("questions", [])

                    new_sec = ExamSection(
                        id=sec_id,
                        exam_id=test_id,
                        title=sec["name"],
                        description=sec.get("description", ""),
                        display_order=s_idx + 1,
                        navigation_policy="FREE",
                        question_count=len(questions_list),
                    )
                    db.add(new_sec)
                    db.flush()

                    for q_idx, q_item in enumerate(questions_list):
                        q_obj_id = q_item["id"]
                        q_entity = db.query(Question).filter(Question.id == q_obj_id).first()
                        if not q_entity:
                            q_entity = Question(
                                id=q_obj_id,
                                question_type=q_item.get("type", "single_choice"),
                                subject=sec["name"],
                                topic=sec["code"],
                                difficulty=q_item.get("difficulty", "medium"),
                                language="en",
                                created_by=creator_id,
                                is_active=True,
                            )
                            db.add(q_entity)
                            db.flush()

                            correct_opt = q_item["correctOptionIds"][0] if q_item.get("correctOptionIds") else "A"
                            qv = QuestionVersion(
                                question_id=q_entity.id,
                                version_number=1,
                                question_text=q_item["text"],
                                options=q_item["options"],
                                correct_answer=correct_opt,
                                explanation=q_item.get("explanation"),
                                marks=1.0,
                                negative_marks=0.33,
                                accessibility_metadata={
                                    "has_alt_text": False,
                                    "has_accessible_formula": False,
                                    "audio_text": q_item.get("audioText"),
                                    "accessibility_validation_status": "VALIDATED",
                                },
                                created_by=creator_id,
                            )
                            db.add(qv)
                            db.flush()
                        else:
                            qv = (
                                db.query(QuestionVersion)
                                .filter(QuestionVersion.question_id == q_entity.id)
                                .order_by(QuestionVersion.version_number.desc())
                                .first()
                            )

                        if qv:
                            sec_q = SectionQuestion(
                                section_id=new_sec.id,
                                question_id=q_entity.id,
                                question_version_id=qv.id,
                                display_order=q_idx + 1,
                            )
                            db.add(sec_q)

                # Assign candidates
                for cand in candidates:
                    existing_assign = (
                        db.query(ExamCandidate)
                        .filter(ExamCandidate.exam_id == test_id, ExamCandidate.candidate_id == cand.id)
                        .first()
                    )
                    if not existing_assign:
                        db.add(
                            ExamCandidate(
                                exam_id=test_id,
                                candidate_id=cand.id,
                                eligibility_status=EligibilityStatus.ELIGIBLE.value,
                                attempt_status=AttemptStatus.NOT_ATTEMPTED.value,
                                time_multiplier=1.0,
                            )
                        )

        db.commit()
        print("Curriculum subjects, topics, question bank, and mock examinations successfully seeded.")
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    seed_curriculum_and_mock_tests()
