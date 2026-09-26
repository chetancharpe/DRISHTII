import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/common/Input';
import { Checkbox } from '../../components/common/Checkbox';
import { Button } from '../../components/common/Button';
import { AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

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
    } catch {
      setFormError("We couldn't sign you in. Check your email and password and try again.");
    }
  };

  // Quick Demo Autofill Helper for Prototyping
  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('DemoPass123!');
    setErrors({});
    setFormError(null);
  };

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

        {/* Development Prototype Demo Access Bar */}
        <div className="mt-4 pt-4 border-t border-dashed border-border flex flex-col gap-2 bg-surface-elevated/40 p-3.5 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>Development Prototype Demo Access</span>
            </span>
            <span className="text-[10px] font-mono text-foreground-muted">Demo Mode</span>
          </div>
          <p className="text-[11px] text-foreground-muted leading-tight">
            Click any demo role to autofill test credentials:
          </p>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              type="button"
              onClick={() => fillDemoAccount('candidate@gowow.demo')}
              className="px-2 py-1.5 rounded border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground text-center"
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('examiner@gowow.demo')}
              className="px-2 py-1.5 rounded border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground text-center"
            >
              Examiner
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@gowow.demo')}
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
