import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Modal } from '../common/Modal';
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel';
import { AccessibilityHelpModal } from '../accessibility/AccessibilityHelpModal';
import { HandsFreeScribeHUD } from '../candidate/HandsFreeScribeHUD';
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
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('drishti_current_user') : null;
  const userRole = storedUser ? (() => { try { return JSON.parse(storedUser)?.role; } catch { return null; } })() : null;
  const isExaminerOrAdmin =
    location.pathname.startsWith('/examiner') ||
    location.pathname.startsWith('/admin') ||
    userRole === 'examiner' ||
    userRole === 'admin';
  const { isCalibrationOpen, openCalibration, closeCalibration } = useAccessibility();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Global hotkeys: Alt+A toggles Accessibility Settings, Alt+H toggles Accessibility Help
  // Strictly restricted to Candidate routes and public portal; disabled for Examiner & Admin
  useKeyboardNavigation({
    'Alt+A': () => {
      if (isExaminerOrAdmin) return;
      if (isCalibrationOpen) {
        closeCalibration();
      } else {
        openCalibration();
      }
    },
    'Alt+H': () => {
      if (isExaminerOrAdmin) return;
      setIsHelpOpen((prev) => !prev);
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-fast relative overflow-x-hidden">
      {/* Ambient Cosmic Background Lighting - Soft, non-intrusive glow at edges to preserve 100% text contrast */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Cyber Cyan Ambient Orb */}
        <div className="ambient-orb ambient-orb-2 absolute top-1/3 -right-40 w-80 sm:w-[480px] h-80 sm:h-[480px] rounded-full bg-cyan-600/8 dark:bg-cyan-500/8 blur-[150px] pointer-events-none" />
        {/* Cyber Violet Ambient Orb */}
        <div className="ambient-orb ambient-orb-1 absolute -bottom-40 left-1/4 w-80 sm:w-[480px] h-80 sm:h-[480px] rounded-full bg-purple-700/8 dark:bg-violet-600/8 blur-[160px] pointer-events-none" />
        {/* Subtle grid pattern overlay for high-tech holographic depth */}
        <div className="ambient-orb absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:28px_28px] opacity-30 dark:opacity-40 pointer-events-none" />
      </div>

      {/* Global Application Navbar */}
      <div className="sticky top-0 z-30 w-full">
        <Navbar
          hasSidebar={showSidebar}
          onOpenAccessibility={isExaminerOrAdmin ? undefined : openCalibration}
          onOpenHelp={isExaminerOrAdmin ? undefined : () => setIsHelpOpen(true)}
        />
      </div>

      {/* Layout Content Body */}
      <div className={`relative z-10 flex-1 flex w-full mx-auto ${fullWidth ? '' : 'max-w-7xl'}`}>
        {showSidebar && <Sidebar />}
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          className={`flex-1 outline-none focus-visible:outline-none ${
            fullWidth ? 'w-full' : 'p-4 sm:p-6 lg:p-8'
          }`}
        >
          <ErrorBoundary>
            {isCandidateRoute && <HandsFreeScribeHUD />}
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Application Footer */}
      <div className="relative z-10">
        <Footer
          onOpenAccessibility={isExaminerOrAdmin ? undefined : openCalibration}
          onOpenHelp={isExaminerOrAdmin ? undefined : () => setIsHelpOpen(true)}
        />
      </div>

      {/* Global Accessible Calibration Center Modal - Candidate Only */}
      {!isExaminerOrAdmin && (
        <Modal
          isOpen={isCalibrationOpen}
          onClose={closeCalibration}
          title="Accessibility Calibration Center"
          description="Fine-tune sensory, typography, and keyboard controls. All settings persist on your device."
          maxWidth="lg"
        >
          <AccessibilityPanel onClose={closeCalibration} />
        </Modal>
      )}

      {/* Global Accessible Help & Keyboard Shortcuts Modal - Candidate Only */}
      {!isExaminerOrAdmin && (
        <AccessibilityHelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          onOpenSettings={openCalibration}
        />
      )}
    </div>
  );
};

