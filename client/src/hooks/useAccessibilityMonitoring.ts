/**
 * AI Accessibility & Interaction Monitoring: Master Hook
 * Manages webcam presence detection, MediaPipe hand gestures,
 * keyboard interaction detection, voice feedback, and telemetry reporting.
 *
 * Rules:
 * - Local-first / client-side processing: raw frames are NEVER sent to the server.
 * - Non-blocking enhancement: If camera or MediaPipe fails, exam proceeds 100% normally.
 * - Resource cleanup: halts media streams, timers, and listeners on unmount.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MonitoringCameraStatus,
  CandidatePresenceStatus,
  GestureType,
  AccessibilityMode,
  ChildModeConfig,
} from '../types/accessibilityMonitoring';
import { presenceDetector } from '../services/accessibility/presenceDetector';
import { gestureClassifier } from '../services/accessibility/gestureClassifier';
import { InteractionManager } from '../services/accessibility/interactionManager';
import { KeyboardInteractionDetector } from '../services/accessibility/keyboardInteractionDetector';
import { voiceFeedbackService } from '../services/accessibility/voiceFeedbackService';
import { accessibilityApi } from '../services/api/accessibilityApi';
import { useAccessibility } from '../contexts/AccessibilityContext';

export interface UseAccessibilityMonitoringOptions {
  enabled?: boolean;
  questionId?: string;
  sessionId?: string;
  initialMode?: AccessibilityMode;
  onOptionSelected?: (optionIndex: number, optionLabel: string) => void;
  onOptionConfirmed?: (optionIndex: number, optionLabel: string) => void;
  onHelpRequested?: () => void;
}

const DEFAULT_CHILD_CONFIG: ChildModeConfig = {
  largerControls: true,
  slowerVoice: true,
  simplifiedNavigation: true,
  gestureInteraction: true,
  voiceFirstInteraction: true,
  speechRateMultiplier: 0.8,
};

export function useAccessibilityMonitoring({
  enabled = true,
  questionId,
  sessionId,
  initialMode = 'STANDARD',
  onOptionSelected,
  onOptionConfirmed,
  onHelpRequested,
}: UseAccessibilityMonitoringOptions = {}) {
  const { announce } = useAccessibility();

  // Unified Monitoring State
  const [cameraStatus, setCameraStatus] = useState<MonitoringCameraStatus>('off');
  const [presenceStatus, setPresenceStatus] = useState<CandidatePresenceStatus>('detected');
  const [presenceAlert, setPresenceAlert] = useState<string | null>(null);
  const [activeGesture, setActiveGesture] = useState<GestureType>('UNKNOWN');
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);
  const [pendingOption, setPendingOption] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [absenceDuration, setAbsenceDuration] = useState<number>(0);
  const [mode, setMode] = useState<AccessibilityMode>(initialMode);
  const [childModeConfig, setChildModeConfig] = useState<ChildModeConfig>(DEFAULT_CHILD_CONFIG);

  // Hidden DOM Elements for Video Capture and Frame Processing
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopTimerRef = useRef<any>(null);
  const lastAlertAnnounceRef = useRef<number>(0);

  // Interaction Manager Ref
  const interactionManagerRef = useRef<InteractionManager | null>(null);
  if (!interactionManagerRef.current) {
    interactionManagerRef.current = new InteractionManager({
      onSelectOption: (idx, label) => {
        setPendingOption(label);
        onOptionSelected?.(idx, label);
      },
      onConfirmAnswer: (idx, label) => {
        setPendingOption(null);
        onOptionConfirmed?.(idx, label);
      },
      onHelpRequested: () => {
        onHelpRequested?.();
      },
      announceSpeech: (text, priority) => {
        voiceFeedbackService.speak(text, priority);
        announce(text, priority === 'urgent' ? 'assertive' : 'polite');
      },
    });
  }

  // Keyboard Detector Ref
  const keyboardDetectorRef = useRef<KeyboardInteractionDetector | null>(null);
  if (!keyboardDetectorRef.current) {
    keyboardDetectorRef.current = new KeyboardInteractionDetector({
      getQuestionId: () => questionId,
      getSessionId: () => sessionId,
      onOptionSelected: (idx) => {
        const label = String.fromCharCode(65 + idx);
        setPendingOption(label);
        onOptionSelected?.(idx, label);
        voiceFeedbackService.speak(`Option ${label} selected.`);
      },
      onConfirm: () => {
        interactionManagerRef.current?.confirmCurrentPending();
      },
      onHelpRequested: () => {
        voiceFeedbackService.speak('Assistance request registered.', 'urgent');
        onHelpRequested?.();
      },
      onInvalidKey: () => {
        voiceFeedbackService.speak('Invalid key. Please select an available option.');
      },
      onEventCaptured: (evt) => {
        // Fire & forget telemetry event to backend
        accessibilityApi.postMonitoringEvent({
          eventType: 'KEYBOARD_ACTION',
          key: evt.key,
          questionId: evt.questionId,
          sessionId: evt.sessionId,
          timestamp: evt.timestamp,
        });
      },
    });
  }

  // Update dynamic callbacks
  useEffect(() => {
    interactionManagerRef.current?.updateConfig({
      onSelectOption: (idx, label) => {
        setPendingOption(label);
        onOptionSelected?.(idx, label);
      },
      onConfirmAnswer: (idx, label) => {
        setPendingOption(null);
        onOptionConfirmed?.(idx, label);
      },
      onHelpRequested: () => {
        onHelpRequested?.();
      },
    });

    keyboardDetectorRef.current?.updateOptions({
      getQuestionId: () => questionId,
      getSessionId: () => sessionId,
      onOptionSelected: (idx) => {
        const label = String.fromCharCode(65 + idx);
        setPendingOption(label);
        onOptionSelected?.(idx, label);
        voiceFeedbackService.speak(`Option ${label} selected.`);
      },
      onConfirm: () => {
        interactionManagerRef.current?.confirmCurrentPending();
      },
      onHelpRequested: () => {
        voiceFeedbackService.speak('Assistance request registered.', 'urgent');
        onHelpRequested?.();
      },
    });
  }, [questionId, sessionId, onOptionSelected, onOptionConfirmed, onHelpRequested]);

  // Adjust speech rate if in Child Mode (Requirement #6)
  useEffect(() => {
    if (mode === 'CHILD') {
      voiceFeedbackService.setRateMultiplier(childModeConfig.speechRateMultiplier);
    } else {
      voiceFeedbackService.setRateMultiplier(1.0);
    }
  }, [mode, childModeConfig]);

  // Initialize or Stop Camera Stream
  const startCamera = useCallback(async () => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unavailable');
      return;
    }

    try {
      setCameraStatus('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 10, max: 15 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      // Hidden video element for MediaPipe & Canvas processing
      if (!videoRef.current) {
        const video = document.createElement('video');
        video.playsInline = true;
        video.muted = true;
        video.style.display = 'none';
        document.body.appendChild(video);
        videoRef.current = video;
      }

      if (!canvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
        canvasRef.current = canvas;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setCameraStatus('connected');

      // Post Camera Connected event (telemetry only)
      accessibilityApi.postMonitoringEvent({
        eventType: 'CAMERA_CONNECTED',
        sessionId,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setCameraStatus(isDenied ? 'denied' : 'unavailable');
      console.warn('AI Monitoring Camera initialization notice:', err?.message || err);

      // Graceful notification: inform user via accessible voice/screen reader
      const message = isDenied
        ? 'Camera access was declined. Examination monitoring is operating in keyboard and screen-reader mode.'
        : 'Webcam is currently unavailable. Examination proceeds normally.';
      announce(message, 'polite');
    }
  }, [enabled, sessionId, announce]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      if (videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
      }
      videoRef.current = null;
    }
    if (canvasRef.current && canvasRef.current.parentNode) {
      canvasRef.current.parentNode.removeChild(canvasRef.current);
      canvasRef.current = null;
    }
    if (loopTimerRef.current) {
      clearInterval(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    gestureClassifier.cleanup();
    presenceDetector.reset();
    setCameraStatus('off');
  }, []);

  // Frame Processing Loop (Configurable FPS: 10 frames per second, Requirement #11)
  useEffect(() => {
    if (cameraStatus !== 'connected' || !videoRef.current || !canvasRef.current) {
      return;
    }

    const PROCESSING_INTERVAL_MS = 100; // 10 FPS
    let isProcessing = false;

    loopTimerRef.current = setInterval(async () => {
      if (isProcessing || !videoRef.current || !canvasRef.current) return;
      if (videoRef.current.readyState < 2) return;

      isProcessing = true;
      try {
        const now = Date.now();

        // 1. Presence Detection with 3-second absence threshold
        const presence = presenceDetector.analyzeCanvasFrame(
          canvasRef.current,
          videoRef.current,
          now
        );

        setPresenceStatus(presence.status);
        setPresenceAlert(presence.alertMessage);
        setAbsenceDuration(presence.absenceDuration);

        // Continuous absence warning trigger (Requires >= 3.0s continuous absence)
        if (presence.alertTriggered && presence.alertMessage) {
          if (now - lastAlertAnnounceRef.current > 8000) {
            voiceFeedbackService.speak(presence.alertMessage, 'urgent');
            announce(presence.alertMessage, 'assertive');
            lastAlertAnnounceRef.current = now;

            // Report event to backend
            accessibilityApi.postMonitoringEvent({
              eventType: 'CANDIDATE_ABSENT',
              sessionId,
              questionId,
              timestamp: now,
              details: { absenceDuration: presence.absenceDuration },
            });
          }
        }

        // 2. Hand Gesture Detection (MediaPipe Hands)
        const landmarks = await gestureClassifier.detectHandLandmarks(videoRef.current);
        if (landmarks && landmarks.length >= 21) {
          const gestureResult = gestureClassifier.classifyGesture(landmarks, now);
          setActiveGesture(gestureResult.gesture);
          setGestureConfidence(gestureResult.confidence);

          if (gestureResult.gesture !== 'UNKNOWN' && gestureResult.confidence >= 0.70) {
            interactionManagerRef.current?.handleGesture(gestureResult);

            // Report gesture event
            accessibilityApi.postMonitoringEvent({
              eventType: 'GESTURE_DETECTED',
              gesture: gestureResult.gesture,
              confidence: gestureResult.confidence,
              questionId,
              sessionId,
              timestamp: now,
            });
          }
        } else {
          setActiveGesture('UNKNOWN');
          setGestureConfidence(0);
        }
      } catch (loopErr) {
        // Safe processing loop error catch
      } finally {
        isProcessing = false;
      }
    }, PROCESSING_INTERVAL_MS);

    return () => {
      if (loopTimerRef.current) {
        clearInterval(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    };
  }, [cameraStatus, questionId, sessionId, announce]);

  // Keyboard Event Listener Lifecycle
  useEffect(() => {
    if (!enabled) return;
    keyboardDetectorRef.current?.startListening();
    return () => {
      keyboardDetectorRef.current?.stopListening();
    };
  }, [enabled]);

  // Overall Lifecycle Management
  useEffect(() => {
    if (enabled) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [enabled, startCamera, stopCamera]);

  return {
    cameraStatus,
    presenceStatus,
    presenceAlert,
    activeGesture,
    gestureConfidence,
    pendingOption,
    voiceEnabled,
    absenceDuration,
    fps: 10,
    mode,
    childModeConfig,
    setMode,
    setChildModeConfig,
    toggleVoice: () => {
      const next = !voiceEnabled;
      setVoiceEnabled(next);
      voiceFeedbackService.setEnabled(next);
    },
    confirmPendingOption: () => {
      interactionManagerRef.current?.confirmCurrentPending();
    },
    clearPendingOption: () => {
      interactionManagerRef.current?.clearPending();
      setPendingOption(null);
    },
    retryCamera: startCamera,
    stopCamera,
  };
}
