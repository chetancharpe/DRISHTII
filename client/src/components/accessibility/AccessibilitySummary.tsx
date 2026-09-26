import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Sliders, Type, SunDim, Palette, Volume2, Keyboard, Languages, Activity, LayoutGrid } from 'lucide-react';

export interface AccessibilitySummaryProps {
  className?: string;
}

export const AccessibilitySummary: React.FC<AccessibilitySummaryProps> = ({ className = '' }) => {
  const { preferences, resolvedTheme } = useAccessibility();

  const summaryItems = [
    {
      label: 'Text Size',
      value: preferences.fontSize.charAt(0).toUpperCase() + preferences.fontSize.slice(1),
      icon: <Type className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
    {
      label: 'Contrast Mode',
      value: preferences.contrast === 'high' ? 'High Contrast (7:1+)' : 'Standard Contrast',
      icon: <SunDim className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
    {
      label: 'Theme',
      value: `${preferences.theme.charAt(0).toUpperCase() + preferences.theme.slice(1)} (Active: ${resolvedTheme})`,
      icon: <Palette className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
    {
      label: 'Audio Assistance',
      value: preferences.audioEnabled ? `Enabled (${preferences.speechRate} speed)` : 'Off (Native Screen Reader)',
      icon: <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
    {
      label: 'Navigation Mode',
      value: preferences.keyboardFirst ? 'Keyboard-first navigation' : 'Standard navigation',
      icon: <Keyboard className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
    {
      label: 'Language',
      value: preferences.language === 'hi' ? 'हिन्दी (Hindi)' : 'English',
      icon: <Languages className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
    {
      label: 'Reduced Motion',
      value: preferences.reducedMotion === 'on' ? 'Enabled (No animations)' : preferences.reducedMotion === 'system' ? 'Follow System' : 'Off (Smooth transitions)',
      icon: <Activity className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
    {
      label: 'Simplified Interface',
      value: preferences.simplifiedInterface ? 'Enabled (Minimal decorations)' : 'Standard appearance',
      icon: <LayoutGrid className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
  ];

  return (
    <div
      role="region"
      aria-label="Summary of chosen accessibility preferences"
      className={`rounded-xl border border-border bg-surface p-5 flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Sliders className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <h4 className="text-sm font-bold text-foreground">
          Configured Profile Summary
        </h4>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {summaryItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between p-3 rounded-lg border border-border bg-surface-elevated/50 gap-2"
          >
            <div className="flex items-center gap-2.5">
              {item.icon}
              <dt className="font-semibold text-foreground-secondary">
                {item.label}:
              </dt>
            </div>
            <dd className="font-bold text-foreground text-right">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
