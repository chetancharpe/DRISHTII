/**
 * AI Accessibility & Interaction Monitoring: Interaction Manager
 * State machine managing Gesture -> Confirmation -> Exam Action pipeline.
 * Ensures accidental gestures do not immediately modify or submit exam state.
 */

import { GestureActionResult } from '../../types/accessibilityMonitoring';
import { voiceFeedbackService } from './voiceFeedbackService';

export interface InteractionManagerConfig {
  confirmationTimeoutMs?: number;
  onSelectOption: (optionIndex: number, optionLabel: string) => void;
  onConfirmAnswer: (optionIndex: number, optionLabel: string) => void;
  onHelpRequested: () => void;
  announceSpeech?: (text: string, priority?: 'urgent' | 'normal') => void;
}

export class InteractionManager {
  private config: InteractionManagerConfig;
  private pendingOptionIndex: number | null = null;
  private pendingOptionLabel: string | null = null;
  private confirmationTimer: any = null;

  constructor(config: InteractionManagerConfig) {
    this.config = config;
  }

  public updateConfig(config: Partial<InteractionManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getPendingOption(): { index: number; label: string } | null {
    if (this.pendingOptionIndex !== null && this.pendingOptionLabel !== null) {
      return { index: this.pendingOptionIndex, label: this.pendingOptionLabel };
    }
    return null;
  }

  /**
   * Processes a classified hand gesture through the confirmation gate.
   */
  public handleGesture(gestureResult: GestureActionResult): void {
    const { gesture, confidence } = gestureResult;
    if (confidence < 0.65 || gesture === 'UNKNOWN') return;

    const speak = this.config.announceSpeech || ((t: string, p?: 'urgent' | 'normal') => voiceFeedbackService.speak(t, p));

    // Handle Option Gestures (1, 2, 3, 4)
    if (
      gesture === 'OPTION_1' ||
      gesture === 'OPTION_2' ||
      gesture === 'OPTION_3' ||
      gesture === 'OPTION_4'
    ) {
      const optNum = parseInt(gesture.split('_')[1], 10);
      const optIdx = optNum - 1;
      const optLabel = String.fromCharCode(65 + optIdx); // A, B, C, D

      // Set as pending option
      this.pendingOptionIndex = optIdx;
      this.pendingOptionLabel = optLabel;

      // Trigger soft UI highlight in exam system
      this.config.onSelectOption(optIdx, optLabel);

      // Announce guidance to candidate
      speak(`Option ${optNum} selected. Show thumbs up or press Enter to confirm.`);

      // Reset any previous timeout
      if (this.confirmationTimer) {
        clearTimeout(this.confirmationTimer);
      }
      const timeoutMs = this.config.confirmationTimeoutMs || 6000;
      this.confirmationTimer = setTimeout(() => {
        if (this.pendingOptionIndex !== null) {
          this.clearPending();
        }
      }, timeoutMs);
    }
    // Handle CONFIRM Gesture (Thumbs Up)
    else if (gesture === 'CONFIRM') {
      if (this.pendingOptionIndex !== null && this.pendingOptionLabel !== null) {
        const confirmedIdx = this.pendingOptionIndex;
        const confirmedLabel = this.pendingOptionLabel;
        this.clearPending();

        // Commit answer to exam system
        this.config.onConfirmAnswer(confirmedIdx, confirmedLabel);
        speak('Answer confirmed.', 'urgent');
      }
    }
    // Handle HELP Gesture (Open Palm)
    else if (gesture === 'HELP') {
      speak('Assistance request registered.', 'urgent');
      this.config.onHelpRequested();
    }
  }

  public confirmCurrentPending(): void {
    if (this.pendingOptionIndex !== null && this.pendingOptionLabel !== null) {
      const idx = this.pendingOptionIndex;
      const label = this.pendingOptionLabel;
      this.clearPending();
      this.config.onConfirmAnswer(idx, label);
      const speak = this.config.announceSpeech || ((t: string, p?: 'urgent' | 'normal') => voiceFeedbackService.speak(t, p));
      speak('Answer confirmed.', 'urgent');
    }
  }

  public clearPending(): void {
    this.pendingOptionIndex = null;
    this.pendingOptionLabel = null;
    if (this.confirmationTimer) {
      clearTimeout(this.confirmationTimer);
      this.confirmationTimer = null;
    }
  }
}
