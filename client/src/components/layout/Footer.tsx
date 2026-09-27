import React from 'react';
import { Link } from 'react-router-dom';

export interface FooterProps {
  onOpenAccessibility?: () => void;
  onOpenHelp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAccessibility, onOpenHelp }) => {
  return (
    <footer className="w-full bg-surface border-t border-border py-12 px-4 sm:px-6 mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-sm">
          {/* Brand Column */}
          <div className="col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded bg-primary text-primary-contrast flex items-center justify-center font-extrabold text-sm"
                aria-hidden="true"
              >
                G
              </span>
              <span className="text-xl font-bold text-foreground tracking-tight">GoWow</span>
            </div>
            <p className="text-xs text-foreground-secondary leading-relaxed max-w-sm">
              An accessibility-first digital examination and preparation platform helping visually impaired and low-vision candidates independently prepare, practice, and excel in competitive examinations.
            </p>
            <p className="text-xs font-semibold text-primary mt-1">
              "Designed for inclusive digital education."
            </p>
          </div>

          {/* Platform Links */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Platform</h3>
            <ul className="flex flex-col gap-2 text-xs text-foreground-secondary">
              <li>
                <Link to="/candidate/practice" className="hover:text-foreground hover:underline">
                  Practice
                </Link>
              </li>
              <li>
                <Link to="/candidate/mock-tests" className="hover:text-foreground hover:underline">
                  Mock Tests
                </Link>
              </li>
              <li>
                <Link to="/candidate/exams" className="hover:text-foreground hover:underline">
                  Exams
                </Link>
              </li>
              <li>
                <Link to="/candidate/results" className="hover:text-foreground hover:underline">
                  Results
                </Link>
              </li>
            </ul>
          </div>

          {/* Accessibility Links */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Accessibility</h3>
            <ul className="flex flex-col gap-2 text-xs text-foreground-secondary">
              <li>
                <button
                  type="button"
                  onClick={onOpenHelp}
                  className="text-left text-xs text-primary hover:underline cursor-pointer"
                  aria-label="Open Accessibility Help and Keyboard Shortcuts (Alt+H)"
                >
                  Help &amp; Shortcuts (Alt+H)
                </button>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-foreground hover:underline">
                  Keyboard Navigation
                </a>
              </li>
              <li>
                <a href="#accessibility" className="hover:text-foreground hover:underline">
                  Screen Reader Support
                </a>
              </li>
              <li>
                {onOpenAccessibility ? (
                  <button
                    type="button"
                    onClick={onOpenAccessibility}
                    className="text-left text-xs text-primary hover:underline cursor-pointer"
                  >
                    Accessibility Settings (Alt+A)
                  </button>
                ) : (
                  <Link to="/auth/accessibility-setup" className="hover:text-foreground hover:underline">
                    Accessibility Settings
                  </Link>
                )}
              </li>
            </ul>
          </div>

          {/* For Institutions Links */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">For Institutions</h3>
            <ul className="flex flex-col gap-2 text-xs text-foreground-secondary">
              <li>
                <Link to="/examiner/dashboard" className="hover:text-foreground hover:underline">
                  Examiner Platform
                </Link>
              </li>
              <li>
                <Link to="/examiner/create-exam" className="hover:text-foreground hover:underline">
                  Create Exams
                </Link>
              </li>
              <li>
                <Link to="/examiner/analytics" className="hover:text-foreground hover:underline">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal Links */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Company & Legal</h3>
            <ul className="flex flex-col gap-2 text-xs text-foreground-secondary">
              <li>
                <Link to="/about" className="hover:text-foreground hover:underline">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <span className="text-foreground-muted cursor-default">Privacy Policy</span>
              </li>
              <li>
                <span className="text-foreground-muted cursor-default">Terms of Use</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground-muted">
          <p>© {new Date().getFullYear()} GoWow Platform. All rights reserved.</p>
          <p className="text-[11px]">
            GoWow is designed and tested against WCAG 2.1 AA requirements.
          </p>
        </div>
      </div>
    </footer>
  );
};

