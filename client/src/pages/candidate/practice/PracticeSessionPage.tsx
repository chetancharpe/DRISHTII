import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PracticeSession } from '../../../types/practice';
import { practiceService } from '../../../services/practiceService';
import { PracticeQuestionCard } from '../../../components/practice/PracticeQuestionCard';
import { PracticeNavigatorPalette } from '../../../components/practice/PracticeNavigatorPalette';
import { PracticeTimer } from '../../../components/practice/PracticeTimer';
import { PracticePauseModal } from '../../../components/practice/PracticePauseModal';
import { PracticeFinishModal } from '../../../components/practice/PracticeFinishModal';
import {
  ArrowLeft,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { useAccessibility } from '../../../contexts/AccessibilityContext';
import { VoiceCommandBar } from '../../../components/common/VoiceCommandBar';
import { useVoiceCommands } from '../../../hooks/useVoiceCommands';
import { playEarcon } from '../../../utils/soundEffects';

export const PracticeSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { openCalibration, announce, speak, preferences, hasHindiVoice } = useAccessibility();
  const isHindi =
    preferences?.language === 'hi' ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const elapsedSecondsRef = useRef(0);

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return;
      try {
        setIsLoading(true);
        const data = await practiceService.getPracticeSession(sessionId);
        if (!data) {
          setError('Practice session could not be located.');
        } else {
          setSession(data);
          setCurrentIdx(data.currentQuestionIndex || 0);
        }
      } catch (err) {
        setError('Error loading practice session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  const currentQuestion = session?.questions?.[currentIdx];
  const savedAnswer = currentQuestion ? session?.answers?.[currentQuestion.id] : undefined;

  // Handlers with authoritative right/wrong speech verification
  const isSubmittingRef = useRef(false);

  const handleSubmitAnswer = async (questionId: string, selectedOptionIds: string[]) => {
    if (!session || !currentQuestion) return;
    if (isSubmittingRef.current) return;

    // If already submitted, prevent duplicate submission and guide user to next question
    const existingAnswer = session.answers?.[questionId];
    if (existingAnswer?.isSubmitted) {
      const isHindi = preferences?.language === 'hi' || /[\u0900-\u097F]/.test(currentQuestion.questionText);
      const prompt = isHindi
        ? 'आप इस सवाल का उत्तर दे चुके हैं। अगले सवाल के लिए "अगला" बोलें।'
        : 'You have already answered this question. Say "Next" to continue.';
      speak(prompt);
      announce(prompt, 'polite');
      return;
    }

    isSubmittingRef.current = true;
    setActionError(null);
    try {
      // Immediately cancel any previous question reading speech
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      const res = await practiceService.submitAnswer(
        session.id,
        questionId,
        selectedOptionIds,
        elapsedSecondsRef.current
      );
      setSession(res.session);

      const isHindi = preferences?.language === 'hi' || /[\u0900-\u097F]/.test(currentQuestion.questionText);

      // Selected option details
      const selectedOpts = currentQuestion.options.filter((o) => selectedOptionIds.includes(o.id));
      const userSelectedLabel = selectedOpts.map((o) => o.label).join(', ') || 'B';
      const userSelectedText = selectedOpts.map((o) => o.text).join(', ');

      // Find correct option details
      const knownCorrectIds: string[] =
        res.session.correctOptions?.[questionId] ||
        (currentQuestion as any).correctOptionIds ||
        [];
      const correctOpts = currentQuestion.options.filter((o) =>
        knownCorrectIds.length > 0 ? knownCorrectIds.includes(o.id) : o.label === 'B'
      );
      const correctLabel = correctOpts.map((o) => o.label).join(', ') || 'B';
      const correctText = correctOpts.map((o) => o.text).join(', ');

      // Acoustic earcon
      playEarcon(res.isCorrect ? 'action' : 'error');

      // Authoritative voice evaluation (Checks and announces if correct or incorrect)
      const useHindiSpeech = hasHindiVoice && isHindi;
      if (res.isCorrect) {
        const feedback = useHindiSpeech
          ? `बिल्कुल सही जवाब! आपका विकल्प ${userSelectedLabel} सही उत्तर है। ${res.explanation ? 'स्पष्टीकरण: ' + res.explanation + '। ' : ''}अगले सवाल के लिए बोलिए 'अगला', या समझने के लिए बोलिए 'समझाओ'।`
          : `Correct! Option ${userSelectedLabel}: ${userSelectedText} is the right answer. ${res.explanation ? 'Explanation: ' + res.explanation + '. ' : ''}Say 'Next' to proceed, or say 'Explain' to hear the explanation.`;
        speak(feedback, () => {
          playEarcon('listen');
        });
        announce(feedback, 'assertive');
      } else {
        const feedback = useHindiSpeech
          ? `गलत उत्तर। आपने विकल्प ${userSelectedLabel} चुना, लेकिन सही उत्तर विकल्प ${correctLabel} है: ${correctText}। ${res.explanation ? 'स्पष्टीकरण: ' + res.explanation + '। ' : ''}अगले सवाल के लिए बोलिए 'अगला', या समझने के लिए बोलिए 'समझाओ'।`
          : `Incorrect. You chose Option ${userSelectedLabel}, but the correct answer is Option ${correctLabel}: ${correctText}. ${res.explanation ? 'Explanation: ' + res.explanation + '. ' : ''}Say 'Next' to proceed, or say 'Explain' to hear the explanation.`;
        speak(feedback, () => {
          playEarcon('listen');
        });
        announce(feedback, 'assertive');
      }
    } catch (err) {
      console.error('Answer submission error', err);
      const msg = 'Could not submit your answer. Please check your connection and retry.';
      setActionError(msg);
      announce(msg, 'assertive');
      speak(msg);
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 500);
    }
  };

  const handleSkipQuestion = async (questionId: string) => {
    if (!session) return;
    setActionError(null);
    try {
      const updated = await practiceService.skipQuestion(session.id, questionId);
      setSession(updated);
      if (currentIdx < session.totalQuestions - 1) {
        setCurrentIdx((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Skip question error', err);
      const msg = 'Could not skip the question. Please retry.';
      setActionError(msg);
      announce(msg, 'assertive');
    }
  };

  const handleNext = useCallback(() => {
    if (session && currentIdx < session.totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else if (session && currentIdx >= session.totalQuestions - 1) {
      const isHindi =
        preferences?.language === 'hi' ||
        /[\u0900-\u097F]/.test(currentQuestion?.questionText || '');
      const useHindiSpeech = hasHindiVoice && isHindi;
      const finishMsg = useHindiSpeech
        ? `यह इस अभ्यास का अंतिम सवाल था। अपना परिणाम देखने के लिए बोलिए 'सबमिट' या 'समाप्त'।`
        : `This is the final question. To review your scorecard, say 'Submit' or 'Finish'.`;
      speak(finishMsg, () => playEarcon('listen'));
      announce(finishMsg, 'assertive');
    }
  }, [
    session,
    currentIdx,
    currentQuestion?.questionText,
    preferences?.language,
    hasHindiVoice,
    speak,
    announce,
    playEarcon,
  ]);

  const handlePrevious = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  }, [currentIdx]);

  const handleExplain = useCallback(() => {
    if (!currentQuestion) return;
    const isHindi =
      preferences?.language === 'hi' ||
      /[\u0900-\u097F]/.test(currentQuestion.questionText);
    const useHindiSpeech = hasHindiVoice && isHindi;

    const explanation =
      (session as any)?.explanations?.[currentQuestion.id] ||
      currentQuestion.explanation;

    if (explanation) {
      const text = useHindiSpeech
        ? `सवाल का स्पष्टीकरण: ${explanation}। अगले सवाल पर जाने के लिए बोलिए 'अगला'।`
        : `Explanation: ${explanation}. Say 'Next' to proceed to the next question.`;
      speak(text, () => playEarcon('listen'));
      announce(text, 'assertive');
    } else {
      const notFound = useHindiSpeech
        ? `इस सवाल का स्पष्टीकरण देखने के लिए पहले कोई विकल्प चुनकर उत्तर दें।`
        : `Please select an option first to receive the detailed explanation.`;
      speak(notFound, () => playEarcon('listen'));
      announce(notFound, 'assertive');
    }
  }, [currentQuestion, session, preferences?.language, hasHindiVoice, speak, announce, playEarcon]);

  const handleReadOptions = useCallback(() => {
    if (!currentQuestion || !currentQuestion.options) return;
    const isHindi =
      preferences?.language === 'hi' ||
      /[\u0900-\u097F]/.test(currentQuestion.questionText);
    const useHindiSpeech = hasHindiVoice && isHindi;
    const optLetters = ['A', 'B', 'C', 'D'];

    const optsHi = currentQuestion.options
      .map((opt, i) => `ऑप्शन ${opt.label || optLetters[i]}: ${opt.text}`)
      .join('। ');
    const optsEn = currentQuestion.options
      .map((opt, i) => `Option ${opt.label || optLetters[i]}: ${opt.text}`)
      .join('. ');

    const textToSpeak = useHindiSpeech
      ? `विकल्प हैं: ${optsHi}। अपना उत्तर चुनने के लिए बोलिए ऑप्शन ए, बी, सी या डी।`
      : `The options are: ${optsEn}. Say Option A, B, C, or D to choose.`;

    speak(textToSpeak, () => playEarcon('listen'));
    announce(textToSpeak, 'assertive');
  }, [currentQuestion, preferences?.language, hasHindiVoice, speak, announce, playEarcon]);

  const handleConfirmFinish = async () => {
    if (!session) return;
    setIsFinishModalOpen(false);
    setActionError(null);
    try {
      await practiceService.finishPracticeSession(session.id, elapsedSecondsRef.current);
      navigate(`/candidate/practice/session/${session.id}/result`);
    } catch (err) {
      console.error('Failed to finish practice', err);
      const msg = 'Failed to finalize practice session. Please try clicking Finish again.';
      setActionError(msg);
      announce(msg, 'assertive');
    }
  };

  // Automated Spoken Question & Choices Readout (100% matched to on-screen text)
  const readQuestionAloud = useCallback(() => {
    if (!currentQuestion) return;

    const isHindiPref =
      preferences?.language === 'hi' ||
      /[\u0900-\u097F]/.test(currentQuestion.questionText) ||
      (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

    const totalQ = session?.totalQuestions || session?.questions?.length || 10;
    const qNum = currentIdx + 1;
    // ALWAYS use the exact question statement rendered on the screen!
    const statement = currentQuestion.questionText;

    const optLetters = ['A', 'B', 'C', 'D'];
    const optsHi = currentQuestion.options
      .map((opt, i) => `ऑप्शन ${opt.label || optLetters[i]}: ${opt.text}`)
      .join('। ');
    const optsEn = currentQuestion.options
      .map((opt, i) => `Option ${opt.label || optLetters[i]}: ${opt.text}`)
      .join('. ');

    const speechHi = `प्रश्न संख्या ${qNum}, कुल ${totalQ} में से। ${statement}। विकल्प हैं: ${optsHi}। अपना उत्तर चुनिए: ऑप्शन ए, बी, सी या डी।`;
    const speechEn = `Question ${qNum} of ${totalQ}. ${statement}. The options are: ${optsEn}. Choose your answer: Option A, B, C, or D.`;

    const textToSpeak = isHindiPref && hasHindiVoice ? speechHi : speechEn;

    speak(textToSpeak, () => {
      playEarcon('listen');
    });
    announce(isHindiPref ? speechHi : speechEn, 'assertive');
  }, [
    currentQuestion,
    currentIdx,
    session?.totalQuestions,
    session?.questions?.length,
    speak,
    announce,
    preferences?.language,
    hasHindiVoice,
  ]);

  // Auto-read question statement and choices on question load or question change
  useEffect(() => {
    if (isLoading || !currentQuestion) return;
    const timer = setTimeout(() => {
      readQuestionAloud();
    }, 450);
    return () => clearTimeout(timer);
  }, [currentIdx, currentQuestion?.id, isLoading, readQuestionAloud]);

  // Unlock browser speech synthesis on first user interaction if blocked by autoplay policy
  useEffect(() => {
    const handleUnlock = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        if (!window.speechSynthesis.speaking && currentQuestion) {
          readQuestionAloud();
        }
      }
    };

    window.addEventListener('click', handleUnlock, { once: true });
    window.addEventListener('keydown', handleUnlock, { once: true });
    return () => {
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };
  }, [currentQuestion, readQuestionAloud]);

  // Keyboard Hotkeys: Spacebar/Escape interrupts AI speech; A, B, C, D directly submits choice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Spacebar or Escape: Immediate Voice Barge-In / Pause
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Escape') {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
          e.preventDefault();
          window.speechSynthesis.cancel();
          playEarcon('action');
          const isHindi = preferences?.language === 'hi' || /[\u0900-\u097F]/.test(currentQuestion?.questionText || '');
          const msg = isHindi ? 'आवाज रोकी गई। अपना उत्तर बोलें या चुनें।' : 'Assistant paused. Please speak or choose your answer.';
          announce(msg, 'assertive');
          return;
        }
      }

      // Hotkeys A, B, C, D to directly submit answer
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        if (currentQuestion && currentQuestion.options) {
          const optIdx = currentQuestion.options.findIndex(
            (o, i) => o.label?.toUpperCase() === key || ['A', 'B', 'C', 'D'][i] === key
          );
          if (optIdx !== -1) {
            e.preventDefault();
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            const opt = currentQuestion.options[optIdx];
            handleSubmitAnswer(currentQuestion.id, [opt.id]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, handleSubmitAnswer, playEarcon, announce, preferences?.language]);

  // Universal Practice Voice Command Event Listeners
  useEffect(() => {
    const handleSelectEvent = (e: any) => {
      const label = e.detail?.label?.toUpperCase();
      const index = e.detail?.index;
      if (!currentQuestion) return;
      let optIdx = -1;
      if (typeof index === 'number' && currentQuestion.options[index]) {
        optIdx = index;
      } else if (label) {
        optIdx = currentQuestion.options.findIndex(
          (o, i) => o.label?.toUpperCase() === label || ['A', 'B', 'C', 'D'][i] === label
        );
      }
      if (optIdx !== -1) {
        const opt = currentQuestion.options[optIdx];
        handleSubmitAnswer(currentQuestion.id, [opt.id]);
      }
    };

    const handleNextEvent = () => handleNext();
    const handlePrevEvent = () => handlePrevious();
    const handleSkipEvent = () => {
      if (currentQuestion) handleSkipQuestion(currentQuestion.id);
    };
    const handleReadEvent = () => readQuestionAloud();
    const handleReadOptionsEvent = () => handleReadOptions();
    const handleExplainEvent = () => handleExplain();
    const handleSubmitEvent = () => setIsFinishModalOpen(true);

    window.addEventListener('drishti:practice-select-option', handleSelectEvent);
    window.addEventListener('drishti:practice-next', handleNextEvent);
    window.addEventListener('drishti:practice-previous', handlePrevEvent);
    window.addEventListener('drishti:practice-skip', handleSkipEvent);
    window.addEventListener('drishti:practice-read-question', handleReadEvent);
    window.addEventListener('drishti:practice-read-options', handleReadOptionsEvent);
    window.addEventListener('drishti:practice-explain', handleExplainEvent);
    window.addEventListener('drishti:practice-submit', handleSubmitEvent);

    return () => {
      window.removeEventListener('drishti:practice-select-option', handleSelectEvent);
      window.removeEventListener('drishti:practice-next', handleNextEvent);
      window.removeEventListener('drishti:practice-previous', handlePrevEvent);
      window.removeEventListener('drishti:practice-skip', handleSkipEvent);
      window.removeEventListener('drishti:practice-read-question', handleReadEvent);
      window.removeEventListener('drishti:practice-read-options', handleReadOptionsEvent);
      window.removeEventListener('drishti:practice-explain', handleExplainEvent);
      window.removeEventListener('drishti:practice-submit', handleSubmitEvent);
    };
  }, [currentQuestion, handleNext, handlePrevious, handleSkipQuestion, readQuestionAloud, handleExplain, handleReadOptions]);

  const voice = useVoiceCommands(
    {
      onNext: handleNext,
      onPrevious: handlePrevious,
      onSkip: () => {
        if (currentQuestion) handleSkipQuestion(currentQuestion.id);
      },
      onSelectOption: (optionIdx) => {
        if (currentQuestion && currentQuestion.options[optionIdx]) {
          const optId = currentQuestion.options[optionIdx].id;
          handleSubmitAnswer(currentQuestion.id, [optId]);
        }
      },
      onReadQuestion: readQuestionAloud,
      onReadOptions: handleReadOptions,
      onExplain: handleExplain,
      onSubmit: () => setIsFinishModalOpen(true),
      getCurrentOptions: () =>
        currentQuestion?.options?.map((o, idx) => ({
          label: o.label || ['A', 'B', 'C', 'D'][idx],
          text: o.text,
        })) || [],
    },
    { autoStart: true }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Initializing practice session...
        </p>
      </div>
    );
  }

  if (error || !session || !currentQuestion) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">{error || 'Session not found.'}</p>
        <Link
          to="/candidate/practice"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Return to Practice Menu</span>
        </Link>
      </div>
    );
  }

  // Count answered, skipped, remaining
  let answeredCount = 0;
  let skippedCount = 0;

  session.questions.forEach((q) => {
    const a = session.answers[q.id];
    if (a?.isSubmitted) answeredCount++;
    else if (a?.isSkipped) skippedCount++;
  });

  const remainingCount = session.totalQuestions - answeredCount - skippedCount;
  const unansweredCount = session.totalQuestions - answeredCount;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Hands-Free Voice Command Navigation Bar */}
      <VoiceCommandBar
        isListening={voice.isListening}
        isSupported={voice.isSupported}
        lastCommand={voice.lastCommand}
        errorNotice={voice.errorNotice}
        onToggle={voice.toggleListening}
      />

      {/* Session Top Bar */}
      <header
        aria-label="Practice session status header"
        className="p-4 sm:p-5 rounded-2xl border border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Link
            to="/candidate/practice"
            className="p-2 rounded-lg hover:bg-surface-elevated text-foreground-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[38px] min-w-[38px] inline-flex items-center justify-center transition-colors"
            aria-label="Exit practice to practice home"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {session.subjectName}
            </span>
            <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
              {session.topicName} Practice
            </h1>
          </div>
        </div>

        {/* Counters & Timer */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Answered / Skipped / Remaining Tally */}
          <div
            className="flex items-center gap-2 text-xs text-foreground-secondary font-medium"
            aria-label={`Progress summary: ${answeredCount} answered, ${skippedCount} skipped, ${remainingCount} remaining`}
          >
            <span className="inline-flex items-center gap-1 font-bold text-success">
              <span>{answeredCount}</span>
              <span className="text-foreground-secondary text-[11px] font-normal">{isHindi ? 'हल' : 'answered'}</span>
            </span>
            <span className="text-foreground-muted" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1 text-foreground-secondary">
              <span>{skippedCount}</span>
              <span className="text-[11px] font-normal">{isHindi ? 'छोड़े' : 'skipped'}</span>
            </span>
            <span className="text-foreground-muted" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1 text-foreground-secondary">
              <span>{remainingCount}</span>
              <span className="text-[11px] font-normal">{isHindi ? 'शेष' : 'remaining'}</span>
            </span>
          </div>

          {/* Accessible Timer */}
          <PracticeTimer
            initialSeconds={session.timeLimitSeconds || 600}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((prev) => !prev)}
            onTick={(elapsed) => {
              elapsedSecondsRef.current = elapsed;
            }}
          />

          {/* Quick Accessibility Config */}
          <button
            type="button"
            onClick={openCalibration}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] transition-colors"
            aria-label="Open accessibility calibration"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>A11y</span>
          </button>
        </div>
      </header>

      {/* Action Error Alert */}
      {actionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error text-xs font-semibold flex items-center justify-between gap-3 shadow-xs"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true">⚠️</span>
            <span>{actionError}</span>
          </span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs underline hover:opacity-80 p-1"
            aria-label="Dismiss error notification"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Practice Workspace: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Question Card: 3 columns */}
        <div className="lg:col-span-3">
          {currentQuestion && (
            <PracticeQuestionCard
              question={currentQuestion}
              currentIndex={currentIdx + 1}
              totalQuestions={session.totalQuestions}
              savedAnswer={savedAnswer}
              correctOptionIds={session.correctOptions?.[currentQuestion.id]}
              explanation={session.explanations?.[currentQuestion.id]}
              onSubmitAnswer={handleSubmitAnswer}
              onSkipQuestion={handleSkipQuestion}
              onGoPrevious={handlePrevious}
              onGoNext={handleNext}
              onFinishSession={() => setIsFinishModalOpen(true)}
              isLastQuestion={currentIdx === session.totalQuestions - 1}
            />
          )}
        </div>

        {/* Sidebar Question Navigator: 1 column */}
        <div className="lg:col-span-1">
          <PracticeNavigatorPalette
            questions={session.questions}
            answers={session.answers}
            currentIndex={currentIdx}
            onSelectQuestion={(idx) => setCurrentIdx(idx)}
          />
        </div>
      </div>

      {/* Pause Practice Dialog Modal */}
      <PracticePauseModal
        isOpen={isPaused}
        onResume={() => setIsPaused(false)}
        topicName={session.topicName}
      />

      {/* Finish Practice Confirmation Modal */}
      <PracticeFinishModal
        isOpen={isFinishModalOpen}
        unansweredCount={unansweredCount}
        totalQuestions={session.totalQuestions}
        onCancel={() => setIsFinishModalOpen(false)}
        onConfirmFinish={handleConfirmFinish}
      />
    </div>
  );
};
