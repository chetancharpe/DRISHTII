/**
 * Examiner Service Layer
 * Clean abstraction for exam creation, section management, publishing lifecycle,
 * aggregate monitoring, incidents, and broadcast announcements.
 * Prepared for future FastAPI endpoints:
 * - GET /api/examiner/exams
 * - POST /api/examiner/exams
 * - PATCH /api/examiner/exams/:id
 * - POST /api/examiner/exams/:id/publish
 * - GET /api/examiner/exams/:id/monitor
 */

import {
  ExaminerExam,
  AggregateSessionMonitoring,
  ExamIncident,
  SystemAnnouncement,
  ExamPublishChecklist,
} from '../types/examiner';
import {
  INITIAL_EXAMINER_EXAMS,
  INITIAL_AGGREGATE_MONITOR,
  INITIAL_EXAM_INCIDENTS,
  INITIAL_ANNOUNCEMENTS,
} from '../data/examinerData';
import { storage } from '../utils/storage';

const EXAMS_STORAGE_KEY = 'gowow_examiner_exams';
const INCIDENTS_STORAGE_KEY = 'gowow_examiner_incidents';
const ANNOUNCEMENTS_STORAGE_KEY = 'gowow_examiner_announcements';

class ExaminerService {
  private getStoredExams(): ExaminerExam[] {
    return storage.get<ExaminerExam[]>(EXAMS_STORAGE_KEY, INITIAL_EXAMINER_EXAMS);
  }

  private saveStoredExams(exams: ExaminerExam[]): void {
    storage.set(EXAMS_STORAGE_KEY, exams);
  }

  async getDashboardKPIs(): Promise<{
    activeExams: number;
    upcomingExams: number;
    draftExams: number;
    completedExams: number;
    totalCandidates: number;
    pendingEvaluations: number;
  }> {
    const exams = this.getStoredExams();
    return {
      activeExams: exams.filter((e) => e.lifecycleStatus === 'LIVE').length,
      upcomingExams: exams.filter((e) => e.lifecycleStatus === 'SCHEDULED' || e.lifecycleStatus === 'READY').length,
      draftExams: exams.filter((e) => e.lifecycleStatus === 'DRAFT').length,
      completedExams: exams.filter((e) => e.lifecycleStatus === 'COMPLETED').length,
      totalCandidates: exams.reduce((acc, curr) => acc + (curr.candidatesCount || 0), 0),
      pendingEvaluations: 43,
    };
  }

  async getExams(): Promise<ExaminerExam[]> {
    return this.getStoredExams();
  }

  async getExamById(id: string): Promise<ExaminerExam | null> {
    const exams = this.getStoredExams();
    return exams.find((e) => e.id === id) || null;
  }

  async createExam(data: Partial<ExaminerExam>): Promise<ExaminerExam> {
    const exams = this.getStoredExams();
    const newExam: ExaminerExam = {
      id: `exam-${Date.now()}`,
      code: data.code || `EXAM-${Math.floor(1000 + Math.random() * 9000)}`,
      title: data.title || 'Untitled Assessment',
      description: data.description || '',
      organization: data.organization || 'National Assessment Council',
      organizationId: data.organizationId || 'org-01',
      category: data.category || 'Competitive Entrance',
      examType: data.examType || 'competitive',
      language: data.language || 'English',
      instructions: data.instructions || 'Standard accessible examination instructions.',
      lifecycleStatus: 'DRAFT',
      version: 1,
      isImmutable: false,
      sections: data.sections || [],
      rules: data.rules || {
        durationMinutes: 60,
        allowBackNavigation: true,
        allowSectionSwitching: true,
        allowReviewMarking: true,
        randomizeQuestionOrder: false,
        randomizeOptionOrder: false,
        calculatorPolicy: 'none',
        pausePermission: false,
        attemptCountLimit: 1,
      },
      accessibility: data.accessibility || {
        screenReaderOptimized: true,
        audioQuestionSupport: true,
        audioPolicy: 'allowed',
        textScalingSupport: true,
        highContrastSupport: true,
        darkModeSupport: true,
        reducedMotionSupport: true,
        keyboardNavigationFirst: true,
        extraTimeMultiplier: 1.5,
      },
      candidateGroupIds: data.candidateGroupIds || [],
      schedule: data.schedule || {
        startDate: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endDate: new Date().toISOString().split('T')[0],
        endTime: '12:00',
        durationMinutes: 60,
        timezone: 'IST (UTC+05:30)',
        attemptWindowHours: 2,
        candidateAvailability: 'all_assigned',
      },
      markingScheme: data.markingScheme || {
        correctMarks: 2,
        negativeMarks: 0.5,
        unansweredMarks: 0,
        description: '+2 for correct, -0.5 for wrong, 0 for unattempted.',
      },
      totalQuestions: data.totalQuestions || 0,
      totalMarks: data.totalMarks || 0,
      candidatesCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      checklist: {
        basicInfoComplete: true,
        structureValid: (data.sections?.length || 0) > 0,
        questionsAssigned: (data.totalQuestions || 0) > 0,
        correctAnswersVerified: true,
        markingSchemeConfigured: true,
        accessibilityChecksPassed: true,
        candidateGroupAssigned: (data.candidateGroupIds?.length || 0) > 0,
        scheduleValid: true,
        instructionsAccessible: true,
        securityConfigured: true,
        previewVerified: false,
        blockingErrors: [],
        warnings: ['Preview as Candidate recommended before live release.'],
      },
    };

    exams.unshift(newExam);
    this.saveStoredExams(exams);
    return newExam;
  }

  async updateExam(id: string, updates: Partial<ExaminerExam>): Promise<ExaminerExam> {
    const exams = this.getStoredExams();
    const idx = exams.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`Examination ${id} not found.`);

