import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useTranslation } from '../../i18n';
import { Sliders, Sun, Moon, Sparkles, Menu, X, HelpCircle, Languages } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { ProfileMenu } from '../candidate/ProfileMenu';

export interface NavbarProps {
  onOpenAccessibility?: () => void;
  onOpenHelp?: () => void;
  hasSidebar?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAccessibility,
  onOpenHelp,
  hasSidebar = false,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { preferences, setHighContrast, setPreferredLanguage } = useAccessibility();
  const { t, language, setLanguage } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Landing page elements are only shown on the public landing page when unauthenticated
  const isLandingPage = !isAuthenticated && location.pathname === '/';
  const isExaminerOrAdmin =
    user?.role === 'examiner' ||
    user?.role === 'admin' ||
    location.pathname.startsWith('/examiner') ||
    location.pathname.startsWith('/admin');

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/#features' },
    { label: 'Exams', href: '/candidate/exams' },
    { label: 'Resources', href: '/candidate/learning' },
    { label: 'Community', href: '/about' },
    { label: 'About', href: '/about' },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 w-full bg-surface/85 backdrop-blur-xl border-b border-border shadow-glass py-2.5 px-4 sm:px-6 z-sticky transition-all" role="banner">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Brand Logo (Only rendered when there is NO sidebar; on desktop with sidebar, ONE logo remains in sidebar) */}
        <div className="flex items-center gap-4">
          {!hasSidebar ? (
            <Link
              to="/"
              onClick={handleLinkClick}
              className="flex items-center gap-2.5 text-foreground hover:opacity-90 transition-opacity focus-visible:outline-offset-4"
              aria-label="DRISHTI Home Page"
            >
              <BrandLogo variant="full" size="md" />
            </Link>
          ) : (
            /* On mobile where the sidebar is collapsed, provide compact brand link */
            <div className="flex items-center gap-2 md:hidden">
              <Link
                to="/"
                onClick={handleLinkClick}
                className="flex items-center gap-2 text-foreground hover:opacity-90 transition-opacity focus-visible:outline-offset-4"
                aria-label="DRISHTI Home Page"
              >
                <BrandLogo variant="icon" size="sm" />
              </Link>
            </div>
          )}
        </div>

