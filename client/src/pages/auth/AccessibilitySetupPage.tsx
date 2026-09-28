import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AccessibilityWizard } from '../../components/accessibility/AccessibilityWizard';

export const AccessibilitySetupPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const handleFinish = () => {
    if (role === 'examiner') {
      navigate('/examiner/dashboard');
    } else {
      navigate('/candidate/dashboard');
    }
  };

  return (
    <main
      id="accessibility-setup-page"
      className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-start"
    >
      {/* WCAG Skip Navigation Link */}
      <a href="#accessibility-wizard-main" className="skip-link">
        Skip to accessibility configuration options
      </a>

      {/* Main Accessible Container */}
      <div id="accessibility-wizard-main" tabIndex={-1} className="w-full focus:outline-none">
        <AccessibilityWizard onComplete={handleFinish} />
      </div>
    </main>
  );
};
