/**
 * AI Accessibility & Interaction Monitoring: Keyboard Interaction Detector
 * Captures browser keyboard events (keydown, keyup) during exam sessions.
 * Dispatches structured events and validates candidate option selection.
 */

import { KeyboardMonitoringEvent } from '../../types/accessibilityMonitoring';

export interface KeyboardDetectorOptions {
  getQuestionId: () => string | undefined;
  getSessionId: () => string | undefined;
  onOptionSelected: (optionIndex: number, key: string) => void;
  onConfirm: () => void;
  onHelpRequested: () => void;
  onInvalidKey: (key: string) => void;
  onEventCaptured: (event: KeyboardMonitoringEvent) => void;
}

export class KeyboardInteractionDetector {
  private options: KeyboardDetectorOptions;
  private isListening: boolean = false;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: KeyboardDetectorOptions) {
    this.options = options;
  }

  public updateOptions(options: Partial<KeyboardDetectorOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public startListening(): void {
    if (this.isListening || typeof window === 'undefined') return;

    this.keydownHandler = (e: KeyboardEvent) => {
      // Don't intercept if candidate is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      const key = e.key;
      const questionId = this.options.getQuestionId();
      const sessionId = this.options.getSessionId();
      const now = Date.now();

      // Check valid exam controls
      if (key === '1' || key === 'a' || key === 'A') {
        this.options.onOptionSelected(0, key);
        this.emit(key, questionId, sessionId, now, true);
      } else if (key === '2' || key === 'b' || key === 'B') {
        this.options.onOptionSelected(1, key);
        this.emit(key, questionId, sessionId, now, true);
      } else if (key === '3' || key === 'c' || key === 'C') {
        this.options.onOptionSelected(2, key);
        this.emit(key, questionId, sessionId, now, true);
      } else if (key === '4' || key === 'd' || key === 'D') {
        this.options.onOptionSelected(3, key);
        this.emit(key, questionId, sessionId, now, true);
      } else if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        this.options.onConfirm();
        this.emit(key, questionId, sessionId, now, true);
      } else if (key === 'h' || key === 'H' || key === '?') {
        this.options.onHelpRequested();
        this.emit(key, questionId, sessionId, now, true);
      } else if (
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        key.length === 1 &&
        /[a-zA-Z0-9]/.test(key)
      ) {
        // Alphanumeric key pressed outside available option range
        this.options.onInvalidKey(key);
        this.emit(key, questionId, sessionId, now, false);
      }
    };

    this.keyupHandler = (_e: KeyboardEvent) => {
      // Keyup capture if needed for tracking
    };

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    this.isListening = true;
  }

  public stopListening(): void {
    if (this.keydownHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.keyupHandler && typeof window !== 'undefined') {
      window.removeEventListener('keyup', this.keyupHandler);
      this.keyupHandler = null;
    }
    this.isListening = false;
  }

  private emit(
    key: string,
    questionId: string | undefined,
    sessionId: string | undefined,
    timestamp: number,
    valid: boolean
  ): void {
    this.options.onEventCaptured({
      type: 'KEYBOARD_ACTION',
      key,
      questionId,
      sessionId,
      timestamp,
      valid,
    });
  }
}
