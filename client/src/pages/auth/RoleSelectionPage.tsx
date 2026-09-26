import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../../types/user';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/common/Button';
import { GraduationCap, Building2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

export const RoleSelectionPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('candidate');
  const navigate = useNavigate();

  const handleProceed = () => {
    navigate(`/auth/signup?role=${selectedRole}`);
  };

  const roles = [
    {
      id: 'candidate' as UserRole,
      title: 'Candidate',
      tagline: 'Student, examinee, or competitive test-taker',
      description: 'Prepare, practice, and take accessible examinations.',
      icon: <GraduationCap className="w-6 h-6 text-primary" aria-hidden="true" />,
      features: [
        'Accessible practice drills & timed mock tests',
        'Screen-reader & keyboard-first exam interface',
        'Personalized weak-topic analysis & telemetry',
      ],
    },
    {
      id: 'examiner' as UserRole,
      title: 'Examiner / Institution',
      tagline: 'Educator, university, or examination board',
      description: 'Create and manage accessible examinations.',
      icon: <Building2 className="w-6 h-6 text-primary" aria-hidden="true" />,
      features: [
        'Accessible question authoring & formula notation',
        'Accommodation management & extra time settings',
        'Automated scoring & psychometric question analytics',
      ],
    },
  ];

  return (
    <AuthLayout
      title="Choose Your Role"
      subtitle="Select how you plan to use GoWow. We will tailor your registration and accessibility settings accordingly."
      badge="Step 1 of Registration"
    >
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            Select Account Type
          </h2>
          <p className="text-xs text-foreground-muted">
            Choose whether you are registering to take examinations or to author and manage them.
          </p>
        </div>

        {/* Accessible Radio Cards */}
        <div
          role="radiogroup"
          aria-label="Select your GoWow account role"
          className="flex flex-col gap-4"
        >
          {roles.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <div
                key={r.id}
                role="radio"
                tabIndex={0}
                aria-checked={isSelected}
                onClick={() => setSelectedRole(r.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedRole(r.id);
                  }
                }}
                className={`
                  p-5 rounded-xl border cursor-pointer select-none transition-all duration-fast
                  focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus
                  ${
                    isSelected
                      ? 'bg-surface-elevated border-primary shadow-sm'
                      : 'bg-surface border-border hover:border-border-strong hover:bg-surface-elevated/50'
                  }
                `.trim()}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                        isSelected
                          ? 'bg-primary text-primary-contrast border-primary'
                          : 'bg-surface-elevated text-foreground border-border'
                      }`}
                      aria-hidden="true"
                    >
                      {r.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground">
                          {r.title}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-status-success bg-status-success-bg px-2 py-0.5 rounded border border-status-success">
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            <span>Selected</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-foreground-muted">
                        {r.tagline}
                      </span>
                    </div>
                  </div>

                  {/* Radio visual ring indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border border-border-strong flex items-center justify-center shrink-0 mt-1 ${
                      isSelected ? 'border-primary' : ''
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                </div>

                <p className="text-sm font-semibold text-foreground mb-3 pl-13">
                  "{r.description}"
                </p>

                <ul className="text-xs text-foreground-secondary space-y-1.5 pl-13">
                  {r.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/"
            className="text-xs font-semibold text-foreground-muted hover:text-foreground inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <Button
            variant="primary"
            size="md"
            onClick={handleProceed}
            iconRight={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Continue as {selectedRole === 'candidate' ? 'Candidate' : 'Examiner'}
          </Button>
        </div>

        <div className="text-center pt-2">
          <span className="text-xs text-foreground-muted">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </span>
        </div>
      </div>
    </AuthLayout>
  );
};
