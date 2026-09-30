/**
 * AI Accessibility & Interaction Monitoring: Hand Gesture Classifier
 * Uses MediaPipe Hand Landmark coordinates to classify examination interaction gestures:
 * 1 finger  -> OPTION_1
 * 2 fingers -> OPTION_2
 * 3 fingers -> OPTION_3
 * 4 fingers -> OPTION_4
 * Open palm -> HELP
 * Thumbs up -> CONFIRM
 */

import { GestureType, GestureActionResult } from '../../types/accessibilityMonitoring';

export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export class HandGestureClassifier {
  private handLandmarker: any = null;
  private isInitializing: boolean = false;
  private initError: boolean = false;

  public static readonly GESTURE_ACTIONS: Record<
    GestureType,
    { action: string; description: string; voicePrompt: string }
  > = {
    OPTION_1: {
      action: 'select_option_1',
      description: 'Select answer option 1',
      voicePrompt: 'Option 1 selected.',
    },
    OPTION_2: {
      action: 'select_option_2',
      description: 'Select answer option 2',
      voicePrompt: 'Option 2 selected.',
    },
    OPTION_3: {
      action: 'select_option_3',
      description: 'Select answer option 3',
      voicePrompt: 'Option 3 selected.',
    },
    OPTION_4: {
      action: 'select_option_4',
      description: 'Select answer option 4',
      voicePrompt: 'Option 4 selected.',
    },
    HELP: {
      action: 'request_assistance',
      description: 'Trigger accessibility assistance',
      voicePrompt: 'Assistance request registered.',
    },
    CONFIRM: {
      action: 'confirm_selection',
      description: 'Confirm current answer selection',
      voicePrompt: 'Answer confirmed.',
    },
    UNKNOWN: {
      action: 'none',
      description: 'Neutral or unrecognized posture',
      voicePrompt: '',
    },
  };

  /**
   * Initializes MediaPipe Tasks-Vision HandLandmarker asynchronously.
   * If CDN or WebAssembly is restricted, fails gracefully without breaking the exam.
   */
  public async initMediaPipe(): Promise<boolean> {
    if (this.handLandmarker) return true;
    if (this.isInitializing || this.initError) return false;

    this.isInitializing = true;
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      this.handLandmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      this.isInitializing = false;
      return true;
    } catch (err) {
      console.warn('MediaPipe HandLandmarker initialization fallback:', err);
      this.initError = true;
      this.isInitializing = false;
      return false;
    }
  }

  /**
   * Extracts hand landmarks from an active HTML5 Video Element.
   */
  public async detectHandLandmarks(
    video: HTMLVideoElement,
    timestamp: number = performance.now()
  ): Promise<HandLandmark[] | null> {
    if (!this.handLandmarker) {
      await this.initMediaPipe();
      if (!this.handLandmarker) return null;
    }

    try {
      if (video.readyState < 2) return null;
      const result = this.handLandmarker.detectForVideo(video, timestamp);
      if (result && result.landmarks && result.landmarks.length > 0) {
        return result.landmarks[0];
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Classifies 21 normalized landmarks using lightweight geometric rules (Requirement #2).
   */
  public classifyGesture(
    landmarks: HandLandmark[] | null,
    timestamp: number = Date.now()
  ): GestureActionResult {
    if (!landmarks || landmarks.length < 21) {
      return {
        gesture: 'UNKNOWN',
        confidence: 0,
        timestamp,
        fingersExtended: [],
        action: 'none',
        description: 'No hand detected',
      };
    }

    // 0: Wrist
    // Index: 8 (Tip), 7 (DIP), 6 (PIP), 5 (MCP)
    // Middle: 12 (Tip), 11 (DIP), 10 (PIP), 9 (MCP)
    // Ring: 16 (Tip), 15 (DIP), 14 (PIP), 13 (MCP)
    // Pinky: 20 (Tip), 19 (DIP), 18 (PIP), 17 (MCP)
    // Thumb: 4 (Tip), 3 (IP), 2 (MCP), 1 (CMC)

    const indexExtended = landmarks[8].y < landmarks[6].y && landmarks[8].y < landmarks[7].y;
    const middleExtended = landmarks[12].y < landmarks[10].y && landmarks[12].y < landmarks[11].y;
    const ringExtended = landmarks[16].y < landmarks[14].y && landmarks[16].y < landmarks[15].y;
    const pinkyExtended = landmarks[20].y < landmarks[18].y && landmarks[20].y < landmarks[19].y;

    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const thumbMcp = landmarks[2];
    const wrist = landmarks[0];

    // Thumbs up: thumb tip stands vertically above MCP and IP, while fingers are curled
    const thumbVertical = thumbTip.y < thumbIp.y && thumbTip.y < thumbMcp.y;

    // Spread thumb check for open palm
    const thumbDistWrist = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y);
    const thumbMcpDist = Math.hypot(thumbMcp.x - wrist.x, thumbMcp.y - wrist.y);
    const thumbSpread = thumbVertical || thumbDistWrist > thumbMcpDist * 1.25;

    const fingersExtended: string[] = [];
    if (thumbSpread) fingersExtended.push('THUMB');
    if (indexExtended) fingersExtended.push('INDEX');
    if (middleExtended) fingersExtended.push('MIDDLE');
    if (ringExtended) fingersExtended.push('RING');
    if (pinkyExtended) fingersExtended.push('PINKY');

    const count = fingersExtended.length;
    let gesture: GestureType = 'UNKNOWN';
    let confidence = 0.88;

    // 1. Thumbs Up -> CONFIRM (Thumb up, 4 fingers curled)
    if (thumbVertical && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      gesture = 'CONFIRM';
      confidence = 0.95;
    }
    // 2. Open Palm -> HELP (All 5 extended)
    else if (indexExtended && middleExtended && ringExtended && pinkyExtended && (thumbSpread || count === 5)) {
      gesture = 'HELP';
      confidence = 0.94;
    }
    // 3. 1 Finger -> OPTION_1 (Index only)
    else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      gesture = 'OPTION_1';
      confidence = 0.93;
    }
    // 4. 2 Fingers -> OPTION_2 (Index + Middle)
    else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      gesture = 'OPTION_2';
      confidence = 0.92;
    }
    // 5. 3 Fingers -> OPTION_3 (Index + Middle + Ring)
    else if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
      gesture = 'OPTION_3';
      confidence = 0.91;
    }
    // 6. 4 Fingers -> OPTION_4 (4 fingers extended, thumb curled)
    else if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbSpread) {
      gesture = 'OPTION_4';
      confidence = 0.92;
    }

    const actionInfo = this.getGestureAction(gesture);

    return {
      gesture,
      confidence: gesture === 'UNKNOWN' ? 0.35 : confidence,
      timestamp,
      fingersExtended,
      action: actionInfo.action,
      description: actionInfo.description,
    };
  }

  public getGestureAction(gesture: GestureType) {
    return HandGestureClassifier.GESTURE_ACTIONS[gesture] || HandGestureClassifier.GESTURE_ACTIONS.UNKNOWN;
  }

  public cleanup(): void {
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch {
        // Safe close
      }
      this.handLandmarker = null;
    }
  }
}

export const gestureClassifier = new HandGestureClassifier();
