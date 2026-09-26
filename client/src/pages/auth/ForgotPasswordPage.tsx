import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ArrowLeft, MailCheck, Send } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    // Simulate brief network delay
    await new Promise((resolve) => setTimeout(resolve, 350));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="Password reset instructions have been simulated."
        badge="Password Recovery"
      >
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center text-center py-6 gap-6"
        >
          <div
            className="w-16 h-16 rounded-full bg-status-info-bg border-2 border-status-info flex items-center justify-center text-status-info"
            aria-hidden="true"
          >
            <MailCheck className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Instructions Dispatched
            </h2>
            <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
              If an account exists for <span className="font-mono font-bold text-foreground">{email}</span>, password reset instructions have been sent.
            </p>
            <div className="p-3.5 rounded-lg border border-border bg-surface-elevated text-xs text-foreground-muted text-left">
              <span className="font-bold text-foreground block mb-0.5">
                Frontend Prototype Notice:
              </span>
              <span>
                No actual email was dispatched. In production, password recovery tokens will be verified through the FastAPI secure authentication service.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link to="/auth/login" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                fullWidth
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Sign In
              </Button>
            </Link>

            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              className="w-full sm:w-auto"
            >
              Try Another Email
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive password reset instructions."
      badge="Account Recovery"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Forgot Password</h2>
          <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
            Enter the email associated with your GoWow account. We will simulate sending a secure reset link.
          </p>
        </div>

        <Input
          id="forgot-password-email"
          type="email"
          label="Registered email address"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          error={error || undefined}
          placeholder="name@example.com"
          helperText="We will never reveal whether an email address is registered."
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          loadingText="Sending instructions..."
          iconRight={<Send className="w-4 h-4" />}
          className="mt-2"
        >
          Send Reset Instructions
        </Button>

        <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
          <Link
            to="/auth/login"
            className="text-foreground-muted hover:text-foreground inline-flex items-center gap-1.5 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>

          <Link
            to="/auth/role-selection"
            className="text-primary font-bold hover:underline"
          >
            Create an Account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
