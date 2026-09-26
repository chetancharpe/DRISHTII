import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { FontSizeControl } from './FontSizeControl';
import { ContrastControl } from './ContrastControl';
import { ThemeToggle } from './ThemeToggle';
import { AudioControl } from './AudioControl';
import { ReducedMotionControl } from './ReducedMotionControl';
import { LanguageSelector } from './LanguageSelector';
import { ResetSettingsModal } from './ResetSettingsModal';
import { Sliders, RotateCcw, X, Check } from 'lucide-react';
import { Button } from '../common/Button';

export interface AccessibilityPanelProps {
  onClose?: () => void;
  className?: string;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  onClose,
  className = '',
}) => {
  const {
    resetPreferences,
    isResetModalOpen,
    closeResetModal,
    confirmReset,
    savePreferences,
  } = useAccessibility();

  const handleApplyAndClose = () => {
    savePreferences();
    if (onClose) onClose();
  };

  return (
    <section
      aria-labelledby="a11y-panel-title"
      className={`bg-surface border border-border rounded-xl p-5 sm:p-6 flex flex-col gap-4 text-foreground shadow-lg max-h-[85vh] overflow-y-auto ${className}`}
    >
      {/* Panel Header */}
      <div className="border-b border-border pb-4 flex items-start justify-between gap-4 sticky top-0 bg-surface z-10">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" aria-hidden="true" />
            <h2 id="a11y-panel-title" className="text-lg sm:text-xl font-black text-foreground">
              Accessibility Calibration Center
            </h2>
          </div>
          <p className="text-xs text-foreground-muted mt-1 leading-relaxed max-w-xl">
            Fine-tune visual magnification, contrast, acoustic feedback, and navigation modes anytime. Preferences save automatically.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetPreferences}
            icon={<RotateCcw className="w-3.5 h-3.5 text-foreground-muted" />}
            aria-label="Reset all accessibility preferences to factory defaults"
          >
            Reset Defaults
          </Button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-foreground-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close accessibility calibration panel"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Structured Controls Section */}
      <div className="flex flex-col gap-2">
        <FontSizeControl showPreview={true} />
        <ContrastControl />
        <ThemeToggle />
        <AudioControl />
        <ReducedMotionControl />
        <LanguageSelector />
      </div>

      {/* Action Footer */}
      {onClose && (
        <div className="mt-2 pt-4 border-t border-border flex justify-end sticky bottom-0 bg-surface z-10">
          <Button
            variant="primary"
            onClick={handleApplyAndClose}
            icon={<Check className="w-4 h-4" aria-hidden="true" />}
            aria-label="Apply accessibility settings and close panel"
          >
            Save & Close
          </Button>
        </div>
      )}

      {/* Confirmation Modal for Reset */}
      <ResetSettingsModal
        isOpen={isResetModalOpen}
        onClose={closeResetModal}
        onConfirm={confirmReset}
      />
    </section>
  );
};
