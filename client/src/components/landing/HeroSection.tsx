import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Volume2,
  Headphones,
  Mic,
  Hand,
  Cpu,
  Calendar,
  BarChart3,
  Users,
  ChevronRight,
  Target,
  Award,
  Sparkles,
  X,
  Heart,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useTranslation } from '../../i18n';
import drishtiGoldenWaveImg from '../../assets/images/drishti-golden-wave.png';

export interface HeroSectionProps {
  onOpenAccessibility: () => void;
  onOpenAudioOnboarding?: () => void;
}

// Custom 6-Dot Tactile Braille Icon
const BrailleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <circle cx="7" cy="5" r="2.2" />
    <circle cx="17" cy="5" r="2.2" />
    <circle cx="7" cy="12" r="2.2" />
    <circle cx="17" cy="12" r="2.2" />
    <circle cx="7" cy="19" r="2.2" />
    <circle cx="17" cy="19" r="2.2" />
  </svg>
);

// Custom MindCare Lotus Wellness Icon
const LotusIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 3c-1.8 3.5-3 7-3 10 0 2 .8 3.5 3 4.5 2.2-1 3-2.5 3-4.5 0-3-1.2-6.5-3-10z" />
    <path d="M12 17.5c-3-.5-6-1.5-8-4 0 4 3 6.5 8 7.5" />
    <path d="M12 17.5c3-.5 6-1.5 8-4 0 4-3 6.5-8 7.5" />
    <path d="M4 13.5c1.5-2 3.5-3.5 5.5-4.5" />
    <path d="M20 13.5c-1.5-2-3.5-3.5-5.5-4.5" />
  </svg>
);

