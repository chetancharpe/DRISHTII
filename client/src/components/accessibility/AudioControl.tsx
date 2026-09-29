import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { SpeechRateOption, TimerAnnouncementsOption } from '../../types/accessibility';
import { Volume2, VolumeX, Gauge, Clock, BookOpen } from 'lucide-react';
import { AudioTest } from './AudioTest';

export interface AudioControlProps {
  className?: string;
}

export const AudioControl: React.FC<AudioControlProps> = ({ className = '' }) => {
  const { preferences, updatePreference, announce } = useAccessibility();

  const handleToggleAudio = (enabled: boolean) => {
    updatePreference('audioEnabled', enabled);
    announce(enabled ? 'Audio assistance enabled.' : 'Audio assistance disabled.');
  };

  const handleRateChange = (rate: SpeechRateOption) => {
    updatePreference('speechRate', rate);
    announce(`Speech rate set to ${rate}.`);
  };

  const handleTimerChange = (val: TimerAnnouncementsOption) => {
    updatePreference('timerAnnouncements', val);
    announce(`Timer announcements set to ${val}.`);
  };

  const handleContentToggle = (key: 'readQuestions' | 'readOptions' | 'readInstructions' | 'announceStatus') => {
    const nextVal = !preferences[key];
    updatePreference(key, nextVal);
    announce(`${key} is now ${nextVal ? 'enabled' : 'disabled'}.`);
  };

  return (
    <section
      aria-labelledby="audio-assistance-heading"
      className={`flex flex-col gap-4 py-3 border-b border-border ${className}`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <h3 id="audio-assistance-heading" className="text-sm font-bold text-foreground">
            Audio Assistance
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-surface-elevated text-foreground-muted">
          {preferences.audioEnabled ? 'Active (Optional Voice)' : 'Disabled'}
        </span>
      </div>

      <p className="text-xs text-foreground-secondary leading-relaxed">
        Audio assistance can read selected questions, instructions, and important status messages aloud.
      </p>

      {/* Crucial Screen Reader Relationship Clarification (Section 12) */}
      <div
        role="note"
        className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground-secondary leading-relaxed flex items-start gap-2.5"
      >
        <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong className="text-foreground font-semibold">Screen Reader Compatibility: </strong>
          DRISHTI is designed to work seamlessly with your device's native screen reader (NVDA, JAWS, VoiceOver, TalkBack). Audio assistance is an additional optional feature.
        </p>
      </div>

      {/* Master Audio Toggle Switch / Radios */}
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Toggle Audio Assistance</legend>
        <div className="grid grid-cols-2 gap-3" role="radiogroup">
          <label
            htmlFor="audio-toggle-off"
            className={`
              flex items-center gap-2.5 p-3 rounded-lg border-2 cursor-pointer select-none
              transition-all min-h-[48px]
              ${
                !preferences.audioEnabled
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border bg-surface hover:bg-surface-elevated'
              }
            `.trim()}
          >
            <input
              type="radio"
              id="audio-toggle-off"
              name="master-audio-toggle"
              checked={!preferences.audioEnabled}
              onChange={() => handleToggleAudio(false)}
              className="sr-only"
            />
            <VolumeX className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">Off</span>
              <span className="text-[10px] text-foreground-muted">Screen reader only</span>
            </div>
          </label>

          <label
            htmlFor="audio-toggle-on"
            className={`
              flex items-center gap-2.5 p-3 rounded-lg border-2 cursor-pointer select-none
              transition-all min-h-[48px]
              ${
                preferences.audioEnabled
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border bg-surface hover:bg-surface-elevated'
              }
            `.trim()}
          >
            <input
              type="radio"
              id="audio-toggle-on"
              name="master-audio-toggle"
              checked={preferences.audioEnabled}
              onChange={() => handleToggleAudio(true)}
              className="sr-only"
            />
            <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">On</span>
              <span className="text-[10px] text-foreground-muted">Voice assistance enabled</span>
            </div>
          </label>
        </div>
      </fieldset>

      {/* Interactive Speech Test Component */}
      <AudioTest />

      {/* Fine-Tuned Audio Preferences (Visible when audio is enabled or for pre-configuration) */}
      <div className={`flex flex-col gap-4 pt-2 transition-opacity ${preferences.audioEnabled ? 'opacity-100' : 'opacity-60'}`}>
        {/* 1. Speech Rate */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
            <span className="text-xs font-bold text-foreground">Speech Rate</span>
          </div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Speech rate speed">
            {(['slow', 'normal', 'fast'] as SpeechRateOption[]).map((rate) => {
              const isSelected = preferences.speechRate === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleRateChange(rate)}
                  aria-pressed={isSelected}
                  className={`
                    p-2 rounded-md border text-xs font-semibold capitalize min-h-[40px]
                    transition-all select-none
                    ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-contrast'
                        : 'border-border bg-surface text-foreground hover:bg-surface-elevated'
                    }
                  `.trim()}
                >
                  {rate}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Audio Content Preferences */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-foreground">Audio Content Choices</span>
          <p className="text-[11px] text-foreground-muted">
            Customize which examination elements will have audio support. You remain in control.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {[
              { key: 'readQuestions' as const, label: 'Read Questions' },
              { key: 'readOptions' as const, label: 'Read Answer Options' },
              { key: 'readInstructions' as const, label: 'Read Instructions' },
              { key: 'announceStatus' as const, label: 'Announce Important Status' },
            ].map((item) => {
              const isChecked = preferences[item.key];
              const checkboxId = `audio-pref-${item.key}`;

              return (
                <label
                  key={item.key}
                  htmlFor={checkboxId}
                  className={`
                    flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none
                    ${
                      isChecked
                        ? 'border-border-strong bg-surface-elevated'
                        : 'border-border bg-surface text-foreground-muted'
                    }
                  `.trim()}
                >
                  <input
                    type="checkbox"
                    id={checkboxId}
                    checked={isChecked}
                    onChange={() => handleContentToggle(item.key)}
                    className="w-4 h-4 rounded border-border-strong text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-foreground">
                    {item.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. Timer Announcements */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
            <span className="text-xs font-bold text-foreground">Timer Announcements</span>
          </div>
          <p className="text-[11px] text-foreground-muted">
            Timer announcements can notify you about remaining examination time.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup">
            {[
              { val: 'off' as const, label: 'Off', desc: 'No timer alerts' },
              { val: 'warnings' as const, label: 'Important warnings only', desc: 'At 15m, 5m, 1m' },
              { val: 'regular' as const, label: 'Regular announcements', desc: 'Every 10 minutes' },
            ].map((opt) => {
              const isSelected = preferences.timerAnnouncements === opt.val;
              const inputId = `timer-announcement-${opt.val}`;

              return (
                <label
                  key={opt.val}
                  htmlFor={inputId}
                  className={`
                    flex flex-col justify-between p-2.5 rounded-lg border-2 cursor-pointer select-none
                    ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-surface hover:bg-surface-elevated'
                    }
                  `.trim()}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={inputId}
                      name="timer-announcements-group"
                      value={opt.val}
                      checked={isSelected}
                      onChange={() => handleTimerChange(opt.val)}
                      className="sr-only"
                    />
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-primary bg-primary' : 'border-border bg-surface'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-foreground-muted mt-1 pl-5">
                    {opt.desc}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
