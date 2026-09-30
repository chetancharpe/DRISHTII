/**
 * Web Audio API Acoustic Sound Effects (Earcons)
 * Generates lightweight, synthesized audio cues for visually impaired navigation:
 * - 'recognize': Soft double chime when a voice command is understood
 * - 'action': Upbeat chord when an action (e.g. practice start) executes
 * - 'navigate': Gentle harmonic whoosh on page transition
 * - 'listen': Subtle rising tone when microphone activates
 * - 'pause': Soft descending tone when microphone pauses
 * - 'error': Subtle low rumble when command is unrecognized
 * 
 * Zero external MP3 files, zero latency, pure browser synthesis.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export type EarconType = 'recognize' | 'action' | 'navigate' | 'listen' | 'pause' | 'error';

export function playEarcon(type: EarconType, volume = 0.15) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.connect(ctx.destination);

    if (type === 'recognize') {
      // Pleasant double ping (C6 -> G6)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now); // C6
      osc1.connect(gainNode);
      osc1.start(now);
      osc1.stop(now + 0.08);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1567.98, now + 0.09); // G6
      osc2.connect(gainNode);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.18);

      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    } else if (type === 'action') {
      // Upbeat major triad chord (E5 -> G5 -> C6)
      [659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        osc.connect(gainNode);
        osc.start(now + idx * 0.04);
        osc.stop(now + 0.24);
      });
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    } else if (type === 'navigate') {
      // Gentle page transition tone (A5)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.14);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    } else if (type === 'listen') {
      // Rising tone indicating mic on
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1);
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.12);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else if (type === 'pause') {
      // Descending tone indicating mic paused
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.12);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else if (type === 'error') {
      // Subtle low rumble
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.12);
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.14);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    }
  } catch {
    // Audio context may be restricted before user gesture
  }
}
