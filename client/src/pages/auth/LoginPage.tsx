import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAuthVoiceNavigator } from '../../hooks/useAuthVoiceNavigator';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { AuthVoiceAssistant } from '../../components/auth/AuthVoiceAssistant';
import { Input } from '../../components/common/Input';
import { Checkbox } from '../../components/common/Checkbox';
import { Button } from '../../components/common/Button';
import {
  AlertCircle,
  ArrowRight,
  UserCheck,
  GraduationCap,
  Shield,
  Lock,
  VolumeX,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isSessionExpired = searchParams.get('session_expired') === 'true';

  // Role Tab: Voice command login strictly for Candidate; direct login for Examiner & Admin
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'examiner' | 'admin'>(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'examiner' || roleParam === 'admin') return roleParam;
    return 'candidate';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = useCallback((role: 'candidate' | 'examiner' | 'admin') => {
    setSelectedRole(role);
    setFormError(null);
    setErrors({});
    if (role !== 'candidate') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, []);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter a valid email address (e.g., student@example.com).';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const executeLogin = useCallback(
    async (loginEmail: string, loginPass: string) => {
      setFormError(null);
      try {
        const loggedInUser = await login(loginEmail, loginPass);

        // Route candidate, examiner, or admin to their respective dashboard
        if (loggedInUser.role === 'examiner') {
          navigate('/examiner/dashboard');
        } else if (loggedInUser.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/candidate/dashboard');
        }
      } catch (err: any) {
        setFormError(
          err?.message || "We couldn't sign you in. Check your email and password and try again."
        );
      }
    },
    [login, navigate]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    executeLogin(email, password);
  };

  // Quick Demo Autofill Helper (switches role tab and fills seeded demo credentials)
  const fillDemoAccount = useCallback(
    (role: 'candidate' | 'examiner' | 'admin', demoEmail: string, demoPass: string) => {
      handleRoleChange(role);
      setEmail(demoEmail);
      setPassword(demoPass);
      setErrors({});
      setFormError(null);
    },
    [handleRoleChange]
  );

  // Hands-free Voice Navigator - ONLY active when selectedRole === 'candidate'
  const voiceState = useAuthVoiceNavigator({
    page: 'login',
    enabled: selectedRole === 'candidate',
    onFillEmail: (val) => {
      setEmail(val);
      setErrors((prev) => ({ ...prev, email: undefined }));
    },
    onFillPassword: (val) => {
      setPassword(val);
      setErrors((prev) => ({ ...prev, password: undefined }));
    },
    onSubmitForm: () => {
      if (validate()) {
        executeLogin(email, password);
      }
    },
    onQuickCandidateLogin: () => {
      fillDemoAccount('candidate', 'candidate1@gowow.org', 'CandidateSecure123!');
      executeLogin('candidate1@gowow.org', 'CandidateSecure123!');
    },
    onQuickExaminerLogin: () => {
      fillDemoAccount('examiner', 'examiner@gowow.org', 'ExaminerSecure123!');
      executeLogin('examiner@gowow.org', 'ExaminerSecure123!');
    },
    onQuickAdminLogin: () => {
      fillDemoAccount('admin', 'admin@gowow.org', 'AdminSecurePass123!');
      executeLogin('admin@gowow.org', 'AdminSecurePass123!');
    },
    onNavigateSignup: () => {
      navigate('/auth/role-selection');
    },
    onNavigateForgotPassword: () => {
      navigate('/auth/forgot-password');
    },
    currentEmail: email,
    isPasswordSet: Boolean(password),
  });

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your accessible learning and examination workspace."
      badge={
        selectedRole === 'candidate'
          ? 'Candidate Portal (Voice Guided)'
          : selectedRole === 'examiner'
          ? 'Examiner Studio (Direct Login)'
          : 'Admin Console (Direct Login)'
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Sign In</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Select your portal role to sign in to your workspace.
          </p>
        </div>

        {/* Architectural Role Tabs: Separates Candidate (Voice) from Examiner/Admin (Standard) */}
        <div
          role="tablist"
          aria-label="Select Sign In Portal"
          className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-elevated border border-border"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedRole === 'candidate'}
            onClick={() => handleRoleChange('candidate')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedRole === 'candidate'
                ? 'bg-primary text-primary-contrast shadow-xs'
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Candidate</span>
            </div>
            <span className="text-[10px] opacity-80 font-normal">Voice Guided</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedRole === 'examiner'}
            onClick={() => handleRoleChange('examiner')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedRole === 'examiner'
                ? 'bg-primary text-primary-contrast shadow-xs'
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Examiner</span>
            </div>
            <span className="text-[10px] opacity-80 font-normal">Direct Form</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedRole === 'admin'}
            onClick={() => handleRoleChange('admin')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-primary text-primary-contrast shadow-xs'
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Admin</span>
            </div>
            <span className="text-[10px] opacity-80 font-normal">Direct Form</span>
          </button>
        </div>

        {/* Accessible Voice Assistant Navigator Bar - ONLY for Candidate */}
        {selectedRole === 'candidate' ? (
          <AuthVoiceAssistant voiceState={voiceState} pageType="login" />
        ) : (
          <div className="p-3 rounded-lg border border-border bg-surface-elevated/40 flex items-center justify-between text-xs text-foreground-muted">
            <span className="flex items-center gap-2">
              <VolumeX className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
              <span>
                Standard login: Voice assistant is disabled for{' '}
                <strong className="text-foreground">
                  {selectedRole === 'examiner' ? 'Examiners' : 'Administrators'}
                </strong>
                .
              </span>
            </span>
            <span className="text-[10px] font-mono uppercase bg-surface px-1.5 py-0.5 rounded border border-border">
              Direct
            </span>
          </div>
        )}

        {/* Global Live Region Form Error Alert */}
        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3.5 rounded-lg border border-status-error bg-status-error-bg text-xs font-semibold text-status-error flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {/* Session Expired Notice */}
        {isSessionExpired && !formError && (
          <div
            role="status"
            aria-live="polite"
            className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>Your session has expired. Please sign in with your credentials to continue.</span>
          </div>
        )}

        {/* Email Address Field */}
        <Input
          id="login-email"
          type="email"
          label="Email address"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          placeholder="name@example.com"
        />

        {/* Password Field with Show/Hide Toggle */}
        <div className="flex flex-col gap-1.5">
          <Input
            id="login-password"
            type="password"
            label="Password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            placeholder="Enter your password"
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <Checkbox
              id="login-remember-me"
              label="Remember me on this device"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />

            <Link
              to="/auth/forgot-password"
              className="text-primary hover:underline font-semibold"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          loadingText="Signing in..."
          iconRight={<ArrowRight className="w-4 h-4" />}
          className="mt-2"
        >
          Sign In
        </Button>

        {/* Quick Demo Access Bar */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2 bg-surface-elevated/40 p-3.5 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>1-Click Demo Accounts</span>
            </span>
            <span className="text-[10px] font-mono text-primary font-bold">Quick Access</span>
          </div>
          <p className="text-[11px] text-foreground-muted leading-tight">
            Autofill credentials to sign in directly:
          </p>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              type="button"
              onClick={() => fillDemoAccount('candidate', 'candidate1@gowow.org', 'CandidateSecure123!')}
              className={`px-2 py-1.5 rounded border text-xs font-semibold text-center cursor-pointer transition-colors ${
                selectedRole === 'candidate'
                  ? 'border-primary bg-primary/10 text-primary font-bold'
                  : 'border-border bg-surface hover:bg-surface-elevated text-foreground'
              }`}
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('examiner', 'examiner@gowow.org', 'ExaminerSecure123!')}
              className={`px-2 py-1.5 rounded border text-xs font-semibold text-center cursor-pointer transition-colors ${
                selectedRole === 'examiner'
                  ? 'border-primary bg-primary/10 text-primary font-bold'
                  : 'border-border bg-surface hover:bg-surface-elevated text-foreground'
              }`}
            >
              Examiner
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin', 'admin@gowow.org', 'AdminSecurePass123!')}
              className={`px-2 py-1.5 rounded border text-xs font-semibold text-center cursor-pointer transition-colors ${
                selectedRole === 'admin'
                  ? 'border-primary bg-primary/10 text-primary font-bold'
                  : 'border-border bg-surface hover:bg-surface-elevated text-foreground'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Link to Registration */}
        <div className="text-center pt-2">
          <span className="text-xs text-foreground-muted">
            Don't have an account yet?{' '}
            <Link to="/auth/role-selection" className="text-primary font-bold hover:underline">
              Create an Account
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};
