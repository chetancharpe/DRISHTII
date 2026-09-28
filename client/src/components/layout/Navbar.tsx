import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useTranslation } from '../../i18n';
import { Sliders, Sun, Moon, Sparkles, Menu, X, HelpCircle, Languages } from 'lucide-react';

export interface NavbarProps {
  onOpenAccessibility?: () => void;
  onOpenHelp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAccessibility, onOpenHelp }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { preferences, setHighContrast } = useAccessibility();
  const { t, language, setLanguage } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Accessibility', href: '/#accessibility' },
    { label: 'For Examiners', href: '/#examiners' },
    { label: 'About', href: '/about' },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 w-full bg-surface/95 backdrop-blur-md border-b border-border py-3 px-4 sm:px-6 z-sticky" role="banner">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 text-foreground hover:text-primary font-bold text-xl tracking-tight focus-visible:outline-offset-4"
            aria-label="GoWow Home Page"
          >
            <span
              className="w-9 h-9 rounded-md bg-primary text-primary-contrast flex items-center justify-center font-extrabold text-lg select-none"
              aria-hidden="true"
            >
              G
            </span>
            <div className="flex flex-col">
              <span className="leading-tight font-extrabold tracking-tight">GoWow</span>
              <span className="text-[10px] text-foreground-muted uppercase tracking-wider font-semibold -mt-0.5">
                Accessible Exams
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isAnchor = link.href.startsWith('/#');
              if (isAnchor) {
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-colors"
                  >
                    {link.label}
                  </a>
                );
              }
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-surface-elevated text-primary font-semibold'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-surface-elevated'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Controls & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Help & Keyboard Shortcuts Action */}
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              aria-label="Open Accessibility Help and Keyboard Shortcuts (Shortcut: Alt+H)"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-border bg-surface hover:bg-surface-elevated text-foreground cursor-pointer min-h-[44px]"
            >
              <HelpCircle className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="hidden md:inline">Help</span>
              <span className="keyboard-indicator text-[10px]">Alt+H</span>
            </button>
          )}

          {/* Accessibility Quick Action */}
          {onOpenAccessibility && (
            <button
              type="button"
              onClick={onOpenAccessibility}
              aria-label={t('nav.accessibilitySettings')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-border-strong bg-surface-elevated hover:bg-surface text-foreground cursor-pointer min-h-[44px]"
            >
              <Sliders className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="hidden sm:inline">{t('accessibility.title')}</span>
              <span className="keyboard-indicator text-[10px]">Alt+A</span>
            </button>
          )}

          {/* Quick Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
            aria-label={language === 'hi' ? 'Switch interface language to English' : 'इंटरफ़ेस भाषा हिन्दी में बदलें'}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-border bg-surface hover:bg-surface-elevated text-foreground cursor-pointer min-h-[44px]"
          >
            <Languages className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="font-bold">{language === 'hi' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* Quick Theme Cycle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Current theme: ${theme}. Click to cycle theme presets.`}
            className="p-2 sm:px-2.5 sm:py-2 text-xs font-semibold rounded-md border border-border bg-surface hover:bg-surface-elevated text-foreground cursor-pointer min-h-[44px] min-w-[44px] hidden md:inline-flex items-center justify-center gap-1.5"
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
            ) : theme === 'high_contrast' ? (
              <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-primary" aria-hidden="true" />
            )}
            <span className="hidden xl:inline capitalize">{theme.replace('_', ' ')}</span>
          </button>

          {/* High Contrast Mode Quick Toggle */}
          <button
            type="button"
            onClick={() => setHighContrast(!preferences.highContrast)}
            aria-pressed={preferences.highContrast}
            aria-label={
              preferences.highContrast
                ? 'Disable high contrast mode'
                : 'Enable high contrast AAA mode'
            }
            className={`px-3 py-2 text-xs font-semibold rounded-md border cursor-pointer min-h-[44px] hidden sm:inline-flex items-center gap-1.5 ${
              preferences.highContrast
                ? 'bg-primary text-primary-contrast border-primary font-bold'
                : 'border-border bg-surface hover:bg-surface-elevated text-foreground'
            }`}
          >
            <span>Contrast</span>
            <span className="text-[10px] font-mono px-1 rounded bg-black/20">
              {preferences.highContrast ? 'AAA' : 'AA'}
            </span>
          </button>

          {/* User Sign In / Get Started */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3">
              <span className="text-xs text-foreground-muted hidden xl:inline font-mono">
                {user?.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-2 text-xs font-semibold rounded-md bg-surface hover:bg-surface-elevated text-status-error border border-border cursor-pointer min-h-[44px]"
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth/login"
                className="hidden sm:inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold rounded-md border border-border bg-surface hover:bg-surface-elevated text-foreground min-h-[44px]"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/auth/role-selection"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-md bg-primary text-primary-contrast hover:bg-primary-hover min-h-[44px]"
              >
                <span>Get Started</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="p-2 rounded-md border border-border bg-surface text-foreground lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
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
          <nav className="flex flex-col gap-1">
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

          <div className="border-t border-border pt-3 mt-1 flex flex-col gap-2">
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
