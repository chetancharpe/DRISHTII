"""
AI Accessibility & Interaction Monitoring: Hand Gesture Classifier
Architecture:
- Uses MediaPipe Hands 21-landmark tracking.
- Performs fast, lightweight, explainable geometric landmark classification.
- Detects examination control gestures:
    * 1 finger (Index only)                -> OPTION_1
    * 2 fingers (Index + Middle)           -> OPTION_2
    * 3 fingers (Index + Middle + Ring)    -> OPTION_3
    * 4 fingers (Index + Mid + Ring + Pin) -> OPTION_4
    * Open Palm (All 5 extended)           -> HELP
    * Thumbs Up (Thumb up, 4 curled)       -> CONFIRM
- Privacy: No images are persisted or uploaded.
"""

import time
from typing import Optional, List, Dict, Any
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import mediapipe as mp
except ImportError:
    mp = None


class HandGestureClassifier:
    """
    Lightweight, rule-based gesture classifier operating on 21 MediaPipe hand landmarks.
    """

    # Hand Landmark indices:
    # 0: Wrist
    # Thumb: 1 (CMC), 2 (MCP), 3 (IP), 4 (TIP)
    # Index: 5 (MCP), 6 (PIP), 7 (DIP), 8 (TIP)
    # Middle: 9 (MCP), 10 (PIP), 11 (DIP), 12 (TIP)
    # Ring: 13 (MCP), 14 (PIP), 15 (DIP), 16 (TIP)
    # Pinky: 17 (MCP), 18 (PIP), 19 (DIP), 20 (TIP)

    GESTURE_ACTIONS: Dict[str, Dict[str, str]] = {
        "OPTION_1": {
            "action": "select_option_1",
            "description": "Select answer option 1",
            "voice_prompt": "Option 1 selected.",
        },
        "OPTION_2": {
            "action": "select_option_2",
            "description": "Select answer option 2",
            "voice_prompt": "Option 2 selected.",
        },
        "OPTION_3": {
            "action": "select_option_3",
            "description": "Select answer option 3",
            "voice_prompt": "Option 3 selected.",
        },
        "OPTION_4": {
            "action": "select_option_4",
            "description": "Select answer option 4",
            "voice_prompt": "Option 4 selected.",
        },
        "HELP": {
            "action": "request_assistance",
            "description": "Trigger accessibility assistance / help modal",
            "voice_prompt": "Assistance request registered.",
        },
        "CONFIRM": {
            "action": "confirm_selection",
            "description": "Confirm the pending answer selection",
            "voice_prompt": "Answer confirmed.",
        },
        "UNKNOWN": {
            "action": "none",
            "description": "Unrecognized or neutral hand posture",
            "voice_prompt": "",
        },
    }

    def __init__(self, min_detection_confidence: float = 0.6, min_tracking_confidence: float = 0.5):
        self.hands_detector = None
        if mp and hasattr(mp, "solutions") and hasattr(mp.solutions, "hands"):
            try:
                self.hands_detector = mp.solutions.hands.Hands(
                    static_image_mode=False,
                    max_num_hands=1,
                    min_detection_confidence=min_detection_confidence,
                    min_tracking_confidence=min_tracking_confidence,
                )
            except Exception:
                self.hands_detector = None

    def detect_hand_landmarks(self, frame: np.ndarray) -> Optional[List[Dict[str, float]]]:
        """
        Extracts 21 normalized hand landmarks from an RGB frame.
        """
        if frame is None or frame.size == 0 or not self.hands_detector:
            return None

        rgb_frame = frame
        if cv2 and len(frame.shape) == 3 and frame.shape[2] == 3:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = self.hands_detector.process(rgb_frame)
        if not results or not results.multi_hand_landmarks:
            return None

        landmarks = []
        for lm in results.multi_hand_landmarks[0].landmark:
            landmarks.append({"x": lm.x, "y": lm.y, "z": lm.z})
        return landmarks

    def classify_gesture(
        self,
        landmarks: Optional[List[Dict[str, float]]],
        timestamp: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Classifies 21 normalized landmarks into one of:
        OPTION_1, OPTION_2, OPTION_3, OPTION_4, HELP, CONFIRM, or UNKNOWN.
        """
        now = timestamp if timestamp is not None else time.time()
        ts_ms = int(now * 1000)

        if not landmarks or len(landmarks) < 21:
            return {
                "gesture": "UNKNOWN",
                "confidence": 0.0,
                "fingers_extended": [],
                "action": "none",
                "timestamp": ts_ms,
            }

        # Determine individual finger extension states
        # Finger is extended if TIP y is above (smaller than in screen coords) PIP y
        # We also check against DIP for robustness

        # Index (Tip 8 vs PIP 6)
        index_extended = landmarks[8]["y"] < landmarks[6]["y"] and landmarks[8]["y"] < landmarks[7]["y"]

        # Middle (Tip 12 vs PIP 10)
        middle_extended = landmarks[12]["y"] < landmarks[10]["y"] and landmarks[12]["y"] < landmarks[11]["y"]

        # Ring (Tip 16 vs PIP 14)
        ring_extended = landmarks[16]["y"] < landmarks[14]["y"] and landmarks[16]["y"] < landmarks[15]["y"]

        # Pinky (Tip 20 vs PIP 18)
        pinky_extended = landmarks[20]["y"] < landmarks[18]["y"] and landmarks[20]["y"] < landmarks[19]["y"]

        # Thumb: Thumb orientation differs.
        # Check vertical extension (tip above IP) or lateral extension from wrist/MCP
        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        thumb_mcp = landmarks[2]
        wrist = landmarks[0]

        # For upright thumbs up: thumb tip significantly above MCP and IP, while 4 fingers are folded
        thumb_vertical_extended = thumb_tip["y"] < thumb_ip["y"] and thumb_tip["y"] < thumb_mcp["y"]
        
        # Lateral distance from wrist to determine open palm thumb spread
        thumb_dist_wrist = ((thumb_tip["x"] - wrist["x"]) ** 2 + (thumb_tip["y"] - wrist["y"]) ** 2) ** 0.5
        thumb_mcp_dist = ((thumb_mcp["x"] - wrist["x"]) ** 2 + (thumb_mcp["y"] - wrist["y"]) ** 2) ** 0.5
        thumb_extended = thumb_vertical_extended or (thumb_dist_wrist > thumb_mcp_dist * 1.3)

        fingers_extended = []
        if thumb_extended:
            fingers_extended.append("THUMB")
        if index_extended:
            fingers_extended.append("INDEX")
        if middle_extended:
            fingers_extended.append("MIDDLE")
        if ring_extended:
            fingers_extended.append("RING")
        if pinky_extended:
            fingers_extended.append("PINKY")

        num_extended = len(fingers_extended)
        gesture = "UNKNOWN"
        confidence = 0.85

        # 1. THUMBS UP -> CONFIRM (Thumb up, 4 fingers folded)
        if thumb_vertical_extended and not index_extended and not middle_extended and not ring_extended and not pinky_extended:
            gesture = "CONFIRM"
            confidence = 0.94

        # 2. OPEN PALM -> HELP (All 5 extended or at least 4 fingers extended with high palm area)
        elif index_extended and middle_extended and ring_extended and pinky_extended and (thumb_extended or num_extended >= 4):
            if thumb_extended and num_extended == 5:
                gesture = "HELP"
                confidence = 0.95
            elif not thumb_extended and num_extended == 4:
                gesture = "OPTION_4"
                confidence = 0.92

        # 3. 1 FINGER (Index only) -> OPTION_1
        elif index_extended and not middle_extended and not ring_extended and not pinky_extended:
            gesture = "OPTION_1"
            confidence = 0.93

        # 4. 2 FINGERS (Index + Middle) -> OPTION_2
        elif index_extended and middle_extended and not ring_extended and not pinky_extended:
            gesture = "OPTION_2"
            confidence = 0.92

        # 5. 3 FINGERS (Index + Middle + Ring) -> OPTION_3
        elif index_extended and middle_extended and ring_extended and not pinky_extended:
            gesture = "OPTION_3"
            confidence = 0.91

        # 6. 4 FINGERS -> OPTION_4 (if not classified as help)
        elif index_extended and middle_extended and ring_extended and pinky_extended and not thumb_extended:
            gesture = "OPTION_4"
            confidence = 0.92

        action_meta = self.get_gesture_action(gesture)

        return {
            "gesture": gesture,
            "confidence": confidence if gesture != "UNKNOWN" else 0.40,
            "fingers_extended": fingers_extended,
            "action": action_meta.get("action", "none"),
            "timestamp": ts_ms,
        }

    def get_gesture_action(self, gesture: str) -> Dict[str, str]:
        """
        Maps a gesture string to its corresponding examination action and accessible voice prompt.
        """
        return self.GESTURE_ACTIONS.get(gesture, self.GESTURE_ACTIONS["UNKNOWN"])
