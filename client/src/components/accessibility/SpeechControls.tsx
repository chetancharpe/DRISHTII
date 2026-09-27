import React, { useState } from 'react';
import { speechService, SpeechRate } from '../../services/speechService';

export const SpeechControls: React.FC<{
  currentText?: string;
  className?: string;
}> = ({ currentText, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRate, setCurrentRate] = useState<SpeechRate>(1.0);

  const handlePlay = () => {
    if (isPaused) {
      speechService.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else if (currentText) {
      speechService.speak(currentText, {
        priority: 'urgent',
        onStart: () => {
          setIsPlaying(true);
          setIsPaused(false);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
      });
    }
  };

  const handlePause = () => {
    speechService.pause();
    setIsPaused(true);
  };

  const handleStop = () => {
    speechService.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleReplay = () => {
    speechService.replay();
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handleRateChange = (rate: SpeechRate) => {
    setCurrentRate(rate);
    speechService.setRate(rate);
  };

  return (
    <div
      role="region"
      aria-label="Speech Player and Speed Controls"
      className={`inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs ${className}`}
    >
      {/* Play / Resume */}
      {!isPlaying || isPaused ? (
        <button
          type="button"
          onClick={handlePlay}
          aria-label={isPaused ? 'Resume speech' : 'Listen aloud'}
          title={isPaused ? 'Resume' : 'Listen'}
          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          ▶ <span className="sr-only">Play speech</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePause}
          aria-label="Pause speech"
          title="Pause"
          className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          ⏸ <span className="sr-only">Pause speech</span>
        </button>
      )}

      {/* Stop */}
      <button
        type="button"
        onClick={handleStop}
        aria-label="Stop speech"
        title="Stop"
        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        ⏹ <span className="sr-only">Stop speech</span>
      </button>

      {/* Replay */}
      <button
        type="button"
        onClick={handleReplay}
        aria-label="Replay last spoken text"
        title="Replay"
        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        🔄 <span className="sr-only">Replay speech</span>
      </button>

      <span className="w-px h-3.5 bg-slate-700" aria-hidden="true" />

      {/* Rate Buttons */}
      <div className="flex items-center gap-1">
        {([0.75, 1.0, 1.25, 1.5] as SpeechRate[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleRateChange(r)}
            aria-pressed={currentRate === r}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              currentRate === r
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {r}x
          </button>
        ))}
      </div>
    </div>
  );
};