    if (exams[idx].lifecycleStatus === 'LIVE' && exams[idx].isImmutable) {
      // Prevent destructive mutation to live examination parameters
      const forbiddenKeys = ['questions', 'markingScheme', 'totalMarks'];
      const attemptedForbidden = Object.keys(updates).filter((k) => forbiddenKeys.includes(k));
      if (attemptedForbidden.length > 0) {
        throw new Error(
          `Cannot modify locked parameters [${attemptedForbidden.join(', ')}] while examination is in LIVE state.`
        );
      }
    }

    exams[idx] = {
      ...exams[idx],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    this.saveStoredExams(exams);
    return exams[idx];
  }

  async runAccessibilityGate(exam: ExaminerExam): Promise<ExamPublishChecklist> {
    const blockingErrors: string[] = [];
    const warnings: string[] = [];

    if (!exam.title || exam.title.trim().length < 5) {
      blockingErrors.push('Examination title must be at least 5 characters.');
    }
    if (!exam.instructions || exam.instructions.trim().length < 20) {
      blockingErrors.push('Accessible candidate instructions are required (minimum 20 characters).');
    }
    if (!exam.sections || exam.sections.length === 0) {
      blockingErrors.push('At least one examination section must be defined.');
    } else {
      const emptySections = exam.sections.filter((s) => !s.questionIds || s.questionIds.length === 0);
      if (emptySections.length > 0) {
        blockingErrors.push(`Section "${emptySections[0].title}" contains zero assigned questions.`);
      }
    }

    if (!exam.candidateGroupIds || exam.candidateGroupIds.length === 0) {
      warnings.push('No candidate groups currently assigned. No candidates will be able to take the exam.');
    }

    if (!exam.schedule.startDate || !exam.schedule.startTime) {
      blockingErrors.push('Valid examination schedule start date & time required.');
    }

    if (!exam.accessibility.screenReaderOptimized) {
      warnings.push('Screen reader optimization is toggled off; this restricts access for blind candidates.');
    }

    return {
      basicInfoComplete: !!(exam.title && exam.description && exam.instructions),
      structureValid: (exam.sections?.length || 0) > 0,
      questionsAssigned: (exam.totalQuestions || 0) > 0,
      correctAnswersVerified: true,
      markingSchemeConfigured: exam.markingScheme.correctMarks > 0,
      accessibilityChecksPassed: blockingErrors.length === 0,
      candidateGroupAssigned: (exam.candidateGroupIds?.length || 0) > 0,
      scheduleValid: !!(exam.schedule.startDate && exam.schedule.startTime),
      instructionsAccessible: !!(exam.instructions && exam.instructions.length >= 20),
      securityConfigured: true,
      previewVerified: exam.checklist?.previewVerified || false,
      blockingErrors,
      warnings,
    };
  }

  async publishExam(id: string): Promise<ExaminerExam> {
    const exam = await this.getExamById(id);
    if (!exam) throw new Error(`Examination ${id} not found.`);

    const checklist = await this.runAccessibilityGate(exam);
    if (checklist.blockingErrors.length > 0) {
      throw new Error(`Cannot publish: ${checklist.blockingErrors.join(' | ')}`);
    }

    return this.updateExam(id, {
      lifecycleStatus: 'LIVE',
      isImmutable: true,
      publishedAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-US', { hour12: false })} IST`,
      checklist,
    });
  }

  async pauseExam(id: string): Promise<ExaminerExam> {
    return this.updateExam(id, { lifecycleStatus: 'PAUSED' });
  }

  async resumeExam(id: string): Promise<ExaminerExam> {
    return this.updateExam(id, { lifecycleStatus: 'LIVE' });
  }

  async endExam(id: string): Promise<ExaminerExam> {
    return this.updateExam(id, { lifecycleStatus: 'COMPLETED' });
  }

  async getAggregateMonitoring(examId: string): Promise<AggregateSessionMonitoring> {
    const base = { ...INITIAL_AGGREGATE_MONITOR, examId };
    return base;
  }

  async getIncidents(examId: string): Promise<ExamIncident[]> {
    const incidents = storage.get<ExamIncident[]>(INCIDENTS_STORAGE_KEY, INITIAL_EXAM_INCIDENTS);
    return incidents.filter((i) => i.examId === examId);
  }

  async resolveIncident(incidentId: string, actionTaken: string): Promise<void> {
    const incidents = storage.get<ExamIncident[]>(INCIDENTS_STORAGE_KEY, INITIAL_EXAM_INCIDENTS);
    const updated = incidents.map((i) =>
      i.id === incidentId ? { ...i, status: 'resolved' as const, actionTaken } : i
    );
    storage.set(INCIDENTS_STORAGE_KEY, updated);
  }

  async getAnnouncements(examId: string): Promise<SystemAnnouncement[]> {
    const all = storage.get<SystemAnnouncement[]>(ANNOUNCEMENTS_STORAGE_KEY, INITIAL_ANNOUNCEMENTS);
    return all.filter((a) => a.examId === examId);
  }

  async broadcastAnnouncement(
    examId: string,
    message: string,
    priority: 'normal' | 'urgent',
    sentBy: string
  ): Promise<SystemAnnouncement> {
    const all = storage.get<SystemAnnouncement[]>(ANNOUNCEMENTS_STORAGE_KEY, INITIAL_ANNOUNCEMENTS);
    const newAnn: SystemAnnouncement = {
      id: `ann-${Date.now()}`,
      examId,
      sentAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} IST`,
      sentBy,
      message,
      priority,
      acknowledgedByCount: 0,
    };
    all.unshift(newAnn);
    storage.set(ANNOUNCEMENTS_STORAGE_KEY, all);
    return newAnn;
  }
}

export const examinerService = new ExaminerService();
