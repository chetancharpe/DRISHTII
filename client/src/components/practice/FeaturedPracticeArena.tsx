import React from 'react';
import { PlayCircle, Zap, Calculator, Brain, BookOpen, Compass, Sparkles } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { PracticeSessionFilter } from '../../types/practice';

export interface FeaturedPracticeArenaProps {
  onStartPractice: (filter: PracticeSessionFilter) => void;
  isLoading?: boolean;
  className?: string;
}

interface SubjectCardConfig {
  id: string;
  subjectId: string;
  topicId: string;
  titleEn: string;
  titleHi: string;
  subjectEn: string;
  subjectHi: string;
  descriptionEn: string;
  descriptionHi: string;
  badgeEn: string;
  badgeHi: string;
  difficulty: 'easy' | 'medium' | 'hard';
  colorTheme: {
    border: string;
    hoverBorder: string;
    iconBg: string;
    text: string;
    badgeBg: string;
  };
  icon: React.ReactNode;
}

export const FeaturedPracticeArena: React.FC<FeaturedPracticeArenaProps> = ({
  onStartPractice,
  isLoading = false,
  className = '',
}) => {
  const { preferences } = useAccessibility();
  const isHindi =
    preferences?.language === 'hi' ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  const cards: SubjectCardConfig[] = [
    {
      id: 'math-percentages',
      subjectId: 'mathematics',
      topicId: 'percentages',
      titleEn: 'Percentages & Fractions',
      titleHi: 'प्रतिशत एवं भिन्न',
      subjectEn: 'Mathematics',
      subjectHi: 'गणित',
      descriptionEn: 'Core calculation shortcuts, percentage change, and ratio applications.',
      descriptionHi: 'प्रतिशत परिवर्तन, भिन्न गणना शॉर्टकट, और अनुपात के व्यावहारिक प्रश्न।',
      badgeEn: 'High Yield',
      badgeHi: 'अति महत्वपूर्ण',
      difficulty: 'easy',
      colorTheme: {
        border: 'border-emerald-500/20',
        hoverBorder: 'hover:border-emerald-500/60',
        iconBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        text: 'text-emerald-500',
        badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      },
      icon: <Calculator className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'reasoning-coding',
      subjectId: 'reasoning',
      topicId: 'coding-decoding',
      titleEn: 'Coding & Decoding',
      titleHi: 'कोडिंग और डिकोडिंग',
      subjectEn: 'Reasoning Ability',
      subjectHi: 'तर्कशक्ति',
      descriptionEn: 'Letter shift patterns, opposite alphabet pairs, and numerical substitutions.',
      descriptionHi: 'वर्णमाला शिफ्ट पैटर्न, विपरीत जोड़े, और संख्यात्मक प्रतिस्थापन नियम।',
      badgeEn: 'Exam Classic',
      badgeHi: 'मानक स्तर',
      difficulty: 'medium',
      colorTheme: {
        border: 'border-violet-500/20',
        hoverBorder: 'hover:border-violet-500/60',
        iconBg: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
        text: 'text-violet-500',
        badgeBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      },
      icon: <Brain className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'english-rc',
      subjectId: 'english',
      topicId: 'reading-comprehension',
      titleEn: 'Reading Comprehension & Synonyms',
      titleHi: 'गद्यांश और शब्दावली',
      subjectEn: 'English Language',
      subjectHi: 'अंग्रेजी भाषा',
      descriptionEn: 'Contextual inference, vocabulary in passage, antonyms, and central themes.',
      descriptionHi: 'गद्यांश पर आधारित प्रश्न, मुख्य भाव, पर्यायवाची और विलोम शब्द।',
      badgeEn: 'Verbal Focus',
      badgeHi: 'भाषा कौशल',
      difficulty: 'medium',
      colorTheme: {
        border: 'border-blue-500/20',
        hoverBorder: 'hover:border-blue-500/60',
        iconBg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        text: 'text-blue-500',
        badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      },
      icon: <BookOpen className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'gk-affairs',
      subjectId: 'general-knowledge',
      topicId: 'current-affairs',
      titleEn: 'Current Affairs & Defence',
      titleHi: 'करंट अफेयर्स और रक्षा',
      subjectEn: 'General Knowledge',
      subjectHi: 'सामान्य ज्ञान',
      descriptionEn: 'Joint military exercises, national awards, multilateral summits, and Indian polity.',
      descriptionHi: 'सैन्य अभ्यास, राष्ट्रीय पुरस्कार, अंतर्राष्ट्रीय सम्मेलन और भारतीय राजव्यवस्था।',
      badgeEn: 'Updated 2026',
      badgeHi: 'नवीनतम 2026',
      difficulty: 'medium',
      colorTheme: {
        border: 'border-amber-500/20',
        hoverBorder: 'hover:border-amber-500/60',
        iconBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        text: 'text-amber-500',
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      },
      icon: <Compass className="w-5 h-5" aria-hidden="true" />,
    },
  ];

  return (
    <section aria-labelledby="featured-arena-heading" className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <h2 id="featured-arena-heading" className="text-base sm:text-lg font-black text-foreground tracking-tight">
            {isHindi ? 'विशेष अभ्यास विषय (त्वरित शुरुआत)' : 'Core Subject Practice Arena'}
          </h2>
        </div>
        <span className="text-xs text-foreground-muted hidden sm:inline">
          {isHindi ? 'त्वरित शुरुआत के लिए किसी भी विषय का 10 या 5 सवाल सेट चुनें' : 'Select any subject to launch an untimed practice session'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list">
        {cards.map((card) => {
          const subjectTitle = isHindi ? card.subjectHi : card.subjectEn;
          const topicTitle = isHindi ? card.titleHi : card.titleEn;
          const desc = isHindi ? card.descriptionHi : card.descriptionEn;
          const badge = isHindi ? card.badgeHi : card.badgeEn;

          return (
            <div
              key={card.id}
              role="listitem"
              className={`p-5 rounded-2xl border-2 border-border bg-surface ${card.colorTheme.hoverBorder} transition-all duration-200 flex flex-col justify-between gap-4 shadow-sm group`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className={`p-2.5 rounded-xl border ${card.colorTheme.iconBg} transition-transform group-hover:scale-105`}>
                    {card.icon}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${card.colorTheme.badgeBg}`}>
                    {badge}
                  </span>
                </div>

                <div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${card.colorTheme.text}`}>
                    {subjectTitle}
                  </span>
                  <h3 className="text-base font-black text-foreground mt-0.5 tracking-tight">
                    {topicTitle}
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed line-clamp-2">
                    {desc}
                  </p>
                </div>
              </div>

              {/* Action Buttons: 10 Questions vs Quick 5 */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    onStartPractice({
                      examId: 'cds',
                      subjectId: card.subjectId,
                      topicId: card.topicId,
                      difficulty: card.difficulty,
                      questionCount: 10,
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] disabled:opacity-50"
                  aria-label={`${subjectTitle}: ${topicTitle}. ${isHindi ? '10 प्रश्न अभ्यास शुरू करें' : 'Start 10 questions session'}`}
                >
                  <PlayCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isHindi ? '10 सवाल अभ्यास' : 'Start 10 Questions'}</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    onStartPractice({
                      examId: 'cds',
                      subjectId: card.subjectId,
                      topicId: card.topicId,
                      difficulty: card.difficulty,
                      questionCount: 5,
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated hover:bg-surface-hover text-foreground font-semibold text-xs border border-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] disabled:opacity-50"
                  aria-label={`${subjectTitle}: ${topicTitle}. ${isHindi ? 'त्वरित 5 सवाल शुरू करें' : 'Start quick 5 questions session'}`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                  <span>{isHindi ? 'त्वरित 5 सवाल (~8 मिनट)' : 'Quick 5 Qs (~8 min)'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
