import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Mic,
  Sparkles,
  ArrowLeft,
  Send,
  CheckCircle2,
  Radio,
  Headphones,
} from 'lucide-react';
import { SaarthiStep, SAARTHI_DIALOGUES, saarthiAiService } from '../../services/saarthiAiService';
import { useAccessibility } from '../../hooks/useAccessibility';
import { playEarcon } from '../../utils/soundEffects';

export interface SaarthiAiTutorCardProps {
  currentStep: SaarthiStep;
  language: 'hi' | 'en' | 'hinglish';
  speechRate?: number;
  onSelectOption: (optionId: string) => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  onNaturalInput?: (text: string) => void;
  isProcessing?: boolean;
}

export const SaarthiAiTutorCard: React.FC<SaarthiAiTutorCardProps> = ({
  currentStep,
  language,
  speechRate = 1.0,
  onSelectOption,
  onGoBack,
  canGoBack = false,
  onNaturalInput,
  isProcessing = false,
}) => {
  const { announce } = useAccessibility();
  const dialogue = SAARTHI_DIALOGUES[currentStep] || SAARTHI_DIALOGUES.WELCOME;

  // Accessibility & Hands-Free States
  const [isMuted, setIsMuted] = useState(false);
  const [isHandsFreeMode, setIsHandsFreeMode] = useState(true); // Default TRUE for visually impaired users!
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [lastTutorReply, setLastTutorReply] = useState<string | null>(null);

  // References to eliminate closure race-conditions & loops
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const isHandsFreeRef = useRef(isHandsFreeMode);
  isHandsFreeRef.current = isHandsFreeMode;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const isSpeakingRef = useRef(false);
  const speechRateRef = useRef(speechRate);
  speechRateRef.current = speechRate;
  const silenceCountRef = useRef(0);
  const autoListenTimerRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);
  const isComponentMountedRef = useRef(true);

  const isHi = language === 'hi' || language === 'hinglish';
  const currentSpokenPrompt = isHi ? dialogue.spokenHi : dialogue.spokenEn;
  const currentCaption = isHi ? dialogue.captionHi : dialogue.captionEn;

  // Track component lifecycle
  useEffect(() => {
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
      clearTimeout(autoListenTimerRef.current);
      clearTimeout(restartTimerRef.current);
      saarthiAiService.stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Safe Start Voice Listening with Earcon Audio Feedback
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isSpeakingRef.current || !isComponentMountedRef.current) return;
    try {
      recognitionRef.current.lang = isHi ? 'hi-IN' : 'en-US';
      recognitionRef.current.start();
      setIsListening(true);
      playEarcon('listen');
      announce(isHi ? 'सारथी सुन रहा है... बोलिए।' : 'Saarthi is listening... speak now.', 'polite');
    } catch (err: any) {
      if (err?.name === 'InvalidStateError') {
        // Recognition already active
        setIsListening(true);
      } else {
        setIsListening(false);
      }
    }
  }, [isHi, announce]);

  // Safe Stop Voice Listening with Audio Feedback
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    setIsListening(false);
    playEarcon('pause');
  }, []);

  // Process User's Spoken Input and Transition Smoothly
  const handleProcessVoiceInput = useCallback(
    (text: string) => {
      if (!text.trim() || !isComponentMountedRef.current) return;

      const parsed = saarthiAiService.parseNaturalInput(text, currentStep);
      const reply = isHi ? parsed.replyHi : parsed.replyEn;
      setLastTutorReply(reply);

      // Tutor speaks spoken confirmation first, then automatically continues
      const speechLang = isHi ? 'hi' : 'en';
      isSpeakingRef.current = true;
      setIsSpeaking(true);

      saarthiAiService.speak(
        reply,
        speechLang,
        speechRateRef.current,
        () => {
          if (!isComponentMountedRef.current) return;
          isSpeakingRef.current = false;
          setIsSpeaking(false);

          if (parsed.intent === 'REPEAT') {
            handleReplayPrompt();
          } else if (parsed.intent === 'GO_BACK' && onGoBack && canGoBack) {
            playEarcon('action');
            onGoBack();
          } else if (parsed.value !== undefined) {
            playEarcon('action');
            onSelectOption(String(parsed.value));
          } else if (parsed.intent === 'NEXT' || parsed.intent === 'START' || parsed.intent === 'CONFIRM_SAVE') {
            playEarcon('action');
            onSelectOption(parsed.value || 'next');
          } else if (onNaturalInput) {
            onNaturalInput(text);
          } else if (isHandsFreeRef.current) {
            // Unrecognized or informative, resume auto-listening
            clearTimeout(autoListenTimerRef.current);
            autoListenTimerRef.current = setTimeout(() => {
              if (isHandsFreeRef.current && !isSpeakingRef.current && isComponentMountedRef.current) {
                startListening();
              }
            }, 400);
          }
        },
        'urgent'
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStep, isHi, onGoBack, canGoBack, onSelectOption, onNaturalInput, startListening]
  );

  // Initialize SpeechRecognition Engine
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = isHi ? 'hi-IN' : 'en-US';

    recognizer.onstart = () => {
      if (isComponentMountedRef.current) setIsListening(true);
    };

    recognizer.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const captured = (finalTranscript || interimTranscript).trim();
      if (isComponentMountedRef.current && captured) {
        setTranscript(captured);
        transcriptRef.current = captured;
      }
    };

    recognizer.onend = () => {
      if (!isComponentMountedRef.current) return;
      setIsListening(false);
      const text = transcriptRef.current.trim();
      transcriptRef.current = '';
      setTranscript('');

      if (text) {
        // Successful speech captured!
        silenceCountRef.current = 0;
        playEarcon('recognize');
        handleProcessVoiceInput(text);
      } else {
        // Silence or pause in speech
        if (
          isHandsFreeRef.current &&
          !isSpeakingRef.current &&
          !isMutedRef.current &&
          isComponentMountedRef.current
        ) {
          silenceCountRef.current += 1;
          if (silenceCountRef.current < 3) {
            // Re-listen automatically after short 500ms breath
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (
                isHandsFreeRef.current &&
                !isSpeakingRef.current &&
                isComponentMountedRef.current
              ) {
                startListening();
              }
            }, 550);
          } else {
            // After 3 silent intervals (~20s idle), provide gentle spoken guidance
            silenceCountRef.current = 0;
            const reminder = isHi
              ? 'सारथी सुन रहा है। आप विकल्प बोल सकते हैं, या स्पेस दबाकर वॉयस शुरू कर सकते हैं।'
              : 'Saarthi is listening. You can speak your answer, or press Space to activate voice.';
            isSpeakingRef.current = true;
            setIsSpeaking(true);
            saarthiAiService.speak(
              reminder,
              isHi ? 'hi' : 'en',
              speechRateRef.current,
              () => {
                if (!isComponentMountedRef.current) return;
                isSpeakingRef.current = false;
                setIsSpeaking(false);
                if (isHandsFreeRef.current) {
                  autoListenTimerRef.current = setTimeout(() => {
                    if (isHandsFreeRef.current && !isSpeakingRef.current) {
                      startListening();
                    }
                  }, 400);
                }
              },
              'urgent'
            );
          }
        }
      }
    };

    recognizer.onerror = () => {
      if (isComponentMountedRef.current) {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognizer;

    return () => {
      clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [isHi, handleProcessVoiceInput, startListening]);

  // Prompt Speaking & Seamless Auto-Listening Trigger on Step Change
  useEffect(() => {
    setLastTutorReply(null);
    clearTimeout(autoListenTimerRef.current);
    clearTimeout(restartTimerRef.current);
    silenceCountRef.current = 0;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsListening(false);

    if (!isMuted) {
      const speechLang = isHi ? 'hi' : 'en';
      isSpeakingRef.current = true;
      setIsSpeaking(true);

      saarthiAiService.speak(
        currentSpokenPrompt,
        speechLang,
        speechRate,
        () => {
          if (!isComponentMountedRef.current) return;
          isSpeakingRef.current = false;
          setIsSpeaking(false);

          // Hands-free voice magic: automatically starts listening when tutor finishes!
          if (isHandsFreeRef.current) {
            autoListenTimerRef.current = setTimeout(() => {
              if (
                isHandsFreeRef.current &&
                !isSpeakingRef.current &&
                isComponentMountedRef.current
              ) {
                startListening();
              }
            }, 380);
          }
        },
        'urgent'
      );
      announce(currentCaption, 'polite');
    }

    return () => {
      saarthiAiService.stopSpeaking();
      clearTimeout(autoListenTimerRef.current);
      clearTimeout(restartTimerRef.current);
    };
  }, [currentStep, language, isMuted, speechRate, currentSpokenPrompt, currentCaption, isHi, announce, startListening]);

  // Global Accessible Keyboard Shortcuts: Space/V (Mic), H (Hands-free mode), R (Repeat), M (Mute)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      // Hotkey: Space or KeyV toggles Voice Mic
      if ((e.code === 'Space' || e.code === 'KeyV') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
      // Hotkey: KeyH toggles Hands-Free continuous conversation mode
      else if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleToggleHandsFreeMode();
      }
      // Hotkey: KeyR replays current spoken instructions
      else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleReplayPrompt();
      }
      // Hotkey: KeyM toggles Audio Mute
      else if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsMuted((prev) => {
          const next = !prev;
          if (next) {
            saarthiAiService.stopSpeaking();
            stopListening();
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, isHi, announce, startListening, stopListening]);

  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      announce(
        isHi
          ? 'आपका ब्राउज़र वॉयस इनपुट का समर्थन नहीं करता है। कृपया नंबर कीज़ 1, 2, 3 दबाएं।'
          : 'Voice input is not supported in this browser. Please use keys 1, 2, 3 or type.'
      );
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleToggleHandsFreeMode = () => {
    setIsHandsFreeMode((prev) => {
      const next = !prev;
      const msg = next
        ? isHi
          ? 'हैंड्स-फ्री वॉयस मोड चालू है। सारथी बोलने के बाद स्वतः आपकी आवाज़ सुनेगा।'
          : 'Hands-free voice mode is active. Saarthi will automatically listen after speaking.'
        : isHi
          ? 'हैंड्स-फ्री वॉयस मोड बंद कर दिया गया है।'
          : 'Hands-free voice mode has been paused.';
      announce(msg, 'assertive');

      if (next && !isListening && !isSpeakingRef.current) {
        setTimeout(startListening, 300);
      } else if (!next && isListening) {
        stopListening();
      }
      return next;
    });
  };

  const handleReplayPrompt = () => {
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    saarthiAiService.speak(
      currentSpokenPrompt,
      isHi ? 'hi' : 'en',
      speechRate,
      () => {
        if (!isComponentMountedRef.current) return;
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        if (isHandsFreeRef.current) {
          setTimeout(startListening, 350);
        }
      },
      'urgent'
    );
    announce(currentCaption, 'assertive');
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const submitted = inputText;
    setInputText('');
    handleProcessVoiceInput(submitted);
  };

  return (
    <div
      role="region"
      aria-label="Saarthi AI Tutor Guidance"
      className="w-full bg-gradient-to-br from-blue-900/10 via-indigo-900/10 to-slate-900/5 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900/40 rounded-3xl border-2 border-blue-500/30 shadow-xl p-5 sm:p-6 flex flex-col gap-4 text-left transition-all"
    >
      {/* Top Header: Saarthi Avatar, Status Badges & Controls */}
      <div className="flex items-center justify-between gap-3 border-b border-blue-500/15 pb-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          {/* Saarthi Animated Glowing Avatar */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/25 ring-2 ring-white/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
              </span>
            )}
            {isSpeaking && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>सारथी (Saarthi AI Tutor)</span>
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                {currentStep.replace(/_/g, ' ')}
              </span>

              {/* Status Indicator */}
              {isListening && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700 animate-pulse">
                  <Mic className="w-3 h-3 text-emerald-600" />
                  <span>{isHi ? 'सारथी सुन रहा है... बोलिए' : 'Listening... Speak now'}</span>
                </span>
              )}
              {isSpeaking && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-400 dark:border-blue-700 animate-pulse">
                  <Volume2 className="w-3 h-3 text-blue-600" />
                  <span>{isHi ? 'सारथी बोल रहा है...' : 'Saarthi Speaking...'}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isHi
                ? 'दृष्टिहीन एवं दिव्यांगजनों के लिए पूर्णतः हैंड्स-फ्री वॉयस मार्गदर्शक'
                : 'Accessible Hands-Free Voice Assistant for Visually Impaired Users'}
            </p>
          </div>
        </div>

        {/* Audio Action Buttons & Hands-Free Toggle */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Hands-Free Continuous Voice Mode Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isHandsFreeMode}
            onClick={handleToggleHandsFreeMode}
            title={
              isHandsFreeMode
                ? isHi
                  ? 'हैंड्स-फ्री मोड सक्रिय है (बिना क्लिक किए लगातार बोलें) - शॉर्टकट: H'
                  : 'Hands-Free Voice is ACTIVE (Continuous conversational input) - Shortcut: H'
                : isHi
                  ? 'हैंड्स-फ्री मोड चालू करें (शॉर्टकट: H)'
                  : 'Activate Hands-Free Voice Mode (Shortcut: H)'
            }
            aria-label={
              isHandsFreeMode
                ? 'Hands-Free continuous voice mode active'
                : 'Turn on Hands-Free continuous voice mode'
            }
            className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
              isHandsFreeMode
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isHandsFreeMode ? 'animate-spin' : ''}`} />
            <span>
              {isHandsFreeMode
                ? isHi
                  ? 'हैंड्स-फ्री: चालू'
                  : 'Hands-Free: Active'
                : isHi
                  ? 'हैंड्स-फ्री: बंद'
                  : 'Hands-Free: Off'}
            </span>
            <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/20 text-white font-mono">H</kbd>
          </button>

          {/* Go Back button if allowed */}
          {canGoBack && onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              title={isHi ? 'पिछले स्टेप पर जाएं' : 'Go back to previous step'}
              aria-label={isHi ? 'पिछला स्टेप' : 'Previous step'}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-blue-500 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isHi ? 'पीछे' : 'Back'}</span>
            </button>
          )}

          {/* Repeat Spoken Instructions */}
          <button
            type="button"
            onClick={handleReplayPrompt}
            title={isHi ? 'निर्देश दोहराएं (शॉर्टकट: R)' : 'Replay instructions (Shortcut: R)'}
            aria-label={isHi ? 'निर्देश दोहराएं' : 'Replay instructions'}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 cursor-pointer flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isHi ? 'दोहराएं' : 'Repeat'}</span>
            <kbd className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
              R
            </kbd>
          </button>

          {/* Mute/Unmute audio speech */}
          <button
            type="button"
            onClick={() => {
              if (!isMuted) saarthiAiService.stopSpeaking();
              setIsMuted((prev) => !prev);
            }}
            title={isMuted ? 'अनम्यूट करें (शॉर्टकट: M)' : 'म्यूट करें (शॉर्टकट: M)'}
            aria-label={isMuted ? 'Unmute speech' : 'Mute speech'}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isMuted
                ? 'border-red-300 bg-red-50 text-red-600 dark:bg-red-950/40 dark:border-red-800'
                : 'border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-blue-600'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Dialogue Speech Bubble */}
      <div
        role="region"
        aria-live="polite"
        className="p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-blue-500/20 shadow-xs flex flex-col gap-2"
      >
        <div className="flex items-start gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-2 shrink-0 animate-ping" />
          <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-relaxed">
            "{currentSpokenPrompt}"
          </p>
        </div>

        {/* Live Tutor Feedback on User Input */}
        {lastTutorReply && (
          <div className="mt-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{lastTutorReply}</span>
          </div>
        )}

        {/* Live Spoken Transcript display if user is speaking */}
        {transcript && (
          <div className="mt-1 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <Mic className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
            <span className="italic font-medium">"{transcript}"</span>
          </div>
        )}
      </div>

      {/* Interactive Quick Option Chips */}
      {dialogue.options && dialogue.options.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mr-1">
            {isHi ? 'विकल्प (बोलें या चुनें):' : 'Options (Speak or Click):'}
          </span>
          {dialogue.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectOption(opt.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95"
            >
              <span>{isHi ? opt.labelHi : opt.labelEn}</span>
              {opt.shortcut && (
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  {opt.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Conversational Voice Bar & Text Input */}
      <div className="space-y-2 pt-1">
        <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
          {/* Mic Toggle Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            title={
              isListening
                ? isHi
                  ? 'माइक रोकें (शॉर्टकट: Space / V)'
                  : 'Stop Mic (Shortcut: Space / V)'
                : isHi
                  ? 'बोल कर उत्तर दें (शॉर्टकट: Space / V)'
                  : 'Speak Answer (Shortcut: Space / V)'
            }
            aria-label={isListening ? 'Stop listening' : 'Start voice recognition'}
            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400 animate-pulse'
                : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500'
            }`}
          >
            {isListening ? (
              <>
                <Mic className="w-4 h-4 text-white" />
                <span>{isHi ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak'}</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">
                  {isHi ? 'माइक सक्रिय करें' : 'Voice Input'}
                </span>
                <kbd className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                  Space
                </kbd>
              </>
            )}
          </button>

          {/* Text Input Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isHi
                  ? 'सारथी से कुछ भी पूछें या टाइप करें (उदा: "हिन्दी", "बड़ा टेक्स्ट", "डार्क मोड")...'
                  : 'Ask Saarthi or type your choice (e.g., "Hindi", "Dark mode", "Next")...'
              }
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            aria-label={isHi ? 'भेजें' : 'Send'}
            className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white cursor-pointer transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Accessible Keyboard & Voice Shortcuts Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-0.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Headphones className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              {isHi
                ? 'दृष्टिहीन सुलभता: सारथी बोलने के तुरंत बाद चाइम बजाकर सुनेगा। आपको माउस छूने की ज़रूरत नहीं है।'
                : 'Accessibility Note: Saarthi plays a chime and listens automatically after speaking. Hands-free enabled.'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="hidden md:inline text-slate-400">Shortcuts:</span>
            <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
              Space / V
            </kbd>{' '}
            Mic |{' '}
            <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
              H
            </kbd>{' '}
            Hands-Free |{' '}
            <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
              R
            </kbd>{' '}
            Repeat |{' '}
            <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
              M
            </kbd>{' '}
            Mute
          </div>
        </div>
      </div>
    </div>
  );
};