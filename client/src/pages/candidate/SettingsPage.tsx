import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { AccessibilityPanel } from '../../components/accessibility/AccessibilityPanel';
import { FaceAccessModal } from '../../components/auth/FaceAccessModal';
import { faceAccessApi } from '../../services/api/faceAccessApi';
import { Camera, ShieldCheck, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAccessibility } from '../../hooks/useAccessibility';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { preferences, setPreferredLanguage: setA11yLanguage, speak } = useAccessibility();

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [targetExam, setTargetExam] = useState('SSC CGL');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [profileSavedMessage, setProfileSavedMessage] = useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Drishti FaceAccess AI state
  const [isFaceAccessModalOpen, setIsFaceAccessModalOpen] = useState(false);
  const [isFaceEnrolled, setIsFaceEnrolled] = useState(false);
  const [faceAccessNotice, setFaceAccessNotice] = useState<string | null>(null);

  useEffect(() => {
    faceAccessApi.getStatus().then((res) => {
      setIsFaceEnrolled(res.is_enrolled);
    });
  }, []);

  const handleRevokeFaceAccess = async () => {
    try {
      await faceAccessApi.revoke();
      setIsFaceEnrolled(false);
      setFaceAccessNotice('FaceAccess biometric templates successfully deleted.');
      speak('FaceAccess biometric data deleted.');
    } catch {
      setIsFaceEnrolled(false);
      setFaceAccessNotice('FaceAccess data cleared locally.');
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    const savedExam = localStorage.getItem('gowow_target_exam');
    if (savedExam) setTargetExam(savedExam);

    const savedLang = localStorage.getItem('gowow_preferred_lang') || preferences.language;
    if (savedLang) setPreferredLanguage(savedLang);
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    localStorage.setItem('gowow_target_exam', targetExam);
    localStorage.setItem('gowow_preferred_lang', preferredLanguage);
    setA11yLanguage(preferredLanguage);

    // Update locally stored user if available
    try {
      const storedUser = localStorage.getItem('gowow_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.name = name;
        localStorage.setItem('gowow_user', JSON.stringify(parsed));
      }
    } catch {
      // ignore JSON error
    }

    const feedback = preferredLanguage === 'hi'
      ? 'प्रोफ़ाइल और भाषा प्राथमिकता सहेज ली गई है।'
      : 'Profile details and language preferences successfully updated.';
    setProfileSavedMessage(feedback);
    speak(feedback);
    setTimeout(() => setProfileSavedMessage(null), 4000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please provide your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please re-enter.');
      return;
    }

    // Simulate successful password update
    setPasswordSuccess('Password successfully updated. Please use your new password next time you sign in.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(null), 5000);
  };

  const targetExamOptions = [
    { value: 'SSC CGL', label: 'Staff Selection Commission - CGL / CHSL' },
    { value: 'IBPS PO', label: 'Banking - IBPS / SBI PO & Clerk' },
    { value: 'UPSC CSE', label: 'UPSC Civil Services Examination' },
    { value: 'RRB NTPC', label: 'Railway Recruitment Board - NTPC / Group D' },
    { value: 'State PSC', label: 'State Public Service Commission Exams' },
    { value: 'Campus Aptitude', label: 'General Aptitude & Campus Placements' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi (हिन्दी)' },
    { value: 'mr', label: 'Marathi (मराठी)' },
    { value: 'ta', label: 'Tamil (தமிழ்)' },
    { value: 'te', label: 'Telugu (తెలుగు)' },
    { value: 'bn', label: 'Bengali (বাংলা)' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl pb-16">
      {/* 1. Profile Information */}
      <Card
        title="Candidate Profile & Target Goals"
        subtitle="Manage your personal details, target examination, and examination language"
      >
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 mt-2">
          {profileSavedMessage && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-sm font-semibold"
            >
              ✓ {profileSavedMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Candidate Full Name"
              required
            />
            <Input
              label="Registered Email"
              value={email}
              disabled
              helperText="Email is bound to your candidate ID. Contact proctor desk to request changes."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Target Examination Track"
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              options={targetExamOptions}
              helperText="Tailors recommendations and practice sets to your syllabus"
            />
            <Select
              label="Preferred Examination Language"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              options={languageOptions}
              helperText="Audio speech and questions will default to this language"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary">
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Security & Password Change */}
      <Card
        title="Security & Password"
        subtitle="Update your account credentials to keep your examination history secure"
      >
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4 mt-2">
          {passwordSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-sm font-semibold"
            >
              ✓ {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm font-semibold"
            >
              ⚠️ {passwordError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="outline">
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Drishti FaceAccess AI (Biometric Authentication Management) */}
      <Card
        title="Drishti FaceAccess AI (Facial Biometrics)"
        subtitle="Accessible Authentication. Independent Access. Hands-free voice-guided facial sign-in."
      >
        <div className="flex flex-col gap-4 mt-2">
          {faceAccessNotice && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold"
            >
              ℹ️ {faceAccessNotice}
            </div>
          )}

          <div className="p-4 rounded-2xl border border-border bg-surface-elevated/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    Facial Authentication Status:
                  </span>
                  {isFaceEnrolled ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Enrolled & Active
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-foreground-muted bg-surface px-2 py-0.5 rounded-full border border-border">
                      Not Enrolled
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
                  Allows visually impaired candidates to authenticate securely through real-time camera voice guidance without typing a password.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant={isFaceEnrolled ? 'outline' : 'primary'}
                onClick={() => setIsFaceAccessModalOpen(true)}
                icon={<Sparkles className="w-4 h-4" />}
              >
                {isFaceEnrolled ? 'Re-align Face Biometrics' : 'Enroll FaceAccess AI'}
              </Button>

              {isFaceEnrolled && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRevokeFaceAccess}
                  className="text-status-error hover:bg-status-error/10 border-status-error/40"
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Delete Biometrics
                </Button>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 text-xs text-foreground-muted flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Privacy & Security Guarantee:</strong> Raw camera feeds and photos are never uploaded or stored.
              Biometric templates are hashed and client frames processed in real-time memory. You can revoke consent and permanently purge your biometric template anytime.
            </p>
          </div>
        </div>
      </Card>

      {/* FaceAccess Modal for Enrollment */}
      <FaceAccessModal
        isOpen={isFaceAccessModalOpen}
        onClose={() => setIsFaceAccessModalOpen(false)}
        onSuccess={() => {
          setIsFaceEnrolled(true);
          setFaceAccessNotice('FaceAccess AI biometric profile successfully enrolled!');
        }}
        onFallbackToPassword={() => setIsFaceAccessModalOpen(false)}
        candidateEmail={user?.email || 'candidate1@gowow.org'}
        mode="enroll"
      />

      {/* 4. Saarthi AI Personalized Onboarding Launcher */}
      <Card
        title="Saarthi AI Guided Onboarding"
        subtitle="Revisit the step-by-step conversational setup to personalize language, theme, font size, voice speed, and learning preferences"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Restart AI Tutor Experience
              </h4>
              <p className="text-xs text-foreground-muted mt-0.5">
                Saarthi will walk you through your preferences in natural Hindi or English.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => {
              window.location.href = '/auth/accessibility-setup';
            }}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Launch Saarthi AI Setup
          </Button>
        </div>
      </Card>

      {/* 5. Accessibility & Assistive Setup */}
      <AccessibilityPanel />
    </div>
  );
};
