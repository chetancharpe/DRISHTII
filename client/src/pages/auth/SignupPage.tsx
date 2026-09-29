import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Checkbox } from '../../components/common/Checkbox';
import { Button } from '../../components/common/Button';
import { CheckCircle2, ArrowRight, Check, X, AlertCircle } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole: UserRole =
    (searchParams.get('role') as UserRole) === 'examiner' ? 'examiner' : 'candidate';

  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

  // Password requirements calculation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const requirementsMetCount = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber].filter(Boolean).length;

  let strengthLabel = 'Weak';
  let strengthColor = 'bg-status-error';
  let strengthPercent = 25;

  if (requirementsMetCount === 4) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-status-success';
    strengthPercent = 100;
  } else if (requirementsMetCount >= 2) {
    strengthLabel = 'Moderate';
    strengthColor = 'bg-status-warning';
    strengthPercent = 60;
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (role === 'examiner' && !organization.trim()) {
      newErrors.organization = 'Institution or organization name is required.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (requirementsMetCount < 3) {
      newErrors.password = 'Password must satisfy at least 3 security requirements below.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    try {
      await signup({
        name,
        email,
        password,
        role,
        organization: role === 'examiner' ? organization : undefined,
        preferredLanguage,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setFormError(
        err?.message || 'Unable to complete registration. Please verify your details and try again.'
      );
    }
  };

  const handleProceedToAccessibility = () => {
    navigate('/auth/accessibility-setup');
  };

  // 17. SIGNUP SUCCESS STATE
  if (isSuccess) {
    return (
      <AuthLayout
        title="Account Created"
        subtitle="Your DRISHTI account has been created successfully."
        badge="Registration Complete"
      >
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center text-center py-6 gap-6"
        >
          <div
            className="w-16 h-16 rounded-full bg-status-success-bg border-2 border-status-success flex items-center justify-center text-status-success"
            aria-hidden="true"
          >
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="max-w-md">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome, {name}!
            </h2>
            <p className="text-sm text-foreground-secondary leading-relaxed">
              Your account is ready. Before entering your dashboard, let's configure your sensory and navigation settings so the platform is tuned to your needs.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-surface-elevated/70 text-xs text-foreground-muted max-w-md text-left">
            <span className="font-bold text-foreground block mb-1">
              Next Step: Accessibility Calibration
            </span>
            <span>
              You will configure text scaling, visual contrast, theme preferences, and auditory feedback. You can adjust these settings at any time.
            </span>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleProceedToAccessibility}
            iconRight={<ArrowRight className="w-5 h-5" />}
            className="w-full sm:w-auto mt-2"
          >
            Proceed to Accessibility Setup
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle={
        role === 'candidate'
          ? 'Join DRISHTI to take mock tests, learn, and excel in competitive examinations.'
          : 'Register as an examiner to author and manage accessible examination assessments.'
      }
      badge="Step 2 of Registration"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {role === 'candidate' ? 'Candidate Registration' : 'Examiner Registration'}
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Only required fields for authentication are requested.
            </p>
          </div>

          {/* Role switcher toggle */}
          <div className="flex items-center gap-1 p-1 bg-surface-elevated border border-border rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              aria-pressed={role === 'candidate'}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                role === 'candidate'
                  ? 'bg-primary text-primary-contrast'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole('examiner')}
              aria-pressed={role === 'examiner'}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                role === 'examiner'
                  ? 'bg-primary text-primary-contrast'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Examiner
            </button>
          </div>
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

        {/* Full Name */}
        <Input
          id="signup-name"
          type="text"
          label="Full name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
          }}
          error={errors.name}
          placeholder={role === 'candidate' ? 'e.g. Priya Sharma' : 'e.g. Dr. Rajesh Verma'}
        />

        {/* Organization (Only for Examiner) */}
        {role === 'examiner' && (
          <Input
            id="signup-org"
            type="text"
            label="Institution / Examination Board"
            required
            autoComplete="organization"
            value={organization}
            onChange={(e) => {
              setOrganization(e.target.value);
              if (errors.organization) setErrors((prev) => ({ ...prev, organization: '' }));
            }}
            error={errors.organization}
            placeholder="e.g. National Testing Board / Delhi University"
          />
        )}

        {/* Email Address */}
        <Input
          id="signup-email"
          type="email"
          label={role === 'examiner' ? 'Official institution email' : 'Email address'}
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
          }}
          error={errors.email}
          placeholder="name@example.com"
        />

        {/* Preferred Language for Candidates */}
        {role === 'candidate' && (
          <Select
            id="signup-language"
            label="Preferred speech & interface language"
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिंदी (Hindi)' },
              { value: 'mr', label: 'मराठी (Marathi - Prepared)' },
              { value: 'ta', label: 'தமிழ் (Tamil - Prepared)' },
              { value: 'te', label: 'తెలుగు (Telugu - Prepared)' },
            ]}
          />
        )}

        {/* Password */}
        <div className="flex flex-col gap-2">
          <Input
            id="signup-password"
            type="password"
            label="Password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
            }}
            error={errors.password}
            placeholder="Create a strong password"
          />

          {/* Accessible Password Strength Indicator */}
          {password && (
            <div className="p-3 rounded-md bg-surface-elevated border border-border flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Password Strength: <span className="font-bold">{strengthLabel}</span>
                </span>
                <span className="text-[10px] text-foreground-muted">
                  {requirementsMetCount} of 4 criteria met
                </span>
              </div>

              {/* Strength Meter Bar */}
              <div
                role="progressbar"
                aria-valuenow={strengthPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Password strength is ${strengthLabel}`}
                className="w-full h-1.5 rounded-full bg-surface border border-border overflow-hidden"
              >
                <div
                  className={`h-full ${strengthColor} transition-all duration-fast`}
                  style={{ width: `${strengthPercent}%` }}
                />
              </div>

              {/* Criteria List with Icons & Text (Never color alone!) */}
              <ul className="grid grid-cols-2 gap-1 text-[11px] text-foreground-muted mt-1">
                <li className={`flex items-center gap-1.5 ${hasMinLength ? 'text-status-success font-semibold' : ''}`}>
                  {hasMinLength ? <Check className="w-3 h-3 text-status-success" /> : <X className="w-3 h-3 text-foreground-muted" />}
                  <span>8+ characters</span>
                </li>
                <li className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-status-success font-semibold' : ''}`}>
                  {hasUpperCase ? <Check className="w-3 h-3 text-status-success" /> : <X className="w-3 h-3 text-foreground-muted" />}
                  <span>1 uppercase letter</span>
                </li>
                <li className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-status-success font-semibold' : ''}`}>
                  {hasLowerCase ? <Check className="w-3 h-3 text-status-success" /> : <X className="w-3 h-3 text-foreground-muted" />}
                  <span>1 lowercase letter</span>
                </li>
                <li className={`flex items-center gap-1.5 ${hasNumber ? 'text-status-success font-semibold' : ''}`}>
                  {hasNumber ? <Check className="w-3 h-3 text-status-success" /> : <X className="w-3 h-3 text-foreground-muted" />}
                  <span>1 number</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <Input
          id="signup-confirm-password"
          type="password"
          label="Confirm password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
          }}
          error={errors.confirmPassword}
          placeholder="Re-enter your password"
        />

        {/* Terms and Privacy Checkbox */}
        <div className="flex flex-col gap-1">
          <Checkbox
            id="signup-terms"
            label="I agree to the Terms of Service and Privacy Policy"
            checked={agreeTerms}
            onChange={(e) => {
              setAgreeTerms(e.target.checked);
              if (errors.terms) setErrors((prev) => ({ ...prev, terms: '' }));
            }}
          />
          {errors.terms && (
            <p role="alert" className="text-xs font-semibold text-status-error pl-8">
              {errors.terms}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          loadingText="Creating account..."
          iconRight={<ArrowRight className="w-4 h-4" />}
          className="mt-2"
        >
          Create {role === 'candidate' ? 'Candidate' : 'Examiner'} Account
        </Button>

        {/* Link to Login */}
        <div className="text-center pt-2">
          <span className="text-xs text-foreground-muted">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};
