import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAccessibility } from '../../hooks/useAccessibility';
import {
  Sliders,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Shield,
} from 'lucide-react';

export const ProfileMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { openCalibration } = useAccessibility();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/auth/login');
  };

  const handleOpenAccessibility = () => {
    setIsOpen(false);
    openCalibration();
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        id="candidate-profile-menu-button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Profile menu for ${user?.name || 'Candidate'}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-foreground min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold text-xs shrink-0 select-none">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-bold text-foreground leading-none">
            {user?.name || 'Candidate'}
          </span>
          <span className="text-[10px] text-foreground-muted leading-tight mt-0.5">
            Verified Candidate
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-foreground-muted transition-transform duration-fast ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Accessible Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-labelledby="candidate-profile-menu-button"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-surface p-2 shadow-xl z-dropdown flex flex-col gap-1 focus:outline-none"
        >
          {/* User Profile Header in Menu */}
          <div className="p-3 border-b border-border bg-surface-elevated/50 rounded-lg mb-1">
            <p className="text-xs font-bold text-foreground truncate">
              {user?.name || 'Candidate'}
            </p>
            <p className="text-[11px] text-foreground-muted truncate">
              {user?.email || 'candidate@gowow.demo'}
            </p>
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
              <Shield className="w-3 h-3" aria-hidden="true" />
              <span>Independent Candidate Account</span>
            </div>
          </div>

          {/* Menu Items */}
          <button
            type="button"
            role="menuitem"
            onClick={handleOpenAccessibility}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-elevated hover:text-primary rounded-lg transition-colors text-left min-h-[40px]"
          >
            <Sliders className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="font-semibold">Accessibility Settings</span>
              <span className="text-[10px] text-foreground-muted">Shortcut: Alt+A</span>
            </div>
          </button>

          <Link
            to="/candidate/settings"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-elevated hover:text-primary rounded-lg transition-colors min-h-[40px]"
          >
            <Settings className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="font-semibold">Account Settings</span>
              <span className="text-[10px] text-foreground-muted">Preferences & profile details</span>
            </div>
          </Link>

          <Link
            to="/about"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-elevated hover:text-primary rounded-lg transition-colors min-h-[40px]"
          >
            <HelpCircle className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="font-semibold">Help & Guides</span>
              <span className="text-[10px] text-foreground-muted">Screen reader & exam instructions</span>
            </div>
          </Link>

          <div className="border-t border-border my-1" role="separator" />

          {/* Logout Action */}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-status-error hover:bg-status-error/10 rounded-lg transition-colors text-left min-h-[40px]"
          >
            <LogOut className="w-4 h-4 text-status-error shrink-0" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
