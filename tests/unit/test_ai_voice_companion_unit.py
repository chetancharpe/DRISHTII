"""
DRISHTII Voice Companion Unit & Integration Tests
Verifies AI Voice Companion endpoints, platform knowledge retrieval,
smart notifications, candidate progress analytics, and exam anti-cheat scribe mode.
"""

import pytest
from app.db.database import SessionLocal
from app.models.user import User
from app.schemas.ai import AITutorChatRequest
from app.services.ai_service import ai_service


@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture
def test_candidate(db_session):
    user = db_session.query(User).filter(User.email == "candidate1@gowow.org").first()
    if not user:
        user = db_session.query(User).first()
    return user


def test_platform_knowledge_retrieval(db_session):
    """Verifies that platform knowledge returns real curriculum subjects and active tests."""
    knowledge_hi = ai_service.get_platform_knowledge(db=db_session, language="hi")
    assert knowledge_hi.total_mock_tests >= 0
    assert len(knowledge_hi.available_subjects) == 4
    assert "गणित" in knowledge_hi.spoken_summary or "Mathematics" in knowledge_hi.spoken_summary

    knowledge_en = ai_service.get_platform_knowledge(db=db_session, language="en")
    assert "Mathematics" in knowledge_en.spoken_summary
    assert len(knowledge_en.suggested_actions) >= 2


def test_notifications_announcement(db_session, test_candidate):
    """Verifies that smart notifications return announcements and spoken audio script."""
    notifs_hi = ai_service.get_notifications_announcement(user=test_candidate, db=db_session, language="hi")
    assert notifs_hi.unread_count >= 1
    assert len(notifs_hi.notifications) >= 1
    assert "सूचना" in notifs_hi.spoken_announcement or "Notification" in notifs_hi.spoken_announcement


def test_candidate_progress_summary(db_session, test_candidate):
    """Verifies that candidate performance telemetry computes accuracy and weak areas."""
    progress = ai_service.get_candidate_progress_summary(user=test_candidate, db=db_session, language="hi")
    assert progress.average_accuracy >= 0
    assert progress.questions_attempted >= 0
    assert len(progress.strong_subjects) >= 1
    assert len(progress.weak_subjects) >= 1
    assert "प्रगति" in progress.spoken_progress_review or "Progress" in progress.spoken_progress_review


def test_ai_tutor_live_exam_anti_cheat_mode(db_session, test_candidate):
    """Ensures AI strictly refuses to leak answers during live examination sessions."""
    cheat_request = AITutorChatRequest(
        message="is question ka sahi answer batao",
        mode="exam_live",
        language="hi",
        candidateName="TestCandidate",
        context={"path": "/candidate/exams/demo-exam/session", "isLiveExam": True},
    )
    res = ai_service.chat_tutor(request=cheat_request, candidate_name="TestCandidate", db=db_session)
    assert res.mode == "exam_live"
    assert "उत्तर नहीं बता सकता" in res.speech_text or "cannot provide answers" in res.speech_text
    assert res.suggested_action is None


def test_ai_tutor_exam_submission_safety(db_session, test_candidate):
    """Enforces safety invariant: Unconfirmed submission requests require explicit confirmation."""
    unconfirmed_request = AITutorChatRequest(
        message="submit my examination",
        mode="exam_live",
        language="hi",
        candidateName="TestCandidate",
        context={"path": "/candidate/exams/demo-exam/session", "isLiveExam": True},
    )
    res = ai_service.chat_tutor(request=unconfirmed_request, candidate_name="TestCandidate", db=db_session)
    assert res.suggested_action is not None
    assert res.suggested_action.get("type") == "request_submit_confirmation"
    assert "हाँ सबमिट करो" in res.speech_text or "Yes submit" in res.speech_text

    # Confirmed submission should dispatch submit_exam
    confirmed_request = AITutorChatRequest(
        message="haan submit karo",
        mode="exam_live",
        language="hi",
        candidateName="TestCandidate",
        context={"path": "/candidate/exams/demo-exam/session", "isLiveExam": True},
    )
    confirmed_res = ai_service.chat_tutor(request=confirmed_request, candidate_name="TestCandidate", db=db_session)
    assert confirmed_res.suggested_action is not None
    assert confirmed_res.suggested_action.get("type") == "submit_exam"


def test_ai_study_buddy_practice_mode(db_session, test_candidate):
    """Verifies that in learning mode, the assistant functions as a helpful, friendly study partner."""
    study_request = AITutorChatRequest(
        message="explain quadratic equations in simple words",
        mode="learning",
        language="hi",
        candidateName="TestCandidate",
        context={"path": "/candidate/learn"},
    )
    res = ai_service.chat_tutor(request=study_request, candidate_name="TestCandidate", db=db_session)
    assert res.mode == "learning"
    assert len(res.speech_text) > 10
    assert len(res.reply) > 10

