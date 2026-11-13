import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { practiceService } from '../../../services/practiceService';
import {
  PracticeFilterCard,
  PracticeKPIStrip,
  FeaturedPracticeArena,
  PracticeSubjectMastery,
} from '../../../components/practice';
import { PracticeSessionFilter } from '../../../types/practice';
import {
  History,
  BookOpen,
  Sparkles,
  Sliders,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAccessibility } from '../../../contexts/AccessibilityContext';
import { AccessibilityQuickBar } from '../../../components/accessibility/AccessibilityQuickBar';

export const PracticeHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subjectId: routeSubjectId } = useParams<{ subjectId?: string }>();
  const { preferences, openCalibration } = useAccessibility();
  const isHindi =
    preferences?.language === 'hi' ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  const initialSubject = routeSubjectId || searchParams.get('subject') || 'mathematics';
  const initialTopic = searchParams.get('topic') || 'percentages';

  const [currentSubjectId, setCurrentSubjectId] = useState<string>(initialSubject);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [startError, setStartError] = useState<string | null>(null);

  const customFilterRef = useRef<HTMLDivElement>(null);

  // Read telemetry metrics from live session storage if available
  const [kpiMetrics, setKpiMetrics] = useState({
    questionsPracticed: 184,
    accuracyPercent: 82,
    streakDays: 7,
    timeMinutesPracticed: 30,
    targetMinutes: 45,
  });

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('drishti_candidate_dashboard_data');
        if (raw) {
          const d = JSON.parse(raw);
          setKpiMetrics({
            questionsPracticed: d?.overviewStats?.questionsPracticedCount ?? 184,
            accuracyPercent: d?.overviewStats?.averageScorePercent ?? 82,
            streakDays: d?.dailyGoal?.streakDays ?? 7,
            timeMinutesPracticed: d?.dailyGoal?.timeMinutesPracticed ?? 30,
            targetMinutes: d?.dailyGoal?.targetMinutes ?? 45,
          });
        }
      } catch {}
    }
  }, []);

  const handleStartPractice = async (filter: PracticeSessionFilter) => {
    try {
      setIsStarting(true);
      setStartError(null);
      const session = await practiceService.startPracticeSession(filter);
      navigate(`/candidate/practice/session/${session.id}`);
    } catch (err) {
      console.error('Failed to start practice session', err);
      setStartError(
        isHindi
          ? 'अभ्यास सत्र शुरू करने में समस्या आई। कृपया पुनः प्रयास करें।'
          : 'Failed to start practice session. Please try again.'
      );
      setIsStarting(false);
    }
  };

  const handleSelectSubjectForCustomPractice = (subjectId: string) => {
    setCurrentSubjectId(subjectId);
    if (customFilterRef.current) {
      customFilterRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-12 max-w-6xl mx-auto">
      {/* Skip links for screen readers */}
      <a href="#quick-arena-section" className="skip-link">
        {isHindi ? 'त्वरित अभ्यास विषयों पर जाएं' : 'Skip directly to Quick Practice Sets'}
      </a>
      <a href="#custom-filter-section" className="skip-link">
        {isHindi ? 'कस्टमाइज़्ड अभ्यास फ़िल्टर पर जाएं' : 'Skip to Custom Practice Filter'}
      </a>

      {/* 1. Header with Title & Action Navigation */}
      <header
        role="banner"
        aria-label={isHindi ? 'अभ्यास केंद्र हेडर' : 'Practice Hub Header'}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border"
      >
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold w-fit">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isHindi ? 'अनुकूली इंटरैक्टिव अभ्यास केंद्र' : 'Adaptive Interactive Practice Arena'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {isHindi ? 'अभ्यास केंद्र (Practice Hub)' : 'Practice Arena'}
          </h1>

          <p className="text-sm text-foreground-secondary leading-relaxed max-w-3xl">
            {isHindi
              ? 'विषय, टॉपिक और कठिनाई स्तर चुनकर असीमित अभ्यास करें। हर सवाल पर तुरंत बोलकर सही/गलत उत्तर की जांच और पूर्ण चरणबद्ध स्पष्टीकरण उपलब्ध है।'
              : 'Untimed question practice across all examination topics with instant voice answer evaluation, acoustic feedback, and step-by-step explanations.'}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
          <Link
            to="/candidate/practice/history"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface/80 border border-border hover:bg-surface-elevated hover:border-primary/50 text-foreground text-xs font-bold transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-glass backdrop-blur-md"
            aria-label={isHindi ? 'अभ्यास इतिहास देखें' : 'View Practice Session History'}
          >
            <History className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>{isHindi ? 'अभ्यास इतिहास' : 'Practice History'}</span>
          </Link>

          <button
            type="button"
            onClick={openCalibration}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface/80 border border-border hover:bg-surface-elevated hover:border-primary/50 text-foreground text-xs font-bold transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-glass backdrop-blur-md"
            aria-label={isHindi ? 'सुलभता केंद्र खोलें' : 'Open Accessibility Calibration'}
          >
            <Sliders className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span className="hidden md:inline">{isHindi ? 'सुलभता' : 'Accessibility'}</span>
          </button>

          <Link
            to="/candidate/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface/80 border border-border hover:bg-surface-elevated hover:border-primary/50 text-foreground text-xs font-bold transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-glass backdrop-blur-md"
            aria-label={isHindi ? 'डैशबोर्ड पर वापस जाएं' : 'Return to Candidate Dashboard'}
          >
            <LayoutDashboard className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
            <span>{isHindi ? 'डैशबोर्ड' : 'Dashboard'}</span>
          </Link>
        </div>
      </header>

      {/* Error Alert if session could not be started */}
      {startError && (
        <aside
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-destructive/10 border-2 border-destructive/40 text-destructive flex items-center gap-3 shadow-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">{startError}</p>
        </aside>
      )}

      {/* 2. Key Performance Indicators Strip */}
      <PracticeKPIStrip
        questionsPracticed={kpiMetrics.questionsPracticed}
        accuracyPercent={kpiMetrics.accuracyPercent}
        streakDays={kpiMetrics.streakDays}
        timeMinutesPracticed={kpiMetrics.timeMinutesPracticed}
        targetMinutes={kpiMetrics.targetMinutes}
      />

      {/* 3. Core Subject Featured Practice Arena */}
      <div id="quick-arena-section" tabIndex={-1} className="focus:outline-none">
        <FeaturedPracticeArena
          onStartPractice={handleStartPractice}
          isLoading={isStarting}
        />
      </div>

      {/* 4. Interactive Custom Practice Filter Card */}
      <div id="custom-filter-section" ref={customFilterRef} tabIndex={-1} className="focus:outline-none">
        <PracticeFilterCard
          initialSubjectId={currentSubjectId}
          initialTopicId={initialTopic}
          onStartPractice={handleStartPractice}
          isLoading={isStarting}
        />
      </div>

      {/* 5. Subject Practice Mastery Visualizer */}
      <PracticeSubjectMastery
        onStartSubjectPractice={handleSelectSubjectForCustomPractice}
      />

      {/* 6. Practice Mode vs Live Examination Guide Banner */}
      <section
        aria-labelledby="practice-guidelines-heading"
        className="p-5 sm:p-6 rounded-2xl border border-border bg-surface/80 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-glass relative glass-specular"
      >
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0" aria-hidden="true">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 id="practice-guidelines-heading" className="text-sm sm:text-base font-black text-foreground">
              {isHindi ? 'अभ्यास मोड और लाइव परीक्षा में अंतर' : 'Practice Arena vs Live Proctored Examination'}
            </h2>
            <p className="text-xs text-foreground-secondary leading-relaxed max-w-2xl">
              {isHindi
                ? 'अभ्यास मोड में कोई नकारात्मक अंकन या सख्त समय सीमा नहीं है। आप आवाज से उत्तर दे सकते हैं, तुरंत सही/गलत का परिणाम सुन सकते हैं और सत्र को कभी भी रोक सकते हैं। आधिकारिक लाइव परीक्षाएं औपचारिक नियमों और समय सीमा के तहत आयोजित होती हैं।'
                : 'Practice sessions are flexible and untimed with instant voice feedback and answer explanations. Live official examinations follow formal timed regulations.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <Link
            to="/candidate/learn"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface/70 border border-border hover:bg-surface-elevated text-foreground text-xs font-bold transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm backdrop-blur-md"
          >
            <span>{isHindi ? 'पाठ्यक्रम नोट्स देखें' : 'Browse Learning Notes'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
          </Link>

          <Link
            to="/candidate/mock-tests"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-primary hover:from-indigo-600 hover:to-primary-hover text-white text-xs font-bold transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-glow-primary"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isHindi ? 'मॉक टेस्ट दें' : 'Take Mock Test'}</span>
          </Link>
        </div>
      </section>

      {/* Floating Accessibility Bar */}
      <AccessibilityQuickBar />
    </div>
  );
};
