import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCandidateVoiceNavigator } from '../../hooks/useCandidateVoiceNavigator';
import { Modal } from '../common/Modal';
import {
  Mic,
  MicOff,
  Volume2,
  HelpCircle,
  Compass,
  Radio,
  Sparkles,
  Command,
  BookOpen,
  PlayCircle,
  Calendar,
  BarChart3,
  TrendingUp,
  Settings,
  LayoutDashboard,
} from 'lucide-react';

export const CandidateVoiceAssistant: React.FC = () => {
  const location = useLocation();
  const {
    isListening,
    isActuallyRecognizing,
    isSupported,
    hasPermissionError,
    liveTranscript,
    lastTranscript,
    lastActionFeedback,
    toggleListening,
    requestMicPermission,
    speakPageGuidance,
    speakAvailableCommands,
  } = useCandidateVoiceNavigator();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // If inside an active proctored exam session or active practice question, suppress top bar
  // so candidate is focused on question answering
  const isInsideExamSession =
    location.pathname.includes('/candidate/exams/') &&
    location.pathname.includes('/session');
  const isInsidePracticeSession =
    location.pathname.includes('/candidate/practice/session/') &&
    !location.pathname.includes('/result');

  if (isInsideExamSession || isInsidePracticeSession) {
    return null;
  }

  return (
    <>
      <section
        role="region"
        aria-label="Candidate Hands-Free Voice Assistant and Spoken Guidance"
        className="sticky top-2 z-40 w-full mb-6 rounded-2xl border-2 border-primary/40 bg-surface-elevated/98 backdrop-blur-md shadow-lg p-3.5 sm:p-4 text-foreground flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition-all"
      >
        {/* Left: Status and Live Feedback */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Animated Mic Badge */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={toggleListening}
              aria-label={
                isListening
                  ? 'Voice Assistant listening. Press to pause (Alt+V)'
                  : 'Voice Assistant paused. Press to activate (Alt+V)'
              }
              title={isListening ? 'Click or press Alt+V to pause mic' : 'Click or press Alt+V to listen'}
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActuallyRecognizing
                  ? 'bg-status-success/20 text-status-success border-2 border-status-success shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                  : isListening
                  ? 'bg-primary/20 text-primary border-2 border-primary/60'
                  : 'bg-surface border-2 border-border text-foreground-muted hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {isActuallyRecognizing ? (
                <>
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-status-success"></span>
                  </span>
                  <Mic className="w-5 h-5 animate-pulse" aria-hidden="true" />
                </>
              ) : isListening ? (
                <Mic className="w-5 h-5 text-primary" aria-hidden="true" />
              ) : (
                <MicOff className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Status Text & Dynamic Transcription Feedback */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Voice Navigator</span>
              </span>

              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isActuallyRecognizing
                    ? 'bg-status-success/15 text-status-success border border-status-success/30'
                    : isListening
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-surface border border-border text-foreground-muted'
                }`}
              >
                {isActuallyRecognizing
                  ? 'Listening live'
                  : isListening
                  ? 'Mic Ready'
                  : 'Paused (Alt+V)'}
              </span>

              {hasPermissionError && (
                <button
                  type="button"
                  onClick={requestMicPermission}
                  className="text-[11px] font-bold bg-status-error text-white px-2.5 py-0.5 rounded-md hover:bg-status-error/90 transition-colors shadow-sm animate-pulse"
                >
                  Click to Allow Microphone
                </button>
              )}

              {!isSupported && (
                <span className="text-[10px] bg-status-warning/20 text-status-warning px-2 py-0.5 rounded border border-status-warning/40">
                  Speech recognition requires Chrome or Edge
                </span>
              )}
            </div>

            {/* Dynamic Spoken Announcement Feedback */}
            <div
              aria-live="polite"
              aria-atomic="true"
              className="text-xs sm:text-sm font-medium text-foreground truncate mt-0.5"
            >
              {liveTranscript ? (
                <span className="flex items-center gap-1.5 text-primary font-bold">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping"></span>
                  <span className="truncate">Hearing: &ldquo;{liveTranscript}&rdquo;</span>
                </span>
              ) : lastActionFeedback ? (
                <span className="flex items-center gap-1.5 text-primary font-semibold">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {lastTranscript ? `"${lastTranscript}" → ` : ''}
                    {lastActionFeedback}
                  </span>
                </span>
              ) : isListening ? (
                <span className="text-foreground-secondary truncate">
                  Speak any command (e.g., &ldquo;Learn&rdquo;, &ldquo;Practice&rdquo;, &ldquo;Exams&rdquo;, &ldquo;Continue Practice&rdquo;)
                </span>
              ) : (
                <span className="text-foreground-muted truncate">
                  Microphone is paused. Click mic or press Alt+V to activate hands-free navigation.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {/* Guide Me Button (Alt+G) */}
          <button
            type="button"
            onClick={speakPageGuidance}
            aria-label="Guide me on this page (Alt+G)"
            title="Read orientation guidance for this page (Alt+G)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-surface-elevated border border-border hover:border-primary/40 text-xs font-bold text-foreground transition-colors min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Compass className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Where Am I?</span>
            <span className="keyboard-indicator text-[10px] hidden sm:inline">Alt+G</span>
          </button>

          {/* Voice Commands Help Modal Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="View all voice navigation commands"
            title="Open Voice Command Cheatsheet"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-contrast hover:bg-primary-hover text-xs font-bold shadow-sm transition-colors min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Voice Commands</span>
          </button>
        </div>
      </section>

      {/* Accessible Voice Commands Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Candidate Voice Navigation Guide"
        description="All elements of the Candidate Portal can be accessed entirely hands-free using your voice. Speak naturally into your microphone at any time."
        maxWidth="xl"
      >
        <div className="flex flex-col gap-6 text-foreground">
          {/* Header Action: Listen to Commands Aloud */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Spoken Audio Assistance</h3>
                <p className="text-xs text-foreground-secondary">
                  Hear the complete spoken list of commands read aloud by the speech synthesizer.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={speakAvailableCommands}
              className="px-3.5 py-2 rounded-lg bg-primary text-primary-contrast font-bold text-xs shrink-0 hover:bg-primary-hover transition-colors min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Read Aloud
            </button>
          </div>

          {/* 1. Primary Portal Navigation */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
              <span>1. Main Portal Sections</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-border bg-surface-elevated/50 flex flex-col gap-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Command className="w-3 h-3 text-primary" aria-hidden="true" />
                  &ldquo;Dashboard&rdquo; / &ldquo;Home&rdquo;
                </span>
                <span className="text-foreground-secondary text-[11px]">
                  Navigates directly to candidate dashboard
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface-elevated/50 flex flex-col gap-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-primary" aria-hidden="true" />
                  &ldquo;Learn&rdquo; / &ldquo;Curriculum&rdquo;
                </span>
                <span className="text-foreground-secondary text-[11px]">
                  Opens all curriculum subjects and modules
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface-elevated/50 flex flex-col gap-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <PlayCircle className="w-3 h-3 text-primary" aria-hidden="true" />
                  &ldquo;Practice&rdquo; / &ldquo;Practice Hub&rdquo;
                </span>
                <span className="text-foreground-secondary text-[11px]">
                  Opens adaptive question practice sets
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface-elevated/50 flex flex-col gap-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-primary" aria-hidden="true" />
                  &ldquo;Mock Tests&rdquo;
                </span>
                <span className="text-foreground-secondary text-[11px]">
                  Opens full simulated test papers
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface-elevated/50 flex flex-col gap-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-primary" aria-hidden="true" />
                  &ldquo;Exams&rdquo; / &ldquo;Examinations&rdquo;
                </span>
                <span className="text-foreground-secondary text-[11px]">
                  Opens scheduled official test portal
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface-elevated/50 flex flex-col gap-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3 text-primary" aria-hidden="true" />
                  &ldquo;Results&rdquo; / &ldquo;Scorecard&rdquo;
                </span>
                <span className="text-foreground-secondary text-[11px]">
                  Displays past performance and test analytics
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface-elevated/50 flex flex-col gap-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-primary" aria-hidden="true" />
                  &ldquo;Progress&rdquo;
                </span>
                <span className="text-foreground-secondary text-[11px]">
                  Displays topic mastery and study streak
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface-elevated/50 flex flex-col gap-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Settings className="w-3 h-3 text-primary" aria-hidden="true" />
                  &ldquo;Settings&rdquo; / &ldquo;Accessibility&rdquo;
                </span>
                <span className="text-foreground-secondary text-[11px]">
                  Opens account settings or accessibility calibration
                </span>
              </div>
            </div>
          </div>

          {/* 2. In-Depth Actions & Subject Jumps */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>2. In-Depth Actions &amp; Subjects</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col gap-1">
                <span className="font-bold text-foreground">&ldquo;Continue Practice&rdquo;</span>
                <span className="text-foreground-secondary text-[11px]">
                  Launches your next scheduled recommended practice set directly from dashboard.
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col gap-1">
                <span className="font-bold text-foreground">&ldquo;Start Demo Exam&rdquo;</span>
                <span className="text-foreground-secondary text-[11px]">
                  Enters the verification room for official test simulations.
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col gap-1">
                <span className="font-bold text-foreground">&ldquo;Mathematics&rdquo; / &ldquo;Percentages&rdquo; / &ldquo;Algebra&rdquo;</span>
                <span className="text-foreground-secondary text-[11px]">
                  Jumps directly into quantitative learning topics.
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col gap-1">
                <span className="font-bold text-foreground">&ldquo;Reasoning&rdquo; / &ldquo;Coding and Decoding&rdquo;</span>
                <span className="text-foreground-secondary text-[11px]">
                  Opens reasoning and logic curriculum modules.
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col gap-1">
                <span className="font-bold text-foreground">&ldquo;English&rdquo; / &ldquo;Reading Comprehension&rdquo;</span>
                <span className="text-foreground-secondary text-[11px]">
                  Opens verbal aptitude and vocabulary modules.
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col gap-1">
                <span className="font-bold text-foreground">&ldquo;General Knowledge&rdquo; / &ldquo;History&rdquo; / &ldquo;Polity&rdquo;</span>
                <span className="text-foreground-secondary text-[11px]">
                  Opens general awareness and constitution modules.
                </span>
              </div>
            </div>
          </div>

          {/* 3. Audio & Assistant Controls */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5" aria-hidden="true" />
              <span>3. Orientation &amp; Audio Controls</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">&ldquo;Where am I?&rdquo; / &ldquo;Read page&rdquo;</div>
                  <div className="text-foreground-secondary text-[11px]">Re-reads page guidance</div>
                </div>
                <span className="keyboard-indicator text-[10px]">Alt+G</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">&ldquo;Stop listening&rdquo; / Pause</div>
                  <div className="text-foreground-secondary text-[11px]">Toggles mic active / mute</div>
                </div>
                <span className="keyboard-indicator text-[10px]">Alt+V</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">&ldquo;Stop&rdquo; / &ldquo;Mute&rdquo; / &ldquo;Quiet&rdquo;</div>
                  <div className="text-foreground-secondary text-[11px]">Immediately silences speech synthesis</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">&ldquo;Sign out&rdquo; / &ldquo;Log out&rdquo;</div>
                  <div className="text-foreground-secondary text-[11px]">Signs out safely from Drishti</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Close Button */}
          <div className="flex justify-end pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-contrast font-bold text-xs hover:bg-primary-hover transition-colors min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Got it (Escape to Close)
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