        {/* Desktop Navigation Links (Landing Page Center Nav) */}
        {isLandingPage && (
          <nav className="hidden lg:flex items-center gap-7" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isAnchor = link.href.startsWith('/#');
              const isActive = location.pathname === link.href || (link.href === '/' && location.pathname === '/');
              if (isAnchor) {
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                );
              }
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`text-sm transition-colors relative py-1 ${
                    isActive
                      ? 'font-bold text-foreground after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2.5px] after:bg-primary after:rounded-full'
                      : 'font-medium text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Side Controls & Actions - Clean, Single Horizontal Bar */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Help & Keyboard Shortcuts Action (Landing Page Only) */}
          {isLandingPage && onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              aria-label="Open Accessibility Help and Keyboard Shortcuts (Shortcut: Alt+H)"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-surface/60 hover:bg-surface-elevated text-foreground cursor-pointer min-h-[40px] backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <HelpCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span className="hidden md:inline">Help</span>
              <span className="keyboard-indicator text-[10px]">Alt+H</span>
            </button>
          )}

          {/* 1. Accessibility Preferences Quick Action - Candidate & Public Portal */}
          {!isExaminerOrAdmin && onOpenAccessibility && (
            <button
              type="button"
              onClick={onOpenAccessibility}
              aria-label={t('nav.accessibilitySettings')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary cursor-pointer min-h-[40px] backdrop-blur-md shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Sliders className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t('accessibility.title')}</span>
              <span className="keyboard-indicator text-[10px] hidden md:inline">Alt+A</span>
            </button>
          )}

          {/* 2. Quick Language Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = language === 'hi' ? 'en' : 'hi';
              setLanguage(next);
              setPreferredLanguage(next);
            }}
            aria-label={language === 'hi' ? 'Switch interface language to English' : 'इंटरफ़ेस भाषा हिन्दी में बदलें'}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-surface/60 hover:bg-surface-elevated text-foreground cursor-pointer min-h-[40px] backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Languages className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span className="font-bold">{language === 'hi' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* 3. Quick Light/Dark Theme Cycle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Current theme: ${theme}. Click to switch theme.`}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-surface/60 hover:bg-surface-elevated text-foreground cursor-pointer min-h-[40px] backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
            ) : theme === 'high_contrast' ? (
              <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            )}
            <span className="hidden xl:inline capitalize">{theme.replace('_', ' ')}</span>
          </button>

          {/* 4. High Contrast AAA Mode Toggle */}
          {!isExaminerOrAdmin && (
            <button
              type="button"
              onClick={() => setHighContrast(!preferences.highContrast)}
              aria-pressed={preferences.highContrast}
              aria-label={
                preferences.highContrast
                  ? 'Disable high contrast mode'
                  : 'Enable high contrast AAA mode'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border cursor-pointer min-h-[40px] backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                preferences.highContrast
                  ? 'bg-primary text-primary-contrast border-primary font-bold'
                  : 'border-border bg-surface/60 hover:bg-surface-elevated text-foreground'
              }`}
            >
              <span>Contrast</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/25 font-bold">
                {preferences.highContrast ? 'AAA' : 'AA'}
              </span>
            </button>
          )}

          {/* 5. Candidate Profile (Authenticated) / Sign In Buttons (Unauthenticated) */}
          {isAuthenticated ? (
            <div className="flex items-center pl-1 sm:pl-2 border-l border-border">
              <ProfileMenu />
            </div>
          ) : isLandingPage ? (
            <div className="flex items-center gap-2.5">
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2 text-sm font-semibold rounded-full border border-border bg-surface/80 hover:bg-surface-elevated text-foreground transition-all backdrop-blur-md shadow-sm min-h-[40px]"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/auth/role-selection"
                className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-primary hover:from-indigo-600 hover:to-primary-hover text-white shadow-glow-primary hover:shadow-lg active:scale-[0.98] transition-all min-h-[40px]"
              >
                <span>Get Started</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth/login"
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-surface/80 hover:bg-surface-elevated text-foreground min-h-[40px] backdrop-blur-md transition-all"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/auth/role-selection"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-primary text-white hover:from-indigo-600 hover:to-primary-hover shadow-glow-primary min-h-[40px] transition-all"
              >
                <span>Get Started</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle (Landing Page Only) */}
          {isLandingPage && (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-menu"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="p-2 rounded-xl border border-border bg-surface/60 text-foreground lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer backdrop-blur-md"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Accessible Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="lg:hidden border-t border-border mt-3 pt-3 pb-4 flex flex-col gap-2"
          role="region"
          aria-label="Mobile Navigation"
        >
          {isLandingPage && (
            <nav className="flex flex-col gap-1 border-b border-border pb-3 mb-1">
              {navLinks.map((link) => {
                const isAnchor = link.href.startsWith('/#');
                if (isAnchor) {
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={handleLinkClick}
                      className="px-3 py-2.5 rounded-md text-sm font-semibold text-foreground hover:bg-surface-elevated"
                    >
                      {link.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={handleLinkClick}
                    className="px-3 py-2.5 rounded-md text-sm font-semibold text-foreground hover:bg-surface-elevated"
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-md border border-border bg-surface text-foreground min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <span>Theme: {theme}</span>
              </button>
              <button
                type="button"
                onClick={() => setHighContrast(!preferences.highContrast)}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-md border border-border bg-surface text-foreground min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <span>Contrast: {preferences.highContrast ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Link
                  to="/auth/login"
                  onClick={handleLinkClick}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-md border border-border bg-surface text-foreground text-center min-h-[44px] flex items-center justify-center"
                >
                  Login
                </Link>
                <Link
                  to="/auth/role-selection"
                  onClick={handleLinkClick}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-md bg-primary text-primary-contrast text-center min-h-[44px] flex items-center justify-center"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
