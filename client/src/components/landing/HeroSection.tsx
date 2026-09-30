import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Volume2,
} from 'lucide-react';
import { Button } from '../common/Button';
import heroBannerImage from '../../assets/images/hero-banner.jpg';

export interface HeroSectionProps {
  onOpenAccessibility: () => void;
  onOpenAudioOnboarding?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAccessibility, onOpenAudioOnboarding }) => {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden pt-12 pb-16 md:py-20 lg:py-24 min-h-[580px] lg:min-h-[640px] flex items-center bg-white"
    >
      {/* 1. Hero Banner Background Image Layer (z-0) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={heroBannerImage}
          alt="Visually impaired student preparing for competitive exams using Drishti accessible examination platform"
          className="w-full h-full object-cover object-right md:object-[80%_center] lg:object-right select-none"
        />
      </div>

      {/* 2. White Blend Overlay Layer (z-10): Pure white behind the main text on the left, blending smoothly into transparent right where the text line ends */}
      <div
        className="absolute inset-0 z-10 pointer-events-none hidden md:block"
        style={{
          background:
            'linear-gradient(to right, #ffffff 0%, #ffffff 36%, rgba(255, 255, 255, 0.98) 44%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 64%)',
        }}
        aria-hidden="true"
      />
      {/* Mobile/Tablet Fallback Blend (z-10) */}
      <div
        className="absolute inset-0 z-10 pointer-events-none md:hidden"
        style={{
          background:
            'linear-gradient(to bottom, #ffffff 0%, #ffffff 72%, rgba(255, 255, 255, 0.92) 86%, rgba(255, 255, 255, 0.6) 100%)',
        }}
        aria-hidden="true"
      />

      {/* 3. Text and Interactive Elements Layer (z-20) */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl text-left flex flex-col items-start">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-white/95 text-xs font-semibold text-blue-800 mb-5 shadow-xs backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span>Accessibility-First Examination Platform • WCAG 2.1 AA</span>
          </div>

          {/* Main Headline */}
          <h1
            id="hero-title"
            className="text-display tracking-tight text-slate-900 font-extrabold mb-5 max-w-xl text-left"
          >
            Exams Without Barriers.{' '}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600">
              Engineered for Independence.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-body-lg text-slate-700 max-w-xl mb-8 leading-relaxed text-left font-normal">
            Learn, practice, and take official competitive examinations with total autonomy. Built from first principles for blind, low-vision, and keyboard-reliant candidates, with complete authoring and proctoring tools for institutions.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-start gap-3 w-full sm:w-auto mb-8">
            <Link to="/auth/signup?role=candidate" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                iconRight={<ArrowRight className="w-5 h-5" />}
                className="shadow-md font-bold px-7 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Practicing Free
              </Button>
            </Link>

            <Link to="/auth/login?role=examiner" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                icon={<Building2 className="w-4 h-4 text-slate-700" />}
                className="px-5 bg-white/90 hover:bg-white border-slate-300 text-slate-800 shadow-xs"
              >
                Examiner Studio
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              onClick={onOpenAccessibility}
              icon={<Sliders className="w-4 h-4 text-slate-700" />}
              className="w-full sm:w-auto px-5 bg-white/90 hover:bg-white border-slate-300 text-slate-800 shadow-xs"
              aria-label="Open Accessibility Calibration Center (Shortcut: Alt+A)"
            >
              <span>Accessibility</span>
              <span className="keyboard-indicator ml-2 text-[10px] text-slate-600">Alt+A</span>
            </Button>

            {onOpenAudioOnboarding && (
              <Button
                variant="outline"
                size="lg"
                onClick={onOpenAudioOnboarding}
                icon={<Volume2 className="w-4 h-4 text-blue-600 animate-pulse" />}
                className="w-full sm:w-auto px-5 border-blue-300 bg-blue-50/90 text-blue-700 hover:bg-blue-100 shadow-xs"
                aria-label="Start hands-free audio onboarding (Shortcut: Enter)"
              >
                <span>Audio Setup</span>
                <span className="keyboard-indicator ml-2 text-[10px] text-blue-700 font-semibold">Enter</span>
              </Button>
            )}
          </div>

          {/* Key Guarantees */}
          <div className="flex flex-wrap items-center justify-start gap-5 sm:gap-7 pt-6 border-t border-slate-300/80 text-xs text-slate-700 font-medium w-full max-w-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>100% Keyboard Operable</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Screen-Reader Linearized</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Calm Acoustic Countdown</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
