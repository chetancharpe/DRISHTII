/**
 * GoWow Speech Synthesis & Accessible Speech Queue Service
 * Enforces Section 11, 12, 13, 14 & 15:
 * Reusable speech engine with queue control, pause/resume, and rate adjustment.
 */

export interface SpeechQueueItem {
  id: string;
  text: string;
  priority?: 'normal' | 'urgent';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export type SpeechRate = 0.75 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0;

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private queue: SpeechQueueItem[] = [];
  private isProcessing = false;
  private rate: SpeechRate = 1.0;
  private volume = 1.0;
  private language = 'en-US';
  private lastSpokenText = '';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  public isPaused(): boolean {
    return this.synth ? this.synth.paused : false;
  }

  public setRate(rate: SpeechRate): void {
    this.rate = rate;
  }

  public getRate(): SpeechRate {
    return this.rate;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public setLanguage(lang: string): void {
    this.language = lang === 'hi' ? 'hi-IN' : 'en-US';
  }

  /**
   * Speak text with orderly queue management.
   * If priority is 'urgent', cancels ongoing speech and jumps to the front.
   */
  public speak(
    text: string,
    options: {
      priority?: 'normal' | 'urgent';
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ): void {
    if (!this.synth || !text.trim()) return;

    this.lastSpokenText = text;

    if (options.priority === 'urgent') {
      this.stop();
      this.queue = [];
    }

    const item: SpeechQueueItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: text.trim(),
      priority: options.priority || 'normal',
      onStart: options.onStart,
      onEnd: options.onEnd,
    };

    this.queue.push(item);

    if (!this.isProcessing) {
      this.processNextInQueue();
    }
  }

  private processNextInQueue(): void {
    if (!this.synth || this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const nextItem = this.queue.shift();
    if (!nextItem) {
      this.isProcessing = false;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(nextItem.text);
    utterance.rate = this.rate;
    utterance.volume = this.volume;
    utterance.lang = this.language;

    utterance.onstart = () => {
      if (nextItem.onStart) nextItem.onStart();
    };

    utterance.onend = () => {
      if (nextItem.onEnd) nextItem.onEnd();
      this.processNextInQueue();
    };

    utterance.onerror = (err) => {
      if (nextItem.onError) nextItem.onError(err);
      this.processNextInQueue();
    };

    this.synth.speak(utterance);
  }

  public stop(): void {
    if (!this.synth) return;
    this.queue = [];
    this.synth.cancel();
    this.isProcessing = false;
  }

  public pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public replay(): void {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText, { priority: 'urgent' });
    }
  }
}

export const speechService = new SpeechService();
