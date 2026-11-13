import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAccessibility } from '../../hooks/useAccessibility';
import { ProfileMenu } from './ProfileMenu';
import { Sliders, Sparkles } from 'lucide-react';

export interface DashboardHeaderProps {
  className?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { openCalibration, preferences } = useAccessibility();
  const isHindi = preferences?.language === 'hi' || (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (isHindi) {
      if (hour < 12) return 'शुभ प्रभात';
      if (hour < 17) return 'शुभ दोपहर';
      return 'शुभ संध्या';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const candidateName = user?.name || (isHindi ? 'परीक्षार्थी' : 'Candidate');

  return (
    <header
      role="banner"
      aria-label={isHindi ? 'कैंडिडेट डैशबोर्ड हेडर' : 'Candidate dashboard header'}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border ${className}`}
    >
      <div className="flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold w-fit">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isHindi ? 'स्वतंत्र परीक्षा पोर्टल' : 'Independent Examination Portal'}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          {getGreeting()}, {candidateName}
        </h1>

        <p className="text-sm text-foreground-secondary leading-relaxed">
          {isHindi
            ? 'अपनी तैयारी जारी रखने के लिए तैयार हैं? आपका अगला अभ्यास सत्र नीचे उपलब्ध है।'
            : 'Ready to continue your preparation? Your next practice session is ready below.'}
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={openCalibration}
          aria-label={isHindi ? 'सुलभता केंद्र खोलें (शॉर्टकट: Alt+A)' : 'Open Accessibility Calibration Center (Shortcut: Alt+A)'}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-foreground text-xs font-bold transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Sliders className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{isHindi ? 'सुलभता' : 'Accessibility'}</span>
          <span className="keyboard-indicator text-[10px]">Alt+A</span>
        </button>

        <ProfileMenu />
      </div>
    </header>
  );
};
