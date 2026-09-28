import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Play,
  Square,
  Pause,
  RotateCcw,
  RotateCw,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { learningService } from '../../services/learningService';
import { AudioBookmark } from '../../types/learning';

interface AudioLearningPlayerProps {
  topicId: string;
  textToRead: string;
  sectionTitle?: string;
}

export const AudioLearningPlayer: React.FC<AudioLearningPlayerProps> = ({
  topicId,
  textToRead,
  sectionTitle = 'this topic lesson',
}) => {
  const { speak, stopSpeaking, isSpeaking, isSpeechSupported, announce } =
    useAccessibility();

  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentSeconds, setCurrentSeconds] = useState<number>(0);
  const [bookmarks, setBookmarks] = useState<AudioBookmark[]>([]);
  const [savedResumePosition, setSavedResumePosition] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState('');

  // Estimate total audio length based on words (approx 150 words/min)
  const wordCount = textToRead.split(/\s+/).filter(Boolean).length;
  const estimatedTotalSeconds = Math.max(60, Math.round((wordCount / 150) * 60));

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autosaveRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds to mm:ss
  const formatTime = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Load persisted sleep-safe state from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadAudioState() {
      try {
        const state = await learningService.getAudioState(topicId);
        if (!isMounted || !state) return;
        setBookmarks(state.audio_bookmarks || []);
        setPlaybackSpeed(state.audio_playback_speed || 1.0);
        setIsCompleted(state.audio_completed || false);
        if (state.audio_position_seconds > 5) {
          setSavedResumePosition(state.audio_position_seconds);
          setCurrentSeconds(state.audio_position_seconds);
        }
      } catch {
        // Fallback to local defaults if offline
      }
    }
    loadAudioState();
    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [topicId]);

  // Autosave position and state helper
  const persistAudioState = useCallback(
    async (pos: number, bms: AudioBookmark[], spd: number, comp: boolean) => {
      try {
        await learningService.updateAudioState(topicId, {
          audio_position_seconds: pos,
          audio_bookmarks: bms,
          audio_playback_speed: spd,
          audio_completed: comp,
        });
      } catch {
        // Soft fail
      }
    },
    [topicId]
  );

  // Position increment clock while speaking
  useEffect(() => {
    if (isSpeaking && !isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentSeconds((prev) => {
          const next = prev + 1 * playbackSpeed;
          if (next >= estimatedTotalSeconds) {
            setIsCompleted(true);
            announce(`Lesson audio completed for ${sectionTitle}`);
            persistAudioState(estimatedTotalSeconds, bookmarks, playbackSpeed, true);
            return estimatedTotalSeconds;
          }
          return next;
        });
      }, 1000);

      // Autosave position to server every 10 seconds
      autosaveRef.current = setInterval(() => {
        setCurrentSeconds((curr) => {
          persistAudioState(curr, bookmarks, playbackSpeed, isCompleted);
          return curr;
        });
      }, 10000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [isSpeaking, isPaused, playbackSpeed, estimatedTotalSeconds, bookmarks, isCompleted, persistAudioState, sectionTitle, announce]);

  // Controls
  const handlePlay = (startPos?: number) => {
    if (!isSpeechSupported) {
      setNotice('Speech synthesis is not supported in this browser.');
      announce('Speech synthesis is not supported on this browser.');
      return;
    }

    if (window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      announce(`Resuming lesson narration at ${formatTime(currentSeconds)}`);
      return;
    }

    const pos = startPos !== undefined ? startPos : currentSeconds;
    setCurrentSeconds(pos);
    setNotice(null);
    setIsPaused(false);

    // Speak content
    speak(textToRead);
    announce(`Playing audio lesson: ${sectionTitle} from ${formatTime(pos)}`);
    setSavedResumePosition(null);
  };

  const handlePause = () => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      announce(`Audio lesson paused at ${formatTime(currentSeconds)}`);
      persistAudioState(currentSeconds, bookmarks, playbackSpeed, isCompleted);
    }
  };

  const handleStop = () => {
    stopSpeaking();
    setIsPaused(false);
    announce(`Audio playback stopped at ${formatTime(currentSeconds)}`);
    persistAudioState(currentSeconds, bookmarks, playbackSpeed, isCompleted);
  };

  const handleSeek = (offsetSecs: number) => {
    const newPos = Math.max(0, Math.min(estimatedTotalSeconds, currentSeconds + offsetSecs));
    setCurrentSeconds(newPos);
    announce(`Jumped to ${formatTime(newPos)}`);
    persistAudioState(newPos, bookmarks, playbackSpeed, isCompleted);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    announce(`Playback speed set to ${speed}x`);
    persistAudioState(currentSeconds, bookmarks, speed, isCompleted);
  };

  const handleAddBookmark = async () => {
    const newBookmark: AudioBookmark = {
      id: `bm-${Date.now()}`,
      timestamp_seconds: currentSeconds,
      label: bookmarkLabel.trim() || `Bookmark at ${formatTime(currentSeconds)}`,
      created_at: new Date().toISOString(),
    };
    const updated = [...bookmarks, newBookmark];
    setBookmarks(updated);
    setBookmarkLabel('');
    setIsAddingBookmark(false);
    announce(`Bookmark added at ${formatTime(currentSeconds)}: ${newBookmark.label}`);
    await persistAudioState(currentSeconds, updated, playbackSpeed, isCompleted);
  };

  const handleDeleteBookmark = async (bmId: string) => {
    const updated = bookmarks.filter((b) => b.id !== bmId);
    setBookmarks(updated);
    announce('Bookmark removed.');
    await persistAudioState(currentSeconds, updated, playbackSpeed, isCompleted);
  };

  const handleJumpToBookmark = (bm: AudioBookmark) => {
    setCurrentSeconds(bm.timestamp_seconds);
    announce(`Jumped to bookmark ${bm.label} at ${formatTime(bm.timestamp_seconds)}`);
    if (!isSpeaking) {
      handlePlay(bm.timestamp_seconds);
    }
  };

  const progressPercent = Math.min(100, Math.round((currentSeconds / estimatedTotalSeconds) * 100));

  return (
    <section
      aria-label={`Accessible Audio Lesson Player for ${sectionTitle}`}
      className="p-5 rounded-2xl border-2 border-primary/20 bg-surface-elevated/50 shadow-md my-4 flex flex-col gap-4"
    >
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary text-primary-contrast shadow-sm" aria-hidden="true">
            {isSpeaking && !isPaused ? (
              <Volume2 className="w-5 h-5 animate-pulse" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>{sectionTitle} — Audio Lesson Walkthrough</span>
              {isCompleted && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-success-bg text-status-success border border-status-success">
                  Completed
                </span>
              )}
            </h2>
            <p className="text-[11px] text-foreground-secondary">
              Sleep-safe audio player: bookmark key formulas, adjust speed, and resume seamlessly.
            </p>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[11px] font-mono font-bold text-foreground-muted mr-1">Speed:</span>
          {[0.75, 1.0, 1.25, 1.5].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => handleSpeedChange(spd)}
              aria-pressed={playbackSpeed === spd}
              className={`px-2 py-1 rounded text-xs font-mono font-bold transition-all ${
                playbackSpeed === spd
                  ? 'bg-primary text-primary-contrast shadow-xs'
                  : 'bg-surface hover:bg-surface-elevated border border-border text-foreground-secondary'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Sleep-Safe Resume Banner */}
      {savedResumePosition && !isSpeaking && (
        <div
          role="region"
          aria-label="Resume audio playback"
          className="p-3 rounded-xl border border-primary/40 bg-primary/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Resume listening:</strong> You previously paused at{' '}
              <span className="font-mono font-bold text-foreground">{formatTime(savedResumePosition)}</span>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePlay(savedResumePosition)}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-contrast font-bold hover:bg-primary-hover shadow-xs text-xs"
            >
              Resume ({formatTime(savedResumePosition)})
            </button>
            <button
              type="button"
              onClick={() => {
                setSavedResumePosition(null);
                handlePlay(0);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-elevated text-xs"
            >
              Restart (00:00)
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar & Time Display */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-foreground font-semibold">
          <span className="text-primary font-bold">{formatTime(currentSeconds)}</span>
          <span className="text-foreground-muted">{formatTime(estimatedTotalSeconds)}</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Lesson audio progress: ${progressPercent} percent completed`}
          className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = clickX / rect.width;
            const targetSec = Math.round(pct * estimatedTotalSeconds);
            handleSeek(targetSec - currentSeconds);
          }}
        >
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Player Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Rewind 10s */}
          <button
            type="button"
            onClick={() => handleSeek(-10)}
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-foreground min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Main Play / Pause */}
          {!isSpeaking || isPaused ? (
            <button
              type="button"
              onClick={() => handlePlay()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-contrast hover:bg-primary-hover font-bold text-xs shadow min-h-[40px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={isPaused ? 'Resume lesson audio' : 'Play lesson audio'}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isPaused ? 'Resume' : 'Play Audio'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated border border-border text-foreground hover:bg-surface font-bold text-xs min-h-[40px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Pause lesson audio"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          {/* Forward 10s */}
          <button
            type="button"
            onClick={() => handleSeek(10)}
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-foreground min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Stop Button */}
          {(isSpeaking || isPaused) && (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-foreground-secondary min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Stop playback"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>

        {/* Add Bookmark Action */}
        <div className="flex items-center gap-2">
          {!isAddingBookmark ? (
            <button
              type="button"
              onClick={() => setIsAddingBookmark(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/30 bg-surface hover:bg-surface-elevated text-primary text-xs font-semibold min-h-[40px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Bookmark current audio lesson timestamp"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Add Bookmark</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Note (e.g. Formula derivation)"
                value={bookmarkLabel}
                onChange={(e) => setBookmarkLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBookmark()}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Bookmark label"
              />
              <button
                type="button"
                onClick={handleAddBookmark}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-contrast font-bold text-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAddingBookmark(false)}
                className="text-xs text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bookmarks List */}
      {bookmarks.length > 0 && (
        <div className="pt-3 border-t border-border flex flex-col gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
            <span>Audio Bookmarks ({bookmarks.length})</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border bg-surface text-xs font-medium"
              >
                <button
                  type="button"
                  onClick={() => handleJumpToBookmark(bm)}
                  className="inline-flex items-center gap-1.5 text-foreground hover:text-primary focus:outline-none focus-visible:underline"
                  aria-label={`Jump to bookmark ${bm.label} at ${formatTime(bm.timestamp_seconds)}`}
                >
                  <Clock className="w-3 h-3 text-primary" />
                  <span className="font-mono font-bold text-primary">{formatTime(bm.timestamp_seconds)}</span>
                  <span>{bm.label}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBookmark(bm.id)}
                  className="text-foreground-muted hover:text-status-error p-0.5 rounded focus:outline-none"
                  aria-label={`Delete bookmark ${bm.label}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {notice && (
        <div
          role="alert"
          className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
    </section>
  );
};
