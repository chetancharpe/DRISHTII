import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import {
  HeroSection,
  TrustStrip,
  ProblemSection,
  AccessibilityFeaturesSection,
  HowItWorksSection,
  CandidateExperienceSection,
  ExaminerSection,
  IndependenceSection,
  AccessibilityCommitmentSection,
  FinalCTASection,
} from '../../components/landing';

export const LandingPage: React.FC = () => {
  const { openCalibration } = useAccessibility();

  return (
    <div className="flex flex-col w-full text-foreground">
      {/* 1. Hero Section */}
      <HeroSection onOpenAccessibility={openCalibration} />

      {/* 2. Trust / Value Strip */}
      <TrustStrip />

      {/* 3. Problem Section */}
      <ProblemSection />

      {/* 4. Accessibility Features Section */}
      <AccessibilityFeaturesSection />

      {/* 5. How It Works Section (5-Step Journey) */}
      <HowItWorksSection />

      {/* 6. Candidate Experience Section */}
      <CandidateExperienceSection />

      {/* 7. Examiner & Institution Section */}
      <ExaminerSection />

      {/* 10. Independence & Lifecycle Section */}
      <IndependenceSection />

      {/* 11. Accessibility Commitment & Philosophy */}
      <AccessibilityCommitmentSection />

      {/* 12. Final Call-to-Action */}
      <FinalCTASection onOpenAccessibility={openCalibration} />
    </div>
  );
};
