/**
 * GoWow Speech Synthesis & Accessible Speech Queue Service
 * Enforces Section 11, 12, 13, 14 & 15:
 * Reusable speech engine with queue control, pause/resume, rate adjustment,
 * dynamic voice discovery, and language-aware voice selection.
 */

export interface SpeechQueueItem {
  id: string;
  text: string;
  priority?: 'normal' | 'urgent';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export type SpeechRate = 0.75 | 0.8 | 1.0 | 1.25 | 1.3 | 1.5 | 1.75 | 2.0;

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private queue: SpeechQueueItem[] = [];
  private isProcessing = false;
  private rate: SpeechRate = 1.0;
  private volume = 1.0;
  private language = 'en-US';
  private selectedVoiceURI: string | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private voiceListeners: Array<(voices: SpeechSynthesisVoice[]) => void> = [];
  private lastSpokenText = '';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
    }
  }

  private initVoices(): void {
    if (!this.synth) return;

    const loadVoices = () => {
      const voices = this.synth?.getVoices() || [];
      if (voices.length > 0) {
        this.cachedVoices = voices;
        this.voiceListeners.forEach((listener) => listener(voices));
      }
    };

    loadVoices();
    if ('onvoiceschanged' in this.synth) {
      this.synth.onvoiceschanged = loadVoices;
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
    this.language = lang === 'hi' || lang.startsWith('hi') ? 'hi-IN' : 'en-US';
  }

  public getLanguage(): string {
    return this.language;
  }

  public setSelectedVoice(voiceURI: string | null): void {
    this.selectedVoiceURI = voiceURI;
  }

  public getSelectedVoice(): string | null {
    return this.selectedVoiceURI;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0 && this.synth) {
      this.cachedVoices = this.synth.getVoices();
    }
    return this.cachedVoices;
  }

  /**
   * Returns voices matching a language code ('en', 'hi', etc.)
   */
  public getVoicesForLanguage(lang: string): SpeechSynthesisVoice[] {
    const all = this.getVoices();
    const cleanLang = lang.toLowerCase();
    const isHindi = cleanLang.startsWith('hi');

    if (isHindi) {
      const hindiVoices = all.filter(
        (v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi')
      );
      return hindiVoices;
    }

    // Default to English matching
    const englishVoices = all.filter((v) => v.lang.toLowerCase().startsWith('en'));
    return englishVoices.length > 0 ? englishVoices : all;
  }

  /**
   * Subscribe to voice list changes (useful when browser asynchronously loads OS voices).
   */
  public onVoicesChanged(callback: (voices: SpeechSynthesisVoice[]) => void): () => void {
    this.voiceListeners.push(callback);
    if (this.cachedVoices.length > 0) {
      callback(this.cachedVoices);
    }
    return () => {
      this.voiceListeners = this.voiceListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Speak text with orderly queue management and voice selection.
   * If priority is 'urgent', cancels ongoing speech and jumps to the front.
   */
  public speak(
    text: string,
    options: {
      priority?: 'normal' | 'urgent';
      voiceURI?: string;
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
      this.processNextInQueue(options.voiceURI);
    }
  }

  private processNextInQueue(overrideVoiceURI?: string): void {
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

    // Resolve matching or user-selected voice
    const allVoices = this.getVoices();
    const targetVoiceURI = overrideVoiceURI || this.selectedVoiceURI;
    if (targetVoiceURI) {
      const selected = allVoices.find((v) => v.voiceURI === targetVoiceURI);
      if (selected) {
        utterance.voice = selected;
      }
    }

    if (!utterance.voice && allVoices.length > 0) {
      const languageVoices = this.getVoicesForLanguage(this.language);
      if (languageVoices.length > 0) {
        utterance.voice = languageVoices[0];
      }
    }

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

  public testVoiceSample(lang: string, voiceURI?: string): void {
    const isHindi = lang === 'hi' || lang.startsWith('hi');
    const sampleText = isHindi
      ? 'DRISHTI आपकी सुलभ परीक्षा और अभ्यास सत्र के लिए तैयार है।'
      : 'DRISHTI is ready for your accessible examination and practice session.';

    this.setLanguage(lang);
    this.speak(sampleText, {
      priority: 'urgent',
      voiceURI,
    });
  }
}

export const speechService = new SpeechService();
