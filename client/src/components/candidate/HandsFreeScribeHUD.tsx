import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, HelpCircle } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { resumeAudioContext } from '../../utils/audioEarcons';

export const HandsFreeScribeHUD: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { preferences, isSpeaking, speak, announce } = useAccessibility();
  const isHindi = preferences.language === 'hi';

  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Status / Where Am I handler for current route
  const handleAnnounceStatus = useCallback(() => {
    let statusText = '';
    const path = location.pathname;

    if (path.includes('/candidate/dashboard')) {
      statusText = isHindi
        ? 'आप कैंडिडेट डैशबोर्ड पर हैं। नए मॉक टेस्ट और परीक्षा देने के लिए बोलें "मॉक टेस्ट" या "परीक्षाएं"।'
        : 'You are on the Candidate Dashboard. To start tests, say "Mock Tests" or "Exams".';
    } else if (path.includes('/candidate/mock-tests')) {
      statusText = isHindi
        ? 'आप मॉक टेस्ट सूची पर हैं। किसी भी टेस्ट को शुरू करने के लिए उसका नाम बोलें या स्पेस दबाएं।'
        : 'You are on the Mock Tests page. Say the test name to begin.';
    } else if (path.includes('/candidate/exams')) {
      statusText = isHindi
        ? 'आप आधिकारिक परीक्षा सूची पर हैं।'
        : 'You are on the Official Examinations page.';
    } else if (path.includes('/candidate/results')) {
      statusText = isHindi
        ? 'आप अपने परिणाम और रिपोर्ट कार्ड पृष्ठ पर हैं।'
        : 'You are on your Results and Performance page.';
    } else {
      statusText = isHindi
        ? 'हैंड्स-फ्री वॉइस मोड सक्रिय है। आप कभी भी "डैशबोर्ड", "मॉक टेस्ट" या "स्थिति" बोल सकते हैं।'
        : 'Hands-Free Scribe Mode is active. You can say "Dashboard", "Mock Tests", or "Status" anytime.';
    }

    speak(statusText);
    announce(statusText, 'polite');
  }, [location.pathname, isHindi, speak, announce]);

  // Global Hands-Free Voice Commands
  const voice = useVoiceCommands({
    onNavigate: (route) => {
      navigate(route);
    },
    onStatus: handleAnnounceStatus,
  });

  // Unlock Audio on First User Gesture (Click or Keypress)
  useEffect(() => {
    const unlockAudio = () => {
      resumeAudioContext();
      setHasInteracted(true);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Keyboard shortcut: Alt+S toggles Hands-Free mode, Spacebar toggles if not in input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        voice.toggleListening();
      } else if (
        e.code === 'Space' &&
        !isInput &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        // Toggle hands-free on Spacebar if not typing
        e.preventDefault();
        voice.toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voice]);

  // If browser does not support Web Speech, render unobtrusive notice
  if (!voice.isSupported) {
    return null;
  }

  return (
    <>
      {/* Floating Hands-Free Scribe HUD */}
      <aside
        role="region"
        aria-label={
          isHindi
            ? 'हैंड्स-फ्री डिजिटल लेखक स्थिति बार'
            : 'Hands-Free Digital Scribe Status'
        }
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 p-2 rounded-2xl bg-surface/95 backdrop-blur-md border-2 border-border shadow-xl text-foreground transition-all duration-200"
      >
        {/* Mic Toggle Button */}
        <button
          type="button"
          onClick={voice.toggleListening}
          aria-pressed={voice.isListening}
          aria-label={
            voice.isListening
              ? isHindi
                ? 'हैंड्स-फ्री मोड चालू है। बंद करने के लिए स्पेस या क्लिक करें।'
                : 'Hands-Free Scribe active. Press Space or Click to pause.'
              : isHindi
                ? 'हैंड्स-फ्री मोड बंद है। चालू करने के लिए स्पेस या क्लिक करें।'
                : 'Hands-Free Scribe paused. Press Space or Click to activate.'
          }
          className={`relative p-3 rounded-xl flex items-center justify-center min-w-[48px] min-h-[48px] font-bold text-sm transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
            voice.isListening
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-surface-elevated hover:bg-border/60 text-foreground border border-border'
          }`}
        >
          {voice.isListening ? (
            <>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <Mic className="w-5 h-5 animate-pulse" aria-hidden="true" />
            </>
          ) : (
            <MicOff className="w-5 h-5 opacity-70" aria-hidden="true" />
          )}
        </button>

        {/* State Information */}
        <div className="flex flex-col pr-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wide uppercase">
              {voice.isListening
                ? isHindi
                  ? 'हैंड्स-फ्री लेखक सक्रिय'
                  : 'Hands-Free Scribe'
                : isHindi
                ? 'हैंड्स-फ्री रुका हुआ'
                : 'Scribe Paused'}
            </span>

            {isSpeaking && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                <Volume2 className="w-3 h-3 animate-pulse" aria-hidden="true" />
                <span>{isHindi ? 'बोल रहा है...' : 'Speaking...'}</span>
              </span>
            )}
          </div>

          <p className="text-[11px] text-foreground-muted font-medium">
            {voice.isListening
              ? voice.lastCommand
                ? `"${voice.lastCommand}"`
                : isHindi
                ? 'बोलिए (जैसे: "Option B", "अगला", "स्थिति")'
                : 'Speak: "Option B", "Next", "Status"'
              : isHindi
              ? 'चालू करने के लिए [Space] दबाएं'
              : 'Press [Spacebar] to listen'}
          </p>
        </div>

        {/* Help button */}
        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          aria-label={isHindi ? 'वॉइस कमांड्स मदद' : 'Voice commands help'}
          className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
        >
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
        </button>

        {!hasInteracted && (
          <span className="sr-only">
            {isHindi
              ? 'हैंड्स-फ्री वॉइस शुरू करने के लिए स्पेस दबाएं।'
              : 'Press Spacebar to activate hands-free voice.'}
          </span>
        )}
      </aside>

      {/* Voice Commands Help Modal */}
      {showHelpModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-help-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-surface border-2 border-primary rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 id="voice-help-title" className="text-xl font-bold text-foreground">
              {isHindi ? '🎙️ हैंड्स-फ्री वॉइस कमांड्स गाइड' : '🎙️ Hands-Free Voice Commands'}
            </h2>
            <div className="space-y-3 text-sm text-foreground">
              <p className="text-foreground-muted">
                {isHindi
                  ? 'आप परीक्षा और डैशबोर्ड को बिना छुए सिर्फ आवाज़ से चला सकते हैं:'
                  : 'You can navigate and answer questions completely hands-free:'}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                <li><strong>उत्तर चुनना:</strong> "Option A", "Option B", "पहला", "दूसरा"</li>
                <li><strong>नेविगेट करना:</strong> "Next", "अगला", "Previous", "पिछला"</li>
                <li><strong>सवाल सुनना:</strong> "सवाल पढ़ो", "Read question", "Options"</li>
                <li><strong>समय व स्थिति:</strong> "Time", "कितना समय बचा है", "Status"</li>
                <li><strong>परीक्षा सबमिट:</strong> "Submit", पुष्टि के लिए बोलें "हाँ सबमिट करो"</li>
                <li><strong>डैशबोर्ड नेविगेशन:</strong> "Dashboard", "Mock tests", "Exams", "Results"</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-contrast font-bold hover:bg-primary-hover focus:ring-4 focus:ring-primary/40 transition-all"
            >
              {isHindi ? 'समझ गया (बंद करें)' : 'Got it (Close)'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
