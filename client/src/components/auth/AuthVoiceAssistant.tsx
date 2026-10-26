import React, { useState } from 'react';
import { AuthVoiceState } from '../../hooks/useAuthVoiceNavigator';
import { Modal } from '../common/Modal';
import {
  Mic,
  MicOff,
  Volume2,
  HelpCircle,
  Radio,
  Sparkles,
  Command,
  CheckCircle2,
} from 'lucide-react';

export interface AuthVoiceAssistantProps {
  voiceState: AuthVoiceState;
  pageType: 'login' | 'signup' | 'role-selection' | 'forgot-password';
}

export const AuthVoiceAssistant: React.FC<AuthVoiceAssistantProps> = ({
  voiceState,
  pageType,
}) => {
  const {
    isListening,
    isActuallyRecognizing,
    isSupported,
    hasPermissionError,
    liveTranscript,
    lastTranscript,
    lastActionFeedback,
    toggleListening,
    speakGuidance,
    speakCommandsHelp,
    requestMicPermission,
  } = voiceState;

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <section
        role="region"
        aria-label="Hands-Free Voice Sign In and Registration Navigator"
        className="w-full mb-5 rounded-2xl border-2 border-primary/40 bg-surface-elevated/95 backdrop-blur-md shadow-md p-3.5 sm:p-4 text-foreground flex flex-col gap-3 transition-all"
      >
        {/* Top Control Bar: Mic status, Earcon feedback & Action buttons */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Animated Mic Toggle Button */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={toggleListening}
                aria-label={
                  isListening
                    ? 'Voice Assistant listening. Press to pause microphone (Alt+V)'
                    : 'Voice Assistant paused. Press to activate microphone (Alt+V)'
                }
                title={isListening ? 'Click or press Alt+V to pause mic' : 'Click or press Alt+V to listen'}
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                  isActuallyRecognizing
                    ? 'bg-status-success/20 text-status-success border-2 border-status-success shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                    : isListening
                    ? 'bg-primary/20 text-primary border-2 border-primary/60'
                    : 'bg-surface border-2 border-border text-foreground-muted hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {isActuallyRecognizing ? (
                  <>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-status-success"></span>
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

            {/* Badges & Live Status */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Voice Sign-In</span>
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
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
                    className="text-[10px] font-bold bg-status-error text-white px-2 py-0.5 rounded-md hover:bg-status-error/90 transition-colors shadow-sm animate-pulse"
                  >
                    Click to Allow Mic
                  </button>
                )}

                {!isSupported && (
                  <span className="text-[10px] bg-status-warning/20 text-status-warning px-2 py-0.5 rounded border border-status-warning/40">
                    Speech recognition requires Chrome or Edge
                  </span>
                )}
              </div>

              {/* Dynamic Transcript & Action Feedback */}
              <div
                aria-live="polite"
                aria-atomic="true"
                className="text-xs sm:text-sm font-medium text-foreground truncate mt-0.5"
              >
                {liveTranscript ? (
                  <span className="text-primary font-semibold">
                    Heard: "{liveTranscript}"
                  </span>
                ) : lastActionFeedback ? (
                  <span className="text-status-success font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 inline shrink-0" />
                    <span>{lastActionFeedback}</span>
                  </span>
                ) : lastTranscript ? (
                  <span className="text-foreground-secondary">
                    Last: "{lastTranscript}"
                  </span>
                ) : (
                  <span className="text-foreground-muted">
                    {pageType === 'login'
                      ? 'Say "Candidate" to sign in instantly, or "Email..." to enter details'
                      : pageType === 'signup'
                      ? 'Say "Candidate" to register, or "Name...", "Email..." to fill'
                      : 'Say "Option 1" for Candidate, or "Option 2" for Examiner'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Audio & Help Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={speakGuidance}
              aria-label="Re-listen to spoken voice guidance and options (Alt+G)"
              title="Listen to options (Alt+G)"
              className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsHelpOpen(true);
                speakCommandsHelp();
              }}
              aria-label="Open Voice Navigation Help and Commands list (Alt+H)"
              title="Voice Commands Help (Alt+H)"
              className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Quick Voice Triggers Chip Bar for Instant Accessibility */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/50 text-[11px]">
          <span className="text-foreground-muted font-bold flex items-center gap-1">
            <Command className="w-3 h-3 text-primary" aria-hidden="true" />
            <span>Voice Options:</span>
          </span>

          {pageType === 'login' && (
            <>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20">
                1. "Candidate"
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground-secondary">
                2. "Email [name@domain]"
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground-secondary">
                3. "Password [pass]"
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground-secondary">
                4. "Submit"
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground-secondary">
                5. "Sign Up"
              </span>
            </>
          )}

          {pageType === 'signup' && (
            <>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20">
                1. "Candidate"
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground-secondary">
                2. "Name [your name]"
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground-secondary">
                3. "Email [address]"
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground-secondary">
                4. "Password [pass]"
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground-secondary">
                5. "Submit"
              </span>
            </>
          )}

          {pageType === 'role-selection' && (
            <>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20">
                1. "Candidate"
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground-secondary">
                2. "Examiner"
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground-secondary">
                3. "Sign In"
              </span>
            </>
          )}
        </div>
      </section>

      {/* Voice Commands Help Dialog */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Voice Navigation & Commands Guide"
        description="Complete spoken trigger cheat-sheet for accessible hands-free login and registration."
        maxWidth="md"
      >
        <div className="flex flex-col gap-4 text-xs sm:text-sm">
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">Speech Recognition Active</p>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Speak clearly into your microphone in English or Hindi. The navigator understands numeric options ("Option 1", "Option 2") and spoken terms.
              </p>
            </div>
          </div>

          {pageType === 'login' ? (
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <p className="font-bold text-foreground">Option 1: Quick Candidate Sign In</p>
                  <p className="text-xs text-foreground-muted">
                    Say <span className="font-semibold text-primary">"Option 1"</span> or <span className="font-semibold text-primary">"Candidate"</span> to automatically sign in with student demo credentials.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <p className="font-bold text-foreground">Option 2: Speak Email Address</p>
                  <p className="text-xs text-foreground-muted">
                    Say <span className="font-semibold text-primary">"Email rahul at gmail dot com"</span>. The system converts "at" to @ and "dot" to period automatically.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <p className="font-bold text-foreground">Option 3: Speak Password</p>
                  <p className="text-xs text-foreground-muted">
                    Say <span className="font-semibold text-primary">"Password [your password]"</span> to enter your security password into the password field.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  4
                </span>
                <div>
                  <p className="font-bold text-foreground">Option 4: Submit Sign In</p>
                  <p className="text-xs text-foreground-muted">
                    Say <span className="font-semibold text-primary">"Submit"</span>, <span className="font-semibold text-primary">"Sign In"</span>, or <span className="font-semibold text-primary">"Option 4"</span> to validate and log into your workspace.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  5
                </span>
                <div>
                  <p className="font-bold text-foreground">Option 5: Create New Account</p>
                  <p className="text-xs text-foreground-muted">
                    Say <span className="font-semibold text-primary">"Sign Up"</span>, <span className="font-semibold text-primary">"Register"</span>, or <span className="font-semibold text-primary">"Option 5"</span> to open account registration.
                  </p>
                </div>
              </div>
            </div>
          ) : pageType === 'signup' ? (
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <p className="font-bold text-foreground">Option 1: Quick Register Candidate</p>
                  <p className="text-xs text-foreground-muted">
                    Say <span className="font-semibold text-primary">"Option 1"</span> or <span className="font-semibold text-primary">"Candidate"</span> to auto-fill registration and create account.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <p className="font-bold text-foreground">Option 2: Speak Full Name</p>
                  <p className="text-xs text-foreground-muted">
                    Say <span className="font-semibold text-primary">"Name [your name]"</span>.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <p className="font-bold text-foreground">Option 3: Speak Email Address</p>
                  <p className="text-xs text-foreground-muted">
                    Say <span className="font-semibold text-primary">"Email [your email]"</span>.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  4
                </span>
                <div>
                  <p className="font-bold text-foreground">Option 4: Speak Password</p>
                  <p className="text-xs text-foreground-muted">
                    Say <span className="font-semibold text-primary">"Password [your password]"</span>.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  5
                </span>
                <div>
                  <p className="font-bold text-foreground">Option 5: Submit Registration</p>
                  <p className="text-xs text-foreground-muted">
                    Say <span className="font-semibold text-primary">"Submit"</span> or <span className="font-semibold text-primary">"Register"</span> to finalize registration.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg border border-border bg-surface">
                <p className="font-bold text-foreground">Say "Candidate" or "Option 1"</p>
                <p className="text-xs text-foreground-muted">Selects Candidate examinee account.</p>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface">
                <p className="font-bold text-foreground">Say "Examiner" or "Option 2"</p>
                <p className="text-xs text-foreground-muted">Selects Examiner authoring account.</p>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-foreground-secondary">
            <span>Global Hotkeys:</span>
            <span className="font-mono text-primary font-bold">Alt+V (Mic) • Alt+H (Help) • Alt+G (Guidance)</span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-contrast font-bold text-xs"
            >
              Close Guide
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
