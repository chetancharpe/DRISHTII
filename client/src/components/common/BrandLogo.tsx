import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  className?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  showSubtitle = false,
  subtitleText = 'Accessible Exams',
}) => {
  let isDark = true;
  try {
    const a11y = useAccessibility();
    if (a11y && a11y.resolvedTheme) {
      isDark = a11y.resolvedTheme !== 'light';
    }
  } catch {
    isDark = true;
  }

  // Height configurations for full wordmark
  const heightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-12',
    xl: 'h-14 sm:h-16',
  };

  const iconSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-16 h-16',
  };

  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <img
          src={isDark ? '/assets/images/drishti-eye-white.png' : '/assets/images/drishti-eye-dark.png'}
          alt="DRISHTI"
          className={`${iconSizeClasses[size]} object-contain`}
        />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="relative flex items-center justify-center p-1.5 rounded-lg bg-black/90 border border-primary/40 shrink-0 shadow-sm">
          <img
            src="/assets/images/drishti-eye-white.png"
            alt=""
            aria-hidden="true"
            className={`${iconSizeClasses[size]} object-contain`}
          />
        </div>
        <div className="flex flex-col">
          <span className="leading-tight font-extrabold tracking-tight text-foreground font-sans text-lg sm:text-xl">
            DRISHTI
          </span>
          {showSubtitle && (
            <span className="text-[10px] text-foreground-muted uppercase tracking-wider font-semibold -mt-0.5">
              {subtitleText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full Wordmark Logo
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative flex items-center">
        <img
          src={isDark ? '/assets/images/drishti-logo-white.png' : '/assets/images/drishti-logo-black.png'}
          alt="DRISHTI"
          className={`${heightClasses[size]} w-auto object-contain max-w-[200px] sm:max-w-none`}
        />
      </div>
      {showSubtitle && (
        <span className="text-[10px] text-foreground-muted uppercase tracking-widest font-bold mt-0.5 pl-0.5">
          {subtitleText}
        </span>
      )}
    </div>
  );
};
