import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Modal } from '../common/Modal';
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel';
import { AccessibilityHelpModal } from '../accessibility/AccessibilityHelpModal';
import { CandidateVoiceAssistant } from '../candidate/CandidateVoiceAssistant';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface PageLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  fullWidth?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  showSidebar = false,
  fullWidth = false,
}) => {
  const location = useLocation();
  const isCandidateRoute = location.pathname.startsWith('/candidate');
  const { isCalibrationOpen, openCalibration, closeCalibration } = useAccessibility();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Global hotkeys: Alt+A toggles Accessibility Settings, Alt+H toggles Accessibility Help
  useKeyboardNavigation({
    'Alt+A': () => {
      if (isCalibrationOpen) {
        closeCalibration();
      } else {
        openCalibration();
      }
    },
    'Alt+H': () => {
      setIsHelpOpen((prev) => !prev);
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-fast">
      {/* Skip Navigation Link - Top of DOM hierarchy */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Global Application Navbar */}
      <Navbar
        onOpenAccessibility={openCalibration}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Layout Content Body */}
      <div className={`flex-1 flex w-full mx-auto ${fullWidth ? '' : 'max-w-7xl'}`}>
        {showSidebar && <Sidebar />}
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          className={`flex-1 outline-none focus-visible:outline-none ${
            fullWidth ? 'w-full' : 'p-4 sm:p-6 lg:p-8'
          }`}
        >
          {isCandidateRoute && <CandidateVoiceAssistant />}
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Application Footer */}
      <Footer
        onOpenAccessibility={openCalibration}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Global Accessible Calibration Center Modal */}
      <Modal
        isOpen={isCalibrationOpen}
        onClose={closeCalibration}
        title="Accessibility Calibration Center"
        description="Fine-tune sensory, typography, and keyboard controls. All settings persist on your device."
        maxWidth="lg"
      >
        <AccessibilityPanel onClose={closeCalibration} />
      </Modal>

      {/* Global Accessible Help & Keyboard Shortcuts Modal */}
      <AccessibilityHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenSettings={openCalibration}
      />
    </div>
  );
};

