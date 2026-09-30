"""
AI Accessibility & Interaction Monitoring Package for DRISHTII.
Integrates OpenCV and MediaPipe for presence detection and hand gesture classification.
"""

from app.accessibility.presence_detector import (
    CandidatePresenceDetector,
    ABSENCE_THRESHOLD_SECONDS,
    POSITION_THRESHOLD,
)
from app.accessibility.gesture_classifier import HandGestureClassifier
from app.accessibility.interaction_manager import InteractionManager

__all__ = [
    "CandidatePresenceDetector",
    "HandGestureClassifier",
    "InteractionManager",
    "ABSENCE_THRESHOLD_SECONDS",
    "POSITION_THRESHOLD",
]
