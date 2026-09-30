import pytest
from app.accessibility.presence_detector import CandidatePresenceDetector, ABSENCE_THRESHOLD_SECONDS
from app.accessibility.gesture_classifier import HandGestureClassifier
from app.accessibility.interaction_manager import InteractionManager


def test_presence_detector_no_alert_for_brief_absence():
    detector = CandidatePresenceDetector(absence_threshold_seconds=3.0)
    
    # Time 0: Present
    res1 = detector.evaluate_presence(present=True, timestamp=100.0)
    assert res1["present"] is True
    assert res1["alert_triggered"] is False

    # Time 101.5: Absent for 1.5 seconds (< 3.0s threshold)
    res2 = detector.evaluate_presence(present=False, timestamp=101.5)
    assert res2["present"] is False
    assert res2["alert_triggered"] is False
    assert res2["alert_message"] is None


def test_presence_detector_alerts_after_threshold():
    detector = CandidatePresenceDetector(absence_threshold_seconds=3.0)
    
    # Time 100.0: First absent frame
    detector.evaluate_presence(present=False, timestamp=100.0)

    # Time 103.5: Still absent after 3.5 seconds (>= 3.0s threshold)
    res = detector.evaluate_presence(present=False, timestamp=103.5)
    assert res["present"] is False
    assert res["alert_triggered"] is True
    assert "return to the examination area" in res["alert_message"]


def test_presence_detector_position_shift():
    detector = CandidatePresenceDetector(position_threshold=0.30)
    
    # Extreme shift: candidate moved to far right
    res = detector.evaluate_presence(present=True, position_shift=0.45, timestamp=100.0)
    assert res["present"] is True
    assert res["alert_triggered"] is True
    assert "shifted" in res["alert_message"]


def test_gesture_classifier_option_1():
    classifier = HandGestureClassifier()
    
    # Construct synthetic 21 landmarks where Index is extended and others are folded
    # Index: tip (8) y = 0.2 < pip (6) y = 0.5
    # Middle: tip (12) y = 0.6 > pip (10) y = 0.5
    # Ring: tip (16) y = 0.6 > pip (14) y = 0.5
    # Pinky: tip (20) y = 0.6 > pip (18) y = 0.5
    landmarks = [{"x": 0.5, "y": 0.7, "z": 0.0} for _ in range(21)]
    landmarks[0] = {"x": 0.5, "y": 0.9, "z": 0.0} # Wrist
    
    # Thumb folded
    landmarks[4] = {"x": 0.52, "y": 0.75, "z": 0.0}
    landmarks[3] = {"x": 0.51, "y": 0.70, "z": 0.0}
    landmarks[2] = {"x": 0.50, "y": 0.70, "z": 0.0}

    # Index extended
    landmarks[6] = {"x": 0.45, "y": 0.50, "z": 0.0} # PIP
    landmarks[7] = {"x": 0.45, "y": 0.35, "z": 0.0} # DIP
    landmarks[8] = {"x": 0.45, "y": 0.20, "z": 0.0} # TIP

    # Middle folded
    landmarks[10] = {"x": 0.50, "y": 0.50, "z": 0.0}
    landmarks[11] = {"x": 0.50, "y": 0.55, "z": 0.0}
    landmarks[12] = {"x": 0.50, "y": 0.60, "z": 0.0}

    # Ring folded
    landmarks[14] = {"x": 0.55, "y": 0.50, "z": 0.0}
    landmarks[15] = {"x": 0.55, "y": 0.55, "z": 0.0}
    landmarks[16] = {"x": 0.55, "y": 0.60, "z": 0.0}

    # Pinky folded
    landmarks[18] = {"x": 0.60, "y": 0.50, "z": 0.0}
    landmarks[19] = {"x": 0.60, "y": 0.55, "z": 0.0}
    landmarks[20] = {"x": 0.60, "y": 0.60, "z": 0.0}

    res = classifier.classify_gesture(landmarks)
    assert res["gesture"] == "OPTION_1"
    assert res["confidence"] > 0.8


def test_interaction_manager_confirmation_gate():
    manager = InteractionManager(confirmation_timeout=5.0)

    # 1. OPTION_2 gesture detected -> requires confirmation
    step1 = manager.handle_gesture("OPTION_2", question_id="q-42", timestamp=100.0)
    assert step1["action"] == "PENDING_SELECTION"
    assert step1["option"] == "2"
    assert step1["requires_confirmation"] is True
    assert "Option 2 selected" in step1["voice_feedback"]

    # 2. CONFIRM gesture detected -> confirms option 2
    step2 = manager.handle_gesture("CONFIRM", timestamp=101.0)
    assert step2["action"] == "CONFIRM_ANSWER"
    assert step2["option"] == "2"
    assert step2["voice_feedback"] == "Answer confirmed."


def test_interaction_manager_keyboard_invalid_key():
    manager = InteractionManager()
    res = manager.handle_keyboard(key="z", question_id="q-1")
    assert res["valid"] is False
    assert "Invalid key" in res["voice_feedback"]
