import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { AccessibilityPanel } from '../../components/accessibility/AccessibilityPanel';
import { useAuth } from '../../hooks/useAuth';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

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

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    const savedExam = localStorage.getItem('gowow_target_exam');
    if (savedExam) setTargetExam(savedExam);

    const savedLang = localStorage.getItem('gowow_preferred_lang');
    if (savedLang) setPreferredLanguage(savedLang);
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    localStorage.setItem('gowow_target_exam', targetExam);
    localStorage.setItem('gowow_preferred_lang', preferredLanguage);

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

    setProfileSavedMessage('Profile details successfully updated.');
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

      {/* 3. Accessibility & Assistive Setup */}
      <AccessibilityPanel />
    </div>
  );
};
