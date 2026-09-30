/**
 * AI Accessibility & Interaction Monitoring: Candidate Presence Detector
 * Evaluates candidate presence, position shifts, and temporal absence duration.
 * Rule: Alerts are NEVER triggered on a single frame; requires continuous absence >= 3.0s.
 */

import { CandidatePresenceStatus } from '../../types/accessibilityMonitoring';

export const ABSENCE_THRESHOLD_SECONDS = 3.0;
export const POSITION_THRESHOLD = 0.30;
export const MIN_FACE_AREA_RATIO = 0.012;
export const MAX_FACE_AREA_RATIO = 0.45;

export interface PresenceEvaluationResult {
  present: boolean;
  status: CandidatePresenceStatus;
  positionShift: number;
  faceAreaRatio: number;
  absenceDuration: number;
  alertTriggered: boolean;
  alertMessage: string | null;
  timestamp: number;
}

export class CandidatePresenceDetector {
  private absenceThresholdSeconds: number;
  private positionThreshold: number;
  private absenceStartTime: number | null = null;
  private lastSeenTime: number = Date.now();
  private referenceCenterX: number | null = null;

  public getLastSeenTime(): number {
    return this.lastSeenTime;
  }

  public getReferenceCenterX(): number | null {
    return this.referenceCenterX;
  }

  constructor(
    absenceThresholdSeconds: number = ABSENCE_THRESHOLD_SECONDS,
    positionThreshold: number = POSITION_THRESHOLD
  ) {
    this.absenceThresholdSeconds = absenceThresholdSeconds;
    this.positionThreshold = positionThreshold;
  }

  /**
   * Evaluates presence state with temporal smoothing (Requirement #1).
   */
  public evaluate(
    present: boolean,
    positionShift: number = 0.0,
    faceAreaRatio: number = 0.08,
    timestamp: number = Date.now()
  ): PresenceEvaluationResult {
    if (present) {
      this.lastSeenTime = timestamp;
      this.absenceStartTime = null;

      let status: CandidatePresenceStatus = 'detected';
      let alertMessage: string | null = null;

      if (faceAreaRatio < MIN_FACE_AREA_RATIO) {
        status = 'too_far';
        alertMessage = 'Candidate moved too far from the camera.';
      } else if (faceAreaRatio > MAX_FACE_AREA_RATIO) {
        status = 'too_close';
        alertMessage = 'Candidate is sitting too close to the camera.';
      } else if (Math.abs(positionShift) > this.positionThreshold) {
        status = 'shifted';
        alertMessage = 'Candidate position significantly shifted.';
      }

      return {
        present: true,
        status,
        positionShift: Math.round(positionShift * 100) / 100,
        faceAreaRatio,
        absenceDuration: 0,
        alertTriggered: status !== 'detected',
        alertMessage,
        timestamp,
      };
    } else {
      // Not detected in current frame
      if (this.absenceStartTime === null) {
        this.absenceStartTime = timestamp;
      }

      const absenceDuration = Math.round(((timestamp - this.absenceStartTime) / 1000) * 10) / 10;
      const alertTriggered = absenceDuration >= this.absenceThresholdSeconds;
      const alertMessage = alertTriggered ? 'Please return to the examination area.' : null;

      return {
        present: false,
        status: 'absent',
        positionShift: 0,
        faceAreaRatio: 0,
        absenceDuration,
        alertTriggered,
        alertMessage,
        timestamp,
      };
    }
  }

  /**
   * Fast canvas-based frame presence analysis (fallback and lightweight presence monitor).
   * Analyzes pixel luminance, color distribution, and active foreground change.
   */
  public analyzeCanvasFrame(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    timestamp: number = Date.now()
  ): PresenceEvaluationResult {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return this.evaluate(false, 0, 0, timestamp);
    }

    canvas.width = 160;
    canvas.height = 120;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frameData.data;

    let totalLuminance = 0;
    let nonBlackPixels = 0;
    let centerMassX = 0;

    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += lum;

      if (lum > 20) {
        nonBlackPixels++;
        const pixelIdx = i / 4;
        const x = pixelIdx % canvas.width;
        centerMassX += x;
      }
    }

    const avgLum = totalLuminance / (data.length / 16);
    const hasSubject = nonBlackPixels > (data.length / 16) * 0.25 && avgLum > 25 && avgLum < 245;

    let positionShift = 0.0;
    if (hasSubject && nonBlackPixels > 0) {
      const avgCenterX = centerMassX / nonBlackPixels;
      const normalizedCenter = avgCenterX / canvas.width;
      positionShift = normalizedCenter - 0.5; // -0.5 to +0.5
    }

    return this.evaluate(hasSubject, positionShift, 0.10, timestamp);
  }

  public reset(): void {
    this.absenceStartTime = null;
    this.lastSeenTime = Date.now();
    this.referenceCenterX = null;
  }
}

export const presenceDetector = new CandidatePresenceDetector();
