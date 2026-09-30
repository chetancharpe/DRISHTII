/**
 * AI Accessibility & Interaction Monitoring Type Definitions
 * Designed for DRISHTII accessible examination platform.
 */

export type MonitoringCameraStatus = 'connected' | 'denied' | 'unavailable' | 'off' | 'requesting';

export type CandidatePresenceStatus = 'detected' | 'absent' | 'too_far' | 'too_close' | 'shifted';

export type GestureType =
  | 'OPTION_1'
  | 'OPTION_2'
  | 'OPTION_3'
  | 'OPTION_4'
  | 'HELP'
  | 'CONFIRM'
  | 'UNKNOWN';

export interface GestureActionResult {
  gesture: GestureType;
  confidence: number;
  timestamp: number;
  fingersExtended?: string[];
  action?: string;
  description?: string;
}

export interface KeyboardMonitoringEvent {
  type: 'KEYBOARD_ACTION';
  key: string;
  questionId?: string;
  sessionId?: string;
  timestamp: number;
  valid: boolean;
}

export type AccessibilityMode = 'STANDARD' | 'VISUALLY_IMPAIRED' | 'CHILD';

export interface ChildModeConfig {
  largerControls: boolean;
  slowerVoice: boolean;
  simplifiedNavigation: boolean;
  gestureInteraction: boolean;
  voiceFirstInteraction: boolean;
  speechRateMultiplier: number;
}

export interface MonitoringState {
  cameraStatus: MonitoringCameraStatus;
  presenceStatus: CandidatePresenceStatus;
  presenceAlert: string | null;
  activeGesture: GestureType;
  gestureConfidence: number;
  pendingOption: string | null;
  voiceEnabled: boolean;
  absenceDuration: number;
  fps: number;
  mode: AccessibilityMode;
  childModeConfig: ChildModeConfig;
}

export interface AccessibilityEventPayload {
  eventType:
    | 'CAMERA_CONNECTED'
    | 'CANDIDATE_DETECTED'
    | 'CANDIDATE_ABSENT'
    | 'POSITION_SHIFTED'
    | 'GESTURE_DETECTED'
    | 'KEYBOARD_ACTION'
    | 'HELP_REQUESTED'
    | 'VOICE_FEEDBACK';
  gesture?: GestureType;
  confidence?: number;
  questionId?: string;
  key?: string;
  timestamp?: number;
  sessionId?: string;
  details?: Record<string, unknown>;
}
