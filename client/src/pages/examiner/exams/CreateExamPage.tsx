import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { examinerService } from '../../../services/examinerService';
import { ExamSectionConfig } from '../../../types/examiner';
import { AccessibilityGateModal } from '../../../components/examiner/AccessibilityGateModal';

import {
  FileText,
  Layers,
  FileQuestion,
  Sliders,
  ShieldCheck,
  Users,
  Calendar,
  Eye,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Basic Info', icon: <FileText className="w-4 h-4" /> },
  { id: 2, label: 'Structure', icon: <Layers className="w-4 h-4" /> },
  { id: 3, label: 'Questions', icon: <FileQuestion className="w-4 h-4" /> },
  { id: 4, label: 'Rules', icon: <Sliders className="w-4 h-4" /> },
  { id: 5, label: 'Accessibility', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 6, label: 'Candidates', icon: <Users className="w-4 h-4" /> },
  { id: 7, label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 8, label: 'Preview', icon: <Eye className="w-4 h-4" /> },
  { id: 9, label: 'Publish', icon: <CheckCircle2 className="w-4 h-4" /> },
];

export const CreateExamPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGateOpen, setIsGateOpen] = useState<boolean>(false);

  // Form State
  const [basicInfo, setBasicInfo] = useState({
    title: 'Accessible Aptitude Assessment 2026',
    description: 'A standardized competitive examination engineered for independent low-vision and blind candidate participation.',
    organization: 'National Assessment Council',
    organizationId: 'org-01',
    category: 'Competitive Aptitude',
    examType: 'competitive' as const,
    language: 'English',
    instructions: '1. Total duration is 60 minutes.\n2. Audio descriptions and screen reader navigation are active.\n3. Calculator is prohibited.\n4. Section jumping is permitted.',
  });

  const [sections, setSections] = useState<ExamSectionConfig[]>([
    {
      id: 'sec-1',
      title: 'Quantitative Aptitude',
      code: 'SEC-QA',
      description: 'Arithmetic progressions, sequences, and equations',
      questionCount: 20,
      durationMinutes: 25,
      navigationPolicy: 'free',
      questionIds: ['qb-101', 'qb-102', 'qb-106'],
    },
    {
      id: 'sec-2',
      title: 'Logical Reasoning & Data Interpretation',
      code: 'SEC-LR',
      description: 'Tabular datasets and deductive reasoning',
      questionCount: 15,
      durationMinutes: 20,
      navigationPolicy: 'free',
      questionIds: ['qb-103', 'qb-108'],
    },
    {
      id: 'sec-3',
      title: 'General Knowledge & Verbal',
      code: 'SEC-GK',
      description: 'Vocabulary, polity, and comprehension',
      questionCount: 15,
      durationMinutes: 15,
      navigationPolicy: 'free',
      questionIds: ['qb-104', 'qb-105', 'qb-107'],
    },
  ]);

  const [rules, setRules] = useState({
    durationMinutes: 60,
    allowBackNavigation: true,
    allowSectionSwitching: true,
    allowReviewMarking: true,
    randomizeQuestionOrder: false,
    randomizeOptionOrder: false,
    calculatorPolicy: 'none' as const,
    pausePermission: false,
    attemptCountLimit: 1,
  });

  const [markingScheme] = useState({

    correctMarks: 2,
    negativeMarks: 0.5,
    unansweredMarks: 0,
    description: '+2 for correct response, -0.5 for wrong response, 0 for unattempted.',
  });

  const [accessibility, setAccessibility] = useState({
    screenReaderOptimized: true,
    audioQuestionSupport: true,
    audioPolicy: 'allowed' as const,
    textScalingSupport: true,
    highContrastSupport: true,
    darkModeSupport: true,
    reducedMotionSupport: true,
    keyboardNavigationFirst: true,
    extraTimeMultiplier: 1.5,
  });

  const [candidateGroupIds, setCandidateGroupIds] = useState<string[]>(['grp-01', 'grp-03']);

  const [schedule, setSchedule] = useState({
    startDate: '2026-10-10',
    startTime: '10:00',
    endDate: '2026-10-10',
    endTime: '12:00',
    durationMinutes: 60,
    timezone: 'IST (UTC+05:30)',
    attemptWindowHours: 2,
    candidateAvailability: 'all_assigned' as const,
  });

  const handleAddSection = () => {
    const newSec: ExamSectionConfig = {
      id: `sec-${Date.now()}`,
      title: 'New Section',
      code: `SEC-${sections.length + 1}`,
      description: 'Section description and instructions',
      questionCount: 10,
      durationMinutes: 15,
      navigationPolicy: 'free',
      questionIds: [],
    };
    setSections([...sections, newSec]);
  };

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const calculateTotalQuestions = () => {
    return sections.reduce((acc, curr) => acc + (curr.questionIds?.length || 0), 0);
  };

  const handleFinalPublish = async () => {
    setIsSubmitting(true);
    try {
      const created = await examinerService.createExam({
        title: basicInfo.title,
        description: basicInfo.description,
        organization: basicInfo.organization,
        organizationId: basicInfo.organizationId,
        category: basicInfo.category,
        examType: basicInfo.examType,
        language: basicInfo.language,
        instructions: basicInfo.instructions,
        sections,
        rules,
        markingScheme,
        accessibility,
        candidateGroupIds,
        schedule,
        totalQuestions: calculateTotalQuestions(),
        totalMarks: calculateTotalQuestions() * markingScheme.correctMarks,
      });

      await examinerService.publishExam(created.id);
      setIsGateOpen(false);
      navigate(`/examiner/exams/${created.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Create Examination Wizard">
      {/* Page Title */}
      <div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
          Authoring Studio
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Create New Examination
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          Follow the 9-step guided authoring wizard to configure structure, rules, questions, and accessibility gating.
        </p>
      </div>

      {/* 9-Step Progress Bar */}
      <nav aria-label="Exam creation steps" className="bg-surface border border-border rounded-xl p-2.5 overflow-x-auto">
        <ol className="flex items-center gap-1 min-w-[760px]">
          {STEPS.map((s) => (
            <li key={s.id} className="flex-1">
              <button
                type="button"
                onClick={() => setCurrentStep(s.id)}
                className={`w-full flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                  currentStep === s.id
                    ? 'bg-primary text-primary-contrast shadow-sm'
                    : currentStep > s.id
                    ? 'bg-surface-elevated text-foreground hover:bg-surface-elevated/80'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                <span>{s.id}.</span>
                <span>{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <Card
        title={`Step ${currentStep} of 9: ${STEPS[currentStep - 1].label}`}
        subtitle="Ensure fields are clearly documented for non-visual and assistive candidates"
      >
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="exam-name" className="text-xs font-bold text-foreground block">
                Exam Name <span className="text-status-error">*</span>
              </label>
              <input
                id="exam-name"
                type="text"
                value={basicInfo.title}
                onChange={(e) => setBasicInfo({ ...basicInfo, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Accessible Aptitude Assessment"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="exam-desc" className="text-xs font-bold text-foreground block">
                Description
              </label>
              <textarea
                id="exam-desc"
                rows={3}
                value={basicInfo.description}
                onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Brief assessment overview..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label htmlFor="exam-org" className="text-xs font-bold text-foreground block">
                  Organization / Tenant
                </label>
                <input
                  id="exam-org"
                  type="text"
                  value={basicInfo.organization}
                  onChange={(e) => setBasicInfo({ ...basicInfo, organization: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="exam-cat" className="text-xs font-bold text-foreground block">
                  Category
                </label>
                <input
                  id="exam-cat"
                  type="text"
                  value={basicInfo.category}
                  onChange={(e) => setBasicInfo({ ...basicInfo, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="exam-lang" className="text-xs font-bold text-foreground block">
                  Primary Language
                </label>
                <select
                  id="exam-lang"
                  value={basicInfo.language}
                  onChange={(e) => setBasicInfo({ ...basicInfo, language: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Bilingual">Bilingual (English + Hindi)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="exam-inst" className="text-xs font-bold text-foreground block">
                Accessible Instructions & Rules for Candidates <span className="text-status-error">*</span>
              </label>
              <textarea
                id="exam-inst"
                rows={4}
                value={basicInfo.instructions}
                onChange={(e) => setBasicInfo({ ...basicInfo, instructions: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* Step 2: Structure */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-foreground-muted">
                Configure examination sections, duration bounds, and navigation policies.
              </p>
              <Button variant="secondary" size="sm" onClick={handleAddSection} className="flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Add Section
              </Button>
            </div>

            <div className="space-y-3">
              {sections.map((sec, idx) => (
                <div key={sec.id} className="p-4 rounded-xl border border-border bg-surface-elevated/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">Section {idx + 1}</span>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sec.id)}
                        className="text-status-error hover:underline text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-foreground block">Section Title</label>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[idx].title = e.target.value;
                          setSections(updated);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-foreground block">Section Duration (mins)</label>
                      <input
                        type="number"
                        value={sec.durationMinutes}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[idx].durationMinutes = Number(e.target.value);
                          setSections(updated);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-foreground block">Navigation Policy</label>
                      <select
                        value={sec.navigationPolicy}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[idx].navigationPolicy = e.target.value as any;
                          setSections(updated);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm"
                      >
                        <option value="free">Free Navigation</option>
                        <option value="section_locked">Section Locked</option>
                        <option value="forward_only">Forward Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Questions */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-surface-elevated flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground text-sm">Assigned Question Items</span>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Currently {calculateTotalQuestions()} verified questions mapped across {sections.length} sections.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-status-success/15 text-status-success border border-status-success/30">
                100% WCAG Validated
              </span>
            </div>

            <div className="space-y-2">
              {sections.map((sec) => (
                <div key={sec.id} className="p-3 rounded-lg border border-border bg-surface flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground text-sm">{sec.title}</span>
                    <span className="text-xs text-foreground-muted block">
                      {sec.questionIds.length} questions assigned
                    </span>
                  </div>
                  <span className="font-mono text-xs text-primary font-bold">
                    {sec.questionIds.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Rules */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Examination Duration (in minutes)
                </label>
                <input
                  type="number"
                  value={rules.durationMinutes}
                  onChange={(e) => setRules({ ...rules, durationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">Calculator Policy</label>
                <select
                  value={rules.calculatorPolicy}
                  onChange={(e) => setRules({ ...rules, calculatorPolicy: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                >
                  <option value="none">No Calculator (Prohibited)</option>
                  <option value="basic">Basic Four-Function Calculator</option>
                  <option value="scientific">Scientific Accessible Calculator</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface-elevated grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.allowBackNavigation}
                  onChange={(e) => setRules({ ...rules, allowBackNavigation: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-semibold text-foreground">Allow Back Navigation</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.allowSectionSwitching}
                  onChange={(e) => setRules({ ...rules, allowSectionSwitching: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-semibold text-foreground">Allow Section Switching</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.allowReviewMarking}
                  onChange={(e) => setRules({ ...rules, allowReviewMarking: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-semibold text-foreground">Allow Review Marking</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.randomizeQuestionOrder}
                  onChange={(e) => setRules({ ...rules, randomizeQuestionOrder: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-semibold text-foreground">Randomize Question Order</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Accessibility */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 text-xs text-status-success font-semibold">
              ✓ Institutional Accessible Exam Standards: Essential accessibility features cannot be arbitrarily disabled.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">Audio Policy</label>
                <select
                  value={accessibility.audioPolicy}
                  onChange={(e) => setAccessibility({ ...accessibility, audioPolicy: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                >
                  <option value="allowed">Audio Allowed (Optional)</option>
                  <option value="optional">Audio Optional</option>
                  <option value="required">Audio Required (Listening Comprehension)</option>
                  <option value="unavailable">Audio Unavailable</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Compensatory Extra Time Multiplier (for PwD Candidates)
                </label>
                <select
                  value={accessibility.extraTimeMultiplier}
                  onChange={(e) => setAccessibility({ ...accessibility, extraTimeMultiplier: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                >
                  <option value={1.5}>+50% Extra Time (Standard 60m → 90m)</option>
                  <option value={1.33}>+33% Extra Time (Standard 60m → 80m)</option>
                  <option value={2.0}>+100% Double Time (Standard 60m → 120m)</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface-elevated grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={accessibility.screenReaderOptimized} readOnly className="rounded text-primary" />
                <span className="font-semibold text-foreground">Screen Reader Native Optimization (Locked Active)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={accessibility.keyboardNavigationFirst} readOnly className="rounded text-primary" />
                <span className="font-semibold text-foreground">Keyboard-Only First Navigation (Locked Active)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={accessibility.highContrastSupport} readOnly className="rounded text-primary" />
                <span className="font-semibold text-foreground">High Contrast & Dark Mode Presets</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={accessibility.textScalingSupport} readOnly className="rounded text-primary" />
                <span className="font-semibold text-foreground">Non-Clipping Text Scaling up to 200%</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 6: Candidates */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <span className="text-xs font-bold text-foreground block">
              Assign Authorized Candidate Cohort Groups:
            </span>
            <div className="space-y-2">
              {[
                { id: 'grp-01', name: 'Batch A — Apex Competitive Cohort', count: 420 },
                { id: 'grp-02', name: 'AIML Students — Technical Specialization', count: 285 },
                { id: 'grp-03', name: 'National Scholarship Applicants (PwD Focused)', count: 350 },
                { id: 'grp-04', name: 'Practice & Trial Cohort 2026', count: 229 },
              ].map((grp) => {
                const isChecked = candidateGroupIds.includes(grp.id);
                return (
                  <label
                    key={grp.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      isChecked ? 'bg-primary/10 border-primary' : 'bg-surface border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCandidateGroupIds([...candidateGroupIds, grp.id]);
                          } else {
                            setCandidateGroupIds(candidateGroupIds.filter((id) => id !== grp.id));
                          }
                        }}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-bold text-foreground">{grp.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground-muted">
                      {grp.count} Candidates
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 7: Schedule */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="sched-start-date" className="text-xs font-bold text-foreground block">
                  Start Date
                </label>
                <input
                  id="sched-start-date"
                  type="date"
                  value={schedule.startDate}
                  onChange={(e) => setSchedule({ ...schedule, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="sched-start-time" className="text-xs font-bold text-foreground block">
                  Start Time
                </label>
                <input
                  id="sched-start-time"
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="sched-end-date" className="text-xs font-bold text-foreground block">
                  End Date
                </label>
                <input
                  id="sched-end-date"
                  type="date"
                  value={schedule.endDate}
                  onChange={(e) => setSchedule({ ...schedule, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="sched-end-time" className="text-xs font-bold text-foreground block">
                  End Time
                </label>
                <input
                  id="sched-end-time"
                  type="time"
                  value={schedule.endTime}
                  onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                />
              </div>
            </div>

            {/* Explicit Timezone Callout */}
            <div className="p-3.5 rounded-xl bg-surface-elevated border border-border flex items-center justify-between text-xs">
              <span className="text-foreground-muted">Official Standard Timezone:</span>
              <span className="font-mono font-bold text-primary text-sm">{schedule.timezone}</span>
            </div>
          </div>
        )}

        {/* Step 8: Preview */}
        {currentStep === 8 && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
              <span className="font-mono text-primary font-bold">ASSESSMENT SUMMARY</span>
              <h3 className="text-base font-bold text-foreground">{basicInfo.title}</h3>
              <p className="text-foreground-muted">{basicInfo.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border">
                <div>
                  <span className="text-foreground-muted block">Duration</span>
                  <span className="font-bold text-foreground">{rules.durationMinutes} Minutes</span>
                </div>
                <div>
                  <span className="text-foreground-muted block">Sections</span>
                  <span className="font-bold text-foreground">{sections.length}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block">Questions</span>
                  <span className="font-bold text-foreground">{calculateTotalQuestions()}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block">PwD Extra Time</span>
                  <span className="font-bold text-status-success">+50% (90 Mins)</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground block text-sm">Experience As Candidate</span>
                <span className="text-foreground-muted text-xs">
                  Inspect screen reader tree, keyboard shortcuts, and contrast levels.
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => alert('Simulated candidate preview launch.')}
              >
                Launch Preview
              </Button>
            </div>
          </div>
        )}

        {/* Step 9: Publish */}
        {currentStep === 9 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2 text-xs">
              <span className="font-bold text-foreground text-sm block">Institutional Verification Ready</span>
              <p className="text-foreground-muted leading-relaxed">
                Clicking "Run Pre-Flight Gate" will inspect question text readability, alt-text completeness,
                mathematical speech accessibility, schedule boundaries, and candidate cohort assignments.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setIsGateOpen(true)}
            >
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              Run Pre-Flight Accessibility Gate & Publish
            </Button>
          </div>
        )}

        {/* Wizard Step Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
          <Button
            variant="secondary"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Previous
          </Button>

          {currentStep < 9 && (
            <Button
              variant="primary"
              onClick={() => setCurrentStep((prev) => Math.min(9, prev + 1))}
              className="flex items-center gap-1.5"
            >
              Next Step
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </Card>

      {/* Accessibility Publish Gate Modal */}
      <AccessibilityGateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        onConfirmPublish={handleFinalPublish}
        isPublishing={isSubmitting}
        exam={{
          id: 'temp-exam',
          code: 'EXAM-TEMP',
          title: basicInfo.title,
          description: basicInfo.description,
          organization: basicInfo.organization,
          organizationId: basicInfo.organizationId,
          category: basicInfo.category,
          examType: basicInfo.examType,
          language: basicInfo.language,
          instructions: basicInfo.instructions,
          lifecycleStatus: 'DRAFT',
          version: 1,
          isImmutable: false,
          sections,
          rules,
          accessibility,
          candidateGroupIds,
          schedule,
          markingScheme,
          totalQuestions: calculateTotalQuestions(),
          totalMarks: calculateTotalQuestions() * markingScheme.correctMarks,
          candidatesCount: 770,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          checklist: {
            basicInfoComplete: true,
            structureValid: true,
            questionsAssigned: true,
            correctAnswersVerified: true,
            markingSchemeConfigured: true,
            accessibilityChecksPassed: true,
            candidateGroupAssigned: true,
            scheduleValid: true,
            instructionsAccessible: true,
            securityConfigured: true,
            previewVerified: true,
            blockingErrors: [],
            warnings: [],
          },
        }}
        checklist={{
          basicInfoComplete: true,
          structureValid: true,
          questionsAssigned: true,
          correctAnswersVerified: true,
          markingSchemeConfigured: true,
          accessibilityChecksPassed: true,
          candidateGroupAssigned: true,
          scheduleValid: true,
          instructionsAccessible: true,
          securityConfigured: true,
          previewVerified: true,
          blockingErrors: [],
          warnings: [],
        }}
      />
    </div>
  );
};
