/**
 * AI Accessibility & Interaction Monitoring: Voice Feedback Service
 * Integrates Web Speech API (speechSynthesis) with:
 * - Interruptibility (cancels in-flight speech for urgent proctoring alerts)
 * - Anti-repetition debouncing (avoids repeating continuous presence warnings)
 * - Configurable speech rate (supports standard 1.0x and Child Mode 0.8x)
 * - Screen-reader compatibility
 */

export class VoiceFeedbackService {
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private isEnabled: boolean = true;
  private speechRateMultiplier: number = 1.0;
  private debounceWindowMs: number = 7000; // Do not repeat identical warning within 7 seconds

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Warm up voices
      };
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public setRateMultiplier(rate: number): void {
    this.speechRateMultiplier = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * Speaks accessible prompt aloud.
   * @param text Speech string
   * @param priority 'urgent' interrupts immediately; 'normal' queues or speaks cleanly
   */
  public speak(text: string, priority: 'urgent' | 'normal' = 'normal'): void {
    if (!this.isEnabled || !text.trim() || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    const now = Date.now();
    // Prevent repetitive loops of identical messages
    if (this.lastSpokenText === text && now - this.lastSpokenTime < this.debounceWindowMs) {
      return;
    }

    if (priority === 'urgent') {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.speechRateMultiplier;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      // Speech finished
    };

    utterance.onerror = () => {
      // Ignore synth cancellations
    };

    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    window.speechSynthesis.speak(utterance);
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceFeedbackService = new VoiceFeedbackService();
