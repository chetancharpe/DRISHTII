"""
AI Accessibility & Interaction Monitoring: Candidate Presence Detector
Architecture:
- Combines OpenCV frame preprocessing and MediaPipe Face/Pose Detection.
- Tracks candidate presence, position shifts, and temporal absence duration.
- Adheres to WCAG and examination rules: Alerts are NEVER triggered on a single dropped frame.
  An absence alert requires continuous absence >= ABSENCE_THRESHOLD_SECONDS (default 3.0s).
- Privacy: No video frames or biometric measurements are permanently stored or transmitted.
"""

import time
from typing import Optional, Tuple, Dict, Any
import numpy as np

# Configurable constants (Requirement #1)
ABSENCE_THRESHOLD_SECONDS: float = 3.0
POSITION_THRESHOLD: float = 0.30
MIN_FACE_AREA_RATIO: float = 0.012
MAX_FACE_AREA_RATIO: float = 0.50

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import mediapipe as mp
except ImportError:
    mp = None


class CandidatePresenceDetector:
    """
    Evaluates candidate presence in front of the camera stream using OpenCV and MediaPipe.
    Maintains a rolling temporal window to prevent false positives from brief occlusions.
    """

    def __init__(
        self,
        absence_threshold_seconds: float = ABSENCE_THRESHOLD_SECONDS,
        position_threshold: float = POSITION_THRESHOLD,
    ):
        self.absence_threshold_seconds = absence_threshold_seconds
        self.position_threshold = position_threshold
        
        # State tracking
        self.last_seen_timestamp: Optional[float] = None
        self.absence_start_timestamp: Optional[float] = None
        self.reference_center_x: Optional[float] = None

        # MediaPipe Face Detection initialization (lightweight, near-real-time)
        self.face_detector = None
        if mp and hasattr(mp, "solutions") and hasattr(mp.solutions, "face_detection"):
            try:
                self.face_detector = mp.solutions.face_detection.FaceDetection(
                    model_selection=0,  # 0 for short-range (< 2m, perfect for webcam)
                    min_detection_confidence=0.5,
                )
            except Exception:
                self.face_detector = None

    def evaluate_presence(
        self,
        present: bool,
        position_shift: float = 0.0,
        face_area_ratio: float = 0.10,
        timestamp: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Pure business logic evaluator for presence and temporal window calculations.
        Usable both with live frames and synthesized telemetry events.
        """
        now = timestamp if timestamp is not None else time.time()

        if present:
            self.last_seen_timestamp = now
            self.absence_start_timestamp = None
            alert_message = None

            # Distance classification
            if face_area_ratio < MIN_FACE_AREA_RATIO:
                distance_status = "too_far"
                position_alert = "Candidate is sitting too far from the camera."
            elif face_area_ratio > MAX_FACE_AREA_RATIO:
                distance_status = "too_close"
                position_alert = "Candidate is sitting too close to the camera."
            else:
                distance_status = "normal"
                position_alert = None

            # Shift alert
            if abs(position_shift) > self.position_threshold:
                position_alert = "Candidate position significantly shifted."

            return {
                "present": True,
                "face_count": 1,
                "distance_status": distance_status,
                "position_shift": round(position_shift, 3),
                "absence_duration_seconds": 0.0,
                "alert_triggered": bool(position_alert),
                "alert_message": position_alert,
                "timestamp": int(now * 1000),
            }
        else:
            # Candidate is not detected in current frame
            if self.absence_start_timestamp is None:
                self.absence_start_timestamp = now

            absence_duration = now - self.absence_start_timestamp
            alert_triggered = absence_duration >= self.absence_threshold_seconds
            alert_message = (
                "Please return to the examination area." if alert_triggered else None
            )

            return {
                "present": False,
                "face_count": 0,
                "distance_status": "absent",
                "position_shift": 0.0,
                "absence_duration_seconds": round(absence_duration, 2),
                "alert_triggered": alert_triggered,
                "alert_message": alert_message,
                "timestamp": int(now * 1000),
            }

    def process_frame(
        self,
        frame: np.ndarray,
        timestamp: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Processes an incoming OpenCV RGB frame to detect candidate presence,
        bounding box, distance estimate, and position shift.
        """
        now = timestamp if timestamp is not None else time.time()

        if frame is None or frame.size == 0:
            return self.evaluate_presence(False, timestamp=now)

        # Convert to RGB if needed
        rgb_frame = frame
        if cv2 and len(frame.shape) == 3 and frame.shape[2] == 3:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        if not self.face_detector:
            # Fallback when MediaPipe is unavailable: simple motion/luminance detection
            gray = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2GRAY) if cv2 else None
            present = gray is not None and np.mean(gray) > 15.0
            return self.evaluate_presence(present, timestamp=now)

        results = self.face_detector.process(rgb_frame)

        if not results or not results.detections:
            return self.evaluate_presence(False, timestamp=now)

        # Candidate face detected
        best_detection = results.detections[0]
        bbox = best_detection.location_data.relative_bounding_box

        # Center X calculation
        face_center_x = bbox.xmin + (bbox.width / 2.0)
        if self.reference_center_x is None:
            self.reference_center_x = face_center_x

        # Normalized shift from center (where 0.0 is center, -0.5 is left edge, +0.5 is right edge)
        position_shift = face_center_x - 0.5
        face_area_ratio = bbox.width * bbox.height

        return self.evaluate_presence(
            present=True,
            position_shift=position_shift,
            face_area_ratio=face_area_ratio,
            timestamp=now,
        )

    def reset(self):
        """Resets temporal tracking timers."""
        self.last_seen_timestamp = None
        self.absence_start_timestamp = None
        self.reference_center_x = None
