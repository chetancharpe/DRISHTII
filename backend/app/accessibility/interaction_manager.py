"""
AI Accessibility & Interaction Monitoring: Interaction Manager
Architecture:
- Connects Gesture Classifier and Keyboard Events to the existing examination system.
- Implements two-stage confirmation mechanism to prevent accidental gestures from immediately altering exam state.
- Formulates accessible voice feedback phrases complying with WCAG 2.1 AA screen-reader requirements.
"""

import time
from typing import Optional, Dict, Any

class InteractionManager:
    """
    State machine bridging vision/gesture detections, keyboard actions,
    confirmation gates, and voice feedback.
    """

    CONFIRMATION_TIMEOUT_SECONDS: float = 6.0

    def __init__(self, confirmation_timeout: float = CONFIRMATION_TIMEOUT_SECONDS):
        self.confirmation_timeout = confirmation_timeout
        self.pending_option: Optional[str] = None
        self.pending_question_id: Optional[str] = None
        self.pending_timestamp: Optional[float] = None
        self.child_mode: bool = False

    def handle_gesture(
        self,
        gesture: str,
        question_id: Optional[str] = None,
        timestamp: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Processes a classified gesture through the confirmation gate.
        """
        now = timestamp if timestamp is not None else time.time()

        # Check if previous pending option timed out
        if self.pending_timestamp and (now - self.pending_timestamp) > self.confirmation_timeout:
            self.clear_pending()

        if gesture in ("OPTION_1", "OPTION_2", "OPTION_3", "OPTION_4"):
            option_number = gesture.split("_")[1]
            self.pending_option = option_number
            self.pending_question_id = question_id
            self.pending_timestamp = now

            return {
                "action": "PENDING_SELECTION",
                "option": option_number,
                "question_id": question_id,
                "requires_confirmation": True,
                "voice_feedback": f"Option {option_number} selected. Confirm with thumbs up or press Enter.",
                "status": "awaiting_confirmation",
                "timestamp": int(now * 1000),
            }

        elif gesture == "CONFIRM":
            if self.pending_option:
                confirmed_opt = self.pending_option
                q_id = self.pending_question_id
                self.clear_pending()
                return {
                    "action": "CONFIRM_ANSWER",
                    "option": confirmed_opt,
                    "question_id": q_id,
                    "requires_confirmation": False,
                    "voice_feedback": "Answer confirmed.",
                    "status": "confirmed",
                    "timestamp": int(now * 1000),
                }
            else:
                return {
                    "action": "NO_OP",
                    "requires_confirmation": False,
                    "voice_feedback": "No option is currently selected to confirm.",
                    "status": "idle",
                    "timestamp": int(now * 1000),
                }

        elif gesture == "HELP":
            return {
                "action": "TRIGGER_HELP",
                "requires_confirmation": False,
                "voice_feedback": "Assistance request registered.",
                "status": "help_triggered",
                "timestamp": int(now * 1000),
            }

        return {
            "action": "NO_OP",
            "requires_confirmation": False,
            "voice_feedback": "",
            "status": "neutral",
            "timestamp": int(now * 1000),
        }

    def handle_keyboard(
        self,
        key: str,
        question_id: Optional[str] = None,
        available_options: Optional[list] = None,
        timestamp: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates keyboard input (Requirement #3) and coordinates with answer selection.
        """
        now = timestamp if timestamp is not None else time.time()
        k = key.strip().upper()
        valid_keys = {"1", "2", "3", "4", "A", "B", "C", "D"}

        if available_options:
            valid_keys = set(str(opt).upper() for opt in available_options)

        if k in valid_keys:
            # Directly maps to option
            opt_str = "1" if k in ("1", "A") else "2" if k in ("2", "B") else "3" if k in ("3", "C") else "4"
            self.pending_option = opt_str
            self.pending_question_id = question_id
            self.pending_timestamp = now

            return {
                "action": "KEYBOARD_SELECT",
                "key": key,
                "option": opt_str,
                "question_id": question_id,
                "valid": True,
                "voice_feedback": f"Option {opt_str} selected.",
                "timestamp": int(now * 1000),
            }

        elif k in ("ENTER", " "):
            # Space or Enter confirms pending option if present
            if self.pending_option:
                confirmed_opt = self.pending_option
                q_id = self.pending_question_id
                self.clear_pending()
                return {
                    "action": "CONFIRM_ANSWER",
                    "option": confirmed_opt,
                    "question_id": q_id,
                    "valid": True,
                    "voice_feedback": "Answer confirmed.",
                    "timestamp": int(now * 1000),
                }

        # Invalid key pressed during an examination question context
        return {
            "action": "INVALID_KEY",
            "key": key,
            "valid": False,
            "voice_feedback": "Invalid key. Please select an available option.",
            "timestamp": int(now * 1000),
        }

    def clear_pending(self):
        """Clears any pending unconfirmed answer selection."""
        self.pending_option = None
        self.pending_question_id = None
        self.pending_timestamp = None