// Golden Curved Underline Swoosh
const GoldenSwoosh: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full max-w-[280px] h-3.5 sm:h-5 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M6 15C75 3 205 3 274 15"
      stroke="url(#goldenUnderlineGradient)"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="goldenUnderlineGradient" x1="6" y1="15" x2="274" y2="15" gradientUnits="userSpaceOnUse">
        <stop stopColor="#D97706" />
        <stop offset="0.45" stopColor="#B45309" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
  </svg>
);

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenAccessibility: _onOpenAccessibility,
  onOpenAudioOnboarding: _onOpenAudioOnboarding,
}) => {
  const navigate = useNavigate();
  const { speak, announce } = useAccessibility();
  const { language } = useTranslation();
  const isHindi = language === 'hi';

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isScribeModalOpen, setIsScribeModalOpen] = useState(false);
  const [isMindCareModalOpen, setIsMindCareModalOpen] = useState(false);

  // Spoken feedback for audio learners
  const handlePillClick = (label: string, speechText: string) => {
    speak(speechText);
    announce(`${label}: ${speechText}`, 'polite');
  };

  return (
    <section
      aria-labelledby="hero-main-heading"
      className="relative isolate overflow-hidden bg-gradient-to-br from-white via-[#fcfbf9] to-[#f0f6ff] pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-16 border-b border-slate-200/80 min-h-[580px] flex items-center"
    >
      {/* Background Soft Radiance Highlights */}
      <div
        className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-sky-200/25 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-10 w-[420px] h-[420px] bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid: Left Main Text Column & Right Feature Shortcut Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* ============================================================ */}
          {/* LEFT COLUMN: Headings, Feature Pills & CTAs (Cols 1-7)       */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 flex flex-col items-start z-10">
            
            {/* Top Amber Capsule Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-300/80 bg-amber-50/90 text-amber-950 font-semibold text-xs mb-5 shadow-xs tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" aria-hidden="true" />
              <span>{isHindi ? 'सुगम • समावेशी • एआई-संचालित' : 'Accessible • Inclusive • AI-Powered'}</span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-main-heading"
              className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[62px] font-extrabold text-slate-950 tracking-tight leading-[1.08] mb-3 text-left"
            >
              {isHindi ? (
                <>
                  <span className="block text-slate-950">बाधाओं से मुक्त</span>
                  <span className="inline-block bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 bg-clip-text text-transparent">
                    परीक्षा
                  </span>
                </>
              ) : (
                <>
                  <span className="block text-slate-950">Exam Without</span>
                  <span className="inline-block bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 bg-clip-text text-transparent">
                    Barriers
                  </span>
                </>
              )}
              {/* Golden Swoosh Underline */}
              <GoldenSwoosh className="mt-1" />
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-sm sm:text-base lg:text-[17px] font-normal leading-relaxed max-w-xl mb-6 text-left">
              {isHindi
                ? 'दृष्टिबाधित उम्मीदवारों के लिए एआई-संचालित, पूर्णतः सुलभ परीक्षा और अभ्यास मंच।'
                : 'An AI-powered, fully accessible examination and practice platform for visually impaired candidates.'}
            </p>

            {/* 5 Horizontal Feature Pill Badges */}
            <div
              role="list"
              aria-label="Accessible Core Interaction Modes"
              className="grid grid-cols-5 gap-2 sm:gap-2.5 w-full max-w-xl mb-8"
            >
              {/* 1. Audio Learning */}
              <button
                type="button"
                onClick={() =>
                  handlePillClick(
                    'Audio Learning',
                    isHindi
                      ? 'ऑडियो लर्निंग: प्रत्येक प्रश्न, समीकरण और व्याख्या का स्पष्ट ऑडियो वाचन।'
                      : 'Audio Learning: Crystal clear spoken audio narration for every question, equation, and topic.'
                  )
                }
                className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-xs hover:bg-white hover:border-amber-400 hover:shadow-xs transition-all text-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-50 group-hover:bg-amber-50 text-slate-700 group-hover:text-amber-700 flex items-center justify-center mb-1 transition-colors">
                  <Headphones className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {isHindi ? 'ऑडियो शिक्षा' : 'Audio Learning'}
                </span>
              </button>

              {/* 2. Braille Support */}
              <button
                type="button"
                onClick={() =>
                  handlePillClick(
                    'Braille Support',
                    isHindi
                      ? 'ब्रेल सपोर्ट: इलेक्ट्रॉनिक रिफ्रेशेबल ब्रेल डिस्प्ले के साथ 100% अनुकूलता।'
                      : 'Braille Support: Seamless compatibility with refreshable electronic Braille displays.'
                  )
                }
                className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-xs hover:bg-white hover:border-amber-400 hover:shadow-xs transition-all text-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-slate-700 group-hover:text-amber-700 flex items-center justify-center mb-1 transition-colors">
                  <BrailleIcon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {isHindi ? 'ब्रेल सपोर्ट' : 'Braille Support'}
                </span>
              </button>

              {/* 3. Voice Control */}
              <button
                type="button"
                onClick={() =>
                  handlePillClick(
                    'Voice Control',
                    isHindi
                      ? 'वॉयस कंट्रोल: हिंदी और अंग्रेजी वॉयस कमांड से संपूर्ण परीक्षा संचालन।'
                      : 'Voice Control: Complete hands-free navigation using natural voice commands in Hindi and English.'
                  )
                }
                className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-xs hover:bg-white hover:border-amber-400 hover:shadow-xs transition-all text-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 group-hover:bg-amber-50 text-slate-700 group-hover:text-amber-700 flex items-center justify-center mb-1 transition-colors">
                  <Mic className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {isHindi ? 'वॉयस कंट्रोल' : 'Voice Control'}
                </span>
              </button>

              {/* 4. Gesture Navigation */}
              <button
                type="button"
                onClick={() =>
                  handlePillClick(
                    'Gesture Navigation',
                    isHindi
                      ? 'जेस्चर नेविगेशन: टच और कीबोर्ड जेस्चर से बिना माउस के तेज संचालन।'
                      : 'Gesture Navigation: High-speed gesture and keyboard control without mouse reliance.'
                  )
                }
                className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-xs hover:bg-white hover:border-amber-400 hover:shadow-xs transition-all text-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 group-hover:bg-amber-50 text-slate-700 group-hover:text-amber-700 flex items-center justify-center mb-1 transition-colors">
                  <Hand className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {isHindi ? 'जेस्चर' : 'Gesture Navigation'}
                </span>
              </button>

              {/* 5. AI Assistant */}
              <button
                type="button"
                onClick={() =>
                  handlePillClick(
                    'AI Assistant',
                    isHindi
                      ? 'सारथी एआई: आपका व्यक्तिगत अध्ययन मित्र, जो प्रश्नों को सरल भाषा में समझाता है।'
                      : 'Saarthi AI: Your 24/7 personal conversational learning companion.'
                  )
                }
                className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-xs hover:bg-white hover:border-amber-400 hover:shadow-xs transition-all text-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-amber-50 text-slate-700 group-hover:text-amber-700 flex items-center justify-center mb-1 transition-colors">
                  <Cpu className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {isHindi ? 'एआई सहायक' : 'AI Assistant'}
                </span>
              </button>
            </div>

            {/* Action Buttons & Micro Assist Badge */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              {/* Primary CTA: Start Learning Free */}
              <Link
                to="/auth/signup?role=candidate"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-bold text-sm shadow-md shadow-amber-700/25 hover:shadow-lg hover:shadow-amber-700/35 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>{isHindi ? 'निःशुल्क अभ्यास शुरू करें' : 'Start Learning Free'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              {/* Secondary CTA: Watch Demo */}
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-slate-300 bg-white/90 hover:bg-white text-slate-800 font-bold text-sm shadow-xs hover:border-slate-400 active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-white ml-0.5" aria-hidden="true" />
                </div>
                <span>{isHindi ? 'डेमो देखें' : 'Watch Demo'}</span>
              </button>

              {/* Drishti Smart Assist Micro-Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {isHindi ? 'दृष्टि स्मार्ट असिस्ट' : 'Drishti Smart Assist'}
                  </span>
                  <span className="text-[10px] text-slate-600 font-medium">
                    {isHindi ? 'ध्वनि व स्पर्श-अनुकूलित परीक्षा प्रणाली' : 'Hands-Free Speech & Tactile'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: 5 Feature Shortcut Cards (Cols 8-12)           */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 flex flex-col gap-3 w-full z-10">
            
            {/* 1. AI Assistant Card */}
            <Link
              to="/candidate/dashboard"
              className="group p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-white/95 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between gap-3 text-left shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 border border-blue-100">
                  <Volume2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {isHindi ? 'एआई सहायक' : 'AI Assistant'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isHindi ? 'बात करें, पूछें, सीखें और तैयारी करें' : 'Talk, Ask, Learn & Prepare'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            {/* 2. Personalized Study Plan Card */}
            <Link
              to="/candidate/learning"
              className="group p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-white/95 hover:bg-white hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-between gap-3 text-left shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 border border-purple-100">
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    {isHindi ? 'व्यक्तिगत अध्ययन योजना' : 'Personalized Study Plan'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isHindi ? 'अपनी परीक्षा का रोडमैप बनाएं' : 'Create your exam roadmap'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            {/* 3. Practice & Mock Tests Card */}
            <Link
              to="/candidate/practice"
              className="group p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-white/95 hover:bg-white hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between gap-3 text-left shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 border border-amber-100">
                  <BarChart3 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {isHindi ? 'अभ्यास और मॉक टेस्ट' : 'Practice & Mock Tests'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isHindi ? 'अपनी वास्तविक प्रगति ट्रैक करें' : 'Track your progress'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            {/* 4. ScribeConnect Card */}
            <button
              type="button"
              onClick={() => setIsScribeModalOpen(true)}
              className="group p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-white/95 hover:bg-white hover:border-emerald-400 hover:shadow-md transition-all flex items-center justify-between gap-3 text-left shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 border border-emerald-100">
                  <Users className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {isHindi ? 'स्क्राइब कनेक्ट (ScribeConnect)' : 'ScribeConnect'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isHindi ? 'प्रमाणित लेखक सहायता खोजें' : 'Find verified & trained scribes'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 5. MindCare AI Card */}
            <button
              type="button"
              onClick={() => setIsMindCareModalOpen(true)}
              className="group p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-white/95 hover:bg-white hover:border-pink-400 hover:shadow-md transition-all flex items-center justify-between gap-3 text-left shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 border border-pink-100">
                  <LotusIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-pink-600 transition-colors">
                    {isHindi ? 'माइंडकेयर एआई (MindCare AI)' : 'MindCare AI'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isHindi ? 'तनावमुक्त और प्रेरित रहें' : 'Stay motivated & stress-free'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-pink-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM ROW: Key Trust Metrics & Golden Horizon Pathway       */}
        {/* ============================================================ */}
        <div
          aria-label="Platform Statistics and Vision"
          className="mt-12 pt-8 border-t border-slate-200/90 flex flex-col lg:flex-row items-center justify-between gap-6"
        >
          {/* Left Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 items-center w-full lg:w-auto">
            {/* Stat 1: 10K+ Learners */}
            <div className="flex items-center gap-3 justify-start">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Users className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  10K+
                </span>
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  {isHindi ? 'संतुष्ट शिक्षार्थी' : 'Learners'}
                </span>
              </div>
            </div>

            {/* Stat 2: 50+ Exams */}
            <div className="flex items-center gap-3 justify-start">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                <Layers className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  50+
                </span>
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  {isHindi ? 'प्रतियोगी परीक्षाएं' : 'Exams'}
                </span>
              </div>
            </div>

            {/* Stat 3: 98% Accessibility */}
            <div className="flex items-center gap-3 justify-start">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Target className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  98%
                </span>
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  {isHindi ? 'सुलभता अनुपालन' : 'Accessibility'}
                </span>
              </div>
            </div>

            {/* Stat 4: 4.8/5 Rating */}
            <div className="flex items-center gap-3 justify-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Award className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  4.8/5
                </span>
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  {isHindi ? 'उपयोगकर्ता रेटिंग' : 'User Rating'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Golden Horizon & Path Artwork */}
          <div className="hidden lg:flex items-center justify-end shrink-0 max-w-sm">
            <img
              src={drishtiGoldenWaveImg}
              alt="Golden pathway with candidate walking towards horizon"
              className="h-20 w-auto object-contain select-none"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. Watch Demo Accessible Interactive Modal                   */}
      {/* ============================================================ */}
      {isDemoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Play className="w-4 h-4 fill-amber-700" />
                </div>
                <h3 id="demo-modal-title" className="text-lg font-bold text-slate-900">
                  {isHindi ? 'DRISHTI वॉकथ्रू और डेमो' : 'DRISHTI Platform Walkthrough'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Close demo modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-left">
              <p className="text-sm text-slate-600 leading-relaxed">
                {isHindi
                  ? 'दृष्टि (DRISHTI) विशेष रूप से दृष्टिबाधित और विशेष आवश्यकता वाले उम्मीदवारों के लिए निर्मित पहला भारतीय एआई-संचालित परीक्षा व अभ्यास मंच है।'
                  : 'DRISHTI is India’s first AI-powered, accessible learning and examination platform engineered for visually impaired candidates.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    {isHindi ? '1. संपूर्ण वॉयस नेविगेशन' : '1. Full Voice Navigation'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {isHindi
                      ? 'माउस के बिना केवल बोलकर सवाल हल करें, विकल्प चुनें और सबमिट करें।'
                      : 'Speak naturally to read questions, choose options, and submit answers without a mouse.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    {isHindi ? '2. सारथी एआई मित्र' : '2. Saarthi AI Companion'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {isHindi
                      ? 'हिंदी, हिंग्लिश या अंग्रेजी में किसी भी सवाल का सरल स्पष्टीकरण प्राप्त करें।'
                      : 'Ask concepts in simple Hindi, Hinglish, or English and get step-by-step guidance.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  speak(
                    isHindi
                      ? 'दृष्टि प्लेटफॉर्म पर आपका स्वागत है। आप बिना किसी सहायता के स्वतंत्र रूप से परीक्षा दे सकते हैं।'
                      : 'Welcome to Drishti. You can independently prepare and attempt exams with total autonomy.'
                  );
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {isHindi ? 'आवाज़ का नमूना सुनें' : 'Listen to Voice Sample'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDemoModalOpen(false);
                  navigate('/candidate/practice/session/demo-percentages');
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
              >
                {isHindi ? 'लाइव डेमो अभ्यास शुरू करें' : 'Launch Demo Practice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. ScribeConnect Accessible Modal                            */}
      {/* ============================================================ */}
      {isScribeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="scribe-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 id="scribe-modal-title" className="text-lg font-bold text-slate-900">
                  {isHindi ? 'स्क्राइब कनेक्ट (ScribeConnect)' : 'ScribeConnect Services'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScribeModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Close scribe modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-3.5 text-left text-xs sm:text-sm text-slate-600">
              <p>
                {isHindi
                  ? 'स्क्राइब कनेक्ट भारत सरकार के दिशा-निर्देशों (MoSJE Guidelines) के तहत दृष्टिबाधित उम्मीदवारों को प्रशिक्षित, सत्यापित एवं योग्य परीक्षा लेखक (Scribes) प्रदान करता है।'
                  : 'ScribeConnect links candidates with certified, background-verified scribes compliant with Ministry of Social Justice & Empowerment guidelines.'}
              </p>
              <ul className="space-y-2 list-none p-0">
                <li className="flex items-center gap-2 text-slate-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isHindi ? '100% सरकारी नियमों का अनुपालन' : '100% Official Regulatory Compliance'}</span>
                </li>
                <li className="flex items-center gap-2 text-slate-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isHindi ? 'पूर्व-प्रशिक्षित एवं तकनीकी रूप से सक्षम लेखक' : 'Pre-trained & Accessibility-Tested Scribes'}</span>
                </li>
                <li className="flex items-center gap-2 text-slate-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isHindi ? 'परीक्षा से 48 घंटे पूर्व डिजिटल मिलान' : 'Automated 48h Advance Exam Matching'}</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsScribeModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                {isHindi ? 'समझ गया' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MindCare AI Accessible Modal                              */}
      {/* ============================================================ */}
      {isMindCareModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mindcare-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <h3 id="mindcare-modal-title" className="text-lg font-bold text-slate-900">
                  {isHindi ? 'माइंडकेयर एआई (MindCare AI)' : 'MindCare AI Wellness'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMindCareModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Close mindcare modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-3.5 text-left text-xs sm:text-sm text-slate-600">
              <p>
                {isHindi
                  ? 'परीक्षा की तैयारी के दौरान तनाव और घबराहट स्वाभाविक है। माइंडकेयर एआई आपके आत्मविश्वास को बढ़ाने और मानसिक शांति बनाए रखने के लिए 24/7 उपस्थित है।'
                  : 'Exam stress can be overwhelming. MindCare AI helps you stay calm, focused, and mentally resilient throughout your exam preparation.'}
              </p>
              <div className="p-3.5 rounded-2xl bg-pink-50/70 border border-pink-200">
                <p className="italic text-slate-800 text-xs sm:text-sm font-medium">
                  {isHindi
                    ? '"आपकी गति धीमी हो सकती है, लेकिन जब तक आप रुकते नहीं, आप हर बाधा पार कर रहे हैं।"'
                    : '"Your pace does not matter as long as you do not stop. You are capable of conquering every barrier."'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMindCareModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold cursor-pointer"
              >
                {isHindi ? 'तनावमुक्त रहें' : 'Stay Focused'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
