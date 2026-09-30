import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/common/Input';
import { Checkbox } from '../../components/common/Checkbox';
import { Button } from '../../components/common/Button';
import { AlertCircle, ArrowRight, UserCheck, Mic } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isSessionExpired = searchParams.get('session_expired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    try {
      const loggedInUser = await login(email, password);

      // Route candidate or examiner to their respective dashboard
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
  };

  // Quick Demo Autofill Helper for Development (calling real seeded demo accounts)
  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrors({});
    setFormError(null);
  };

  const handleVoiceCandidateLogin = async () => {
    fillDemoAccount('candidate1@gowow.org', 'CandidateSecure123!');
    try {
      const loggedInUser = await login('candidate1@gowow.org', 'CandidateSecure123!');
      if (loggedInUser.role === 'candidate') {
        navigate('/candidate/dashboard');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Voice login failed. Please try again.');
    }
  };

  const startVoiceLogin = async () => {
    if (typeof window === 'undefined') return;
    const SpeechClass =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) {
      setVoiceNotice('Speech recognition requires Chrome or Edge.');
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
      const recognition = new SpeechClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsVoiceListening(true);
        setVoiceNotice('Listening... Say "Candidate" to sign in');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        const lower = transcript.toLowerCase();
        setVoiceNotice(`Heard: "${transcript}"`);
        if (
          lower.includes('candidate') ||
          lower.includes('sign in') ||
          lower.includes('login') ||
          lower.includes('chalo')
        ) {
          recognition.abort();
          setIsVoiceListening(false);
          handleVoiceCandidateLogin();
        }
      };

      recognition.onerror = () => {
        setIsVoiceListening(false);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognition.start();
    } catch {
      setIsVoiceListening(false);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (isVoiceListening) {
          setIsVoiceListening(false);
        } else {
          startVoiceLogin();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVoiceListening]);

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your accessible learning and examination workspace."
      badge="Candidate & Examiner Portal"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Sign In</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Enter your registered credentials to access your assessment session.
          </p>
        </div>

        {/* Hands-Free Voice Sign-In Banner */}
        <div className="p-3 rounded-xl border border-primary/40 bg-primary/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isVoiceListening
                  ? 'bg-status-success/20 text-status-success'
                  : 'bg-primary/20 text-primary'
              }`}
            >
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {voiceNotice || 'Hands-Free Voice Sign In'}
              </p>
              <p className="text-[10px] text-foreground-secondary truncate">
                {isVoiceListening
                  ? 'Say "Candidate" or "Sign In" now'
                  : 'Click button or press Alt+V to speak'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={isVoiceListening ? () => setIsVoiceListening(false) : startVoiceLogin}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-contrast text-xs font-bold shrink-0 hover:bg-primary-hover min-h-[34px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isVoiceListening ? 'Stop' : 'Voice Sign In'}
          </button>
        </div>

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
                onClick={() => fillDemoAccount('candidate1@gowow.org', 'CandidateSecure123!')}
                className="px-2 py-1.5 rounded border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground text-center"
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('examiner@gowow.org', 'ExaminerSecure123!')}
                className="px-2 py-1.5 rounded border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground text-center"
              >
                Examiner
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@gowow.org', 'AdminSecurePass123!')}
                className="px-2 py-1.5 rounded border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground text-center"
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
