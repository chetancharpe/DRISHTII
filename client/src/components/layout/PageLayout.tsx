import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Modal } from '../common/Modal';
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel';
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
  const { isCalibrationOpen, openCalibration, closeCalibration } = useAccessibility();

  // Global hotkey: Alt+A toggles Accessibility Calibration Center anywhere
  useKeyboardNavigation({
    'Alt+A': () => {
      if (isCalibrationOpen) {
        closeCalibration();
      } else {
        openCalibration();
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-fast">
      {/* Skip Navigation Link - Top of DOM hierarchy */}
      <a href="#main-content" className="skip-link">
        Skip to main content [Press Enter]
      </a>

      {/* Global Application Navbar */}
      <Navbar onOpenAccessibility={openCalibration} />

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
          {children}
        </main>
      </div>

      {/* Global Application Footer */}
      <Footer onOpenAccessibility={openCalibration} />

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
    </div>
  );
};
