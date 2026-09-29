import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAccessibility } from '../../hooks/useAccessibility';
import { BrandLogo } from '../common/BrandLogo';
import {
  LayoutDashboard,
  BookOpen,
  PlayCircle,
  Award,
  Calendar,
  BarChart3,
  TrendingUp,
  Sliders,
  Settings,
  HelpCircle,
  LogOut,
  PlusCircle,
  FileQuestion,
  Users,
  CheckSquare,
  Shield,
  History,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role, user, logout } = useAuth();
  const { openCalibration } = useAccessibility();

  const candidatePrimaryLinks = [
    { to: '/candidate/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> },
    { to: '/candidate/learn', label: 'Learn', icon: <BookOpen className="w-4 h-4" aria-hidden="true" /> },
    { to: '/candidate/practice', label: 'Practice', icon: <PlayCircle className="w-4 h-4" aria-hidden="true" /> },
    { to: '/candidate/mock-tests', label: 'Mock Tests', icon: <Award className="w-4 h-4" aria-hidden="true" /> },
    { to: '/candidate/exams', label: 'Exams', icon: <Calendar className="w-4 h-4" aria-hidden="true" /> },
    { to: '/candidate/results', label: 'Results', icon: <BarChart3 className="w-4 h-4" aria-hidden="true" /> },
    { to: '/candidate/progress', label: 'Progress', icon: <TrendingUp className="w-4 h-4" aria-hidden="true" /> },
  ];

  const candidateSecondaryLinks = [
    { to: '/candidate/settings', label: 'Settings', icon: <Settings className="w-4 h-4" aria-hidden="true" /> },
    { to: '/candidate/help', label: 'Help & Guides', icon: <HelpCircle className="w-4 h-4" aria-hidden="true" /> },
  ];

  const examinerLinks = [
    { to: '/examiner/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> },
    { to: '/examiner/exams', label: 'Examinations', icon: <Calendar className="w-4 h-4" aria-hidden="true" /> },
    { to: '/examiner/exams/create', label: 'Create Exam', icon: <PlusCircle className="w-4 h-4" aria-hidden="true" /> },
    { to: '/examiner/question-bank', label: 'Question Bank', icon: <FileQuestion className="w-4 h-4" aria-hidden="true" /> },
    { to: '/examiner/candidates', label: 'Candidates', icon: <Users className="w-4 h-4" aria-hidden="true" /> },
    { to: '/examiner/results', label: 'Results & Eval', icon: <BarChart3 className="w-4 h-4" aria-hidden="true" /> },
    { to: '/examiner/analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" aria-hidden="true" /> },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> },
    { to: '/admin/users', label: 'User Directory', icon: <Users className="w-4 h-4" aria-hidden="true" /> },
    { to: '/admin/examiners', label: 'Examiners', icon: <Shield className="w-4 h-4" aria-hidden="true" /> },
    { to: '/admin/candidates', label: 'Candidates', icon: <Users className="w-4 h-4" aria-hidden="true" /> },
    { to: '/admin/exams', label: 'Global Exams', icon: <Calendar className="w-4 h-4" aria-hidden="true" /> },
    { to: '/admin/organizations', label: 'Organizations', icon: <CheckSquare className="w-4 h-4" aria-hidden="true" /> },
    { to: '/admin/audit-logs', label: 'Audit Trail', icon: <History className="w-4 h-4" aria-hidden="true" /> },
    { to: '/admin/settings', label: 'System Settings', icon: <Settings className="w-4 h-4" aria-hidden="true" /> },
  ];


  const isCandidate = role === 'candidate';

  const roleDisplayName =
    role === 'examiner'
      ? 'Examiner Studio'
      : role === 'admin'
      ? 'Admin Console'
      : 'Candidate Workspace';

  return (
    <aside
      className="w-64 bg-surface border-r border-border p-4 flex flex-col justify-between shrink-0 hidden md:flex"
      aria-label={`${roleDisplayName} Navigation`}
    >
      <div className="flex flex-col gap-4">
        {/* Brand Header */}
        <div className="px-2 pb-1">
          <BrandLogo variant="full" size="sm" />
        </div>

        {/* Navigation Section Title */}
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary px-2">
          {roleDisplayName}
        </div>

        {/* Primary Links */}
        <nav className="flex flex-col gap-1" aria-label="Primary sections">
          {(isCandidate ? candidatePrimaryLinks : role === 'examiner' ? examinerLinks : adminLinks).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[42px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-primary text-primary-contrast font-bold shadow-sm'
                    : 'text-foreground hover:bg-surface-elevated hover:text-primary'
                }`
              }
            >
              <span className="shrink-0">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Preferences & Quick Tools for All Roles */}
        <div className="flex flex-col gap-2 pt-3 border-t border-border">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground-muted px-2">
            Tools &amp; Preferences
          </span>

          {/* Accessibility Quick Calibration Button */}
          <button
            type="button"
            onClick={openCalibration}
            aria-label="Open Accessibility Calibration Center (Alt+A)"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-foreground hover:bg-surface-elevated hover:text-primary transition-colors text-left min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>Accessibility</span>
            </div>
            <span className="keyboard-indicator text-[10px]">Alt+A</span>
          </button>

          {isCandidate &&
            candidateSecondaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? 'bg-primary text-primary-contrast font-bold'
                      : 'text-foreground hover:bg-surface-elevated hover:text-primary'
                  }`
                }
              >
                <span className="shrink-0">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
        </div>
      </div>


      {/* Bottom Profile and Sign Out */}
      <div className="pt-4 border-t border-border flex flex-col gap-2">
        <div className="p-2.5 rounded-lg bg-surface-elevated/60 border border-border flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-bold text-foreground truncate">
              {user?.name || 'User'}
            </span>
            <span className="text-[10px] text-foreground-muted truncate">
              {user?.email}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          aria-label="Sign out from your account"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-status-error hover:bg-status-error/10 transition-colors w-full text-left min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-status-error"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
