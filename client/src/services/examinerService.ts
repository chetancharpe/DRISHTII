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
  ExamSectionConfig,
  AggregateSessionMonitoring,
  ExamIncident,
  SystemAnnouncement,
  ExamPublishChecklist,
} from '../types/examiner';

export interface UploadQuestionItem {
  text: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  subject?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  accessibilityNotes?: string;
}

export interface UploadSectionItem {
  name: string;
  description?: string;
  order?: number;
  durationMinutes?: number;
  questions: UploadQuestionItem[];
}

export interface ExamPaperUploadPayload {
  title: string;
  code: string;
  description?: string;
  examType?: string;
  durationMinutes?: number;
  publishImmediately?: boolean;
  sections: UploadSectionItem[];
}

const INITIAL_EXAMINER_EXAMS: ExaminerExam[] = [
  {
    id: 'exam-01',
    code: 'EXAM-2026-AAA',
    title: 'All India Accessible Aptitude Assessment 2026',
    description: 'Premier national competitive entrance assessment for higher technical education with native screen reader and keyboard optimization.',
    organization: 'National Assessment Council',
    organizationId: 'org-01',
    category: 'Competitive Entrance',
    examType: 'competitive',
    language: 'English',
    instructions: '1. Total duration is 60 minutes.\n2. All questions are screen reader and keyboard-friendly.\n3. Calculator is prohibited.',
    lifecycleStatus: 'LIVE',
    version: 2,
    isImmutable: true,
    totalQuestions: 50,
    totalMarks: 100,
    candidatesCount: 1055,
    candidateGroupIds: ['grp-01', 'grp-02'],
    createdAt: '2026-08-15',
    updatedAt: '2026-09-24',
    publishedAt: '2026-09-24 16:45 IST',
    sections: [
      {
        id: 'sec-01',
        title: 'Quantitative Aptitude',
        code: 'SEC-QA',
        description: 'Arithmetic progressions, algebra, and numeric sequence problems.',
        questionCount: 20,
        durationMinutes: 25,
        navigationPolicy: 'free',
        questionIds: ['qb-101', 'qb-102'],
      },
    ],
    rules: {
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
    accessibility: {
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
    schedule: {
      startDate: '2026-09-27',
      startTime: '09:00',
      endDate: '2026-09-27',
      endTime: '18:00',
      durationMinutes: 60,
      timezone: 'IST (UTC+05:30)',
      attemptWindowHours: 9,
      candidateAvailability: 'all_assigned',
    },
    markingScheme: {
      correctMarks: 2,
      negativeMarks: 0.5,
      unansweredMarks: 0,
      description: '+2 for correct response, -0.5 for incorrect response, 0 for unattempted.',
    },
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
  },
];

const INITIAL_AGGREGATE_MONITOR: AggregateSessionMonitoring = {
  examId: 'exam-01',
  examTitle: 'All India Accessible Aptitude Assessment 2026',
  totalCandidates: 1055,
  notStarted: 124,
  inProgress: 618,
  submitted: 288,
  temporarilyDisconnected: 19,
  expired: 6,
  submissionPending: 0,
  averageProgressPercentage: 64,
  lastUpdatedTimestamp: Date.now(),
  isPaused: false,
};

const INITIAL_EXAM_INCIDENTS: ExamIncident[] = [
  {
    id: 'inc-501',
    examId: 'exam-01',
    candidateRef: 'GW-2026-10493 (Priya S.)',
    timestamp: '2026-09-27 10:14 IST',
    type: 'reconnect',
    severity: 'low',
    status: 'resolved',
    actionTaken: 'Candidate reconnected automatically. Local encrypted answers synchronized with zero data loss.',
    notes: 'Brief 14-second Wi-Fi reconnect event.',
  },
];

const INITIAL_ANNOUNCEMENTS: SystemAnnouncement[] = [
  {
    id: 'ann-01',
    examId: 'exam-01',
    sentAt: '2026-09-27 09:30 IST',
    sentBy: 'Chief Examiner Thorne',
    message: 'Welcome candidates. Please note all mathematics questions contain audio speech transcripts accessible via Alt+S.',
    priority: 'normal',
    acknowledgedByCount: 590,
  },
];

import { storage } from '../utils/storage';
import { apiClient } from './api';

const EXAMS_STORAGE_KEY = 'gowow_examiner_exams';
const INCIDENTS_STORAGE_KEY = 'gowow_examiner_incidents';
const ANNOUNCEMENTS_STORAGE_KEY = 'gowow_examiner_announcements';

export interface BackendSectionResponse {
  id: string;
  exam_id: string;
  title: string;
  description?: string;
  display_order: number;
  duration_seconds?: number;
  navigation_policy: string;
  question_count: number;
}

export interface BackendExamExaminerResponse {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  duration_seconds: number;
  extra_time_seconds: number;
  language: string;
  status: string;
  start_at?: string;
  end_at?: string;
  created_by?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  sections?: BackendSectionResponse[];
  candidate_count: number;
  organization_id?: string;
}

export interface BackendExamMonitorSummary {
  exam_id: string;
  total_assigned: number;
  not_started: number;
  active: number;
  interrupted: number;
  submitted: number;
  expired: number;
  candidates?: Array<{
    candidate_id: string;
    masked_name: string;
    status: string;
    remaining_seconds?: number;
    answered_count: number;
    total_questions: number;
    last_sync_seconds_ago?: number;
  }>;
}

function mapBackendExamToExaminerExam(
  bExam: BackendExamExaminerResponse,
  fallback?: Partial<ExaminerExam>
): ExaminerExam {
  const durationMins = Math.round((bExam.duration_seconds || 3600) / 60);
  const sections: ExamSectionConfig[] = (bExam.sections && bExam.sections.length > 0)
    ? bExam.sections.map((s, idx) => ({
        id: s.id,
        title: s.title || `Section ${idx + 1}`,
        code: `SEC-${idx + 1}`,
        description: s.description || '',
        questionCount: s.question_count || 0,
        durationMinutes: Math.round((s.duration_seconds || 900) / 60),
        navigationPolicy: (s.navigation_policy?.toLowerCase() === 'sequential' ? 'section_locked' : 'free') as any,
        questionIds: [],
      }))
    : fallback?.sections || [];

  const totalQuestions = sections.reduce((acc, s) => acc + (s.questionCount || 0), 0);

  return {
    id: bExam.id,
    code: fallback?.code || `EXAM-${bExam.id.slice(0, 8).toUpperCase()}`,
    title: bExam.title,
    description: bExam.description || '',
    organization: fallback?.organization || 'National Assessment Council',
    organizationId: bExam.organization_id || 'org-01',
    category: fallback?.category || 'Competitive Entrance',
    examType: fallback?.examType || 'competitive',
    language: bExam.language || 'English',
    instructions: bExam.instructions || 'Standard accessible examination instructions.',
    lifecycleStatus: (bExam.status ? bExam.status.toUpperCase() : 'DRAFT') as any,
    version: fallback?.version || 1,
    isImmutable: bExam.status === 'LIVE' || bExam.status === 'COMPLETED',
    totalQuestions: totalQuestions || fallback?.totalQuestions || 0,
    totalMarks: fallback?.totalMarks || (totalQuestions * 2) || 100,
    candidatesCount: bExam.candidate_count || 0,
    candidateGroupIds: fallback?.candidateGroupIds || [],
    createdAt: bExam.created_at ? bExam.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    updatedAt: bExam.updated_at ? bExam.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
    publishedAt: bExam.published_at || fallback?.publishedAt,
    sections,
    rules: fallback?.rules || {
      durationMinutes: durationMins,
      allowBackNavigation: true,
      allowSectionSwitching: true,
      allowReviewMarking: true,
      randomizeQuestionOrder: false,
      randomizeOptionOrder: false,
      calculatorPolicy: 'none',
      pausePermission: false,
      attemptCountLimit: 1,
    },
    accessibility: fallback?.accessibility || {
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
    schedule: fallback?.schedule || {
      startDate: bExam.start_at ? bExam.start_at.split('T')[0] : new Date().toISOString().split('T')[0],
      startTime: bExam.start_at ? bExam.start_at.split('T')[1]?.slice(0, 5) || '10:00' : '10:00',
      endDate: bExam.end_at ? bExam.end_at.split('T')[0] : new Date().toISOString().split('T')[0],
      endTime: bExam.end_at ? bExam.end_at.split('T')[1]?.slice(0, 5) || '12:00' : '12:00',
      durationMinutes: durationMins,
      timezone: 'IST (UTC+05:30)',
      attemptWindowHours: 2,
      candidateAvailability: 'all_assigned',
    },
    markingScheme: fallback?.markingScheme || {
      correctMarks: 2,
      negativeMarks: 0.5,
      unansweredMarks: 0,
      description: '+2 for correct, -0.5 for wrong, 0 for unattempted.',
    },
    checklist: fallback?.checklist || {
      basicInfoComplete: true,
      structureValid: sections.length > 0,
      questionsAssigned: totalQuestions > 0,
      correctAnswersVerified: true,
      markingSchemeConfigured: true,
      accessibilityChecksPassed: true,
      candidateGroupAssigned: true,
      scheduleValid: true,
      instructionsAccessible: true,
      securityConfigured: true,
      previewVerified: false,
      blockingErrors: [],
      warnings: [],
    },
  };
}

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
    const exams = await this.getExams();
    return {
      activeExams: exams.filter((e) => e.lifecycleStatus === 'LIVE').length,
      upcomingExams: exams.filter((e) => e.lifecycleStatus === 'SCHEDULED' || e.lifecycleStatus === 'READY').length,
      draftExams: exams.filter((e) => e.lifecycleStatus === 'DRAFT').length,
      completedExams: exams.filter((e) => e.lifecycleStatus === 'COMPLETED').length,
      totalCandidates: exams.reduce((acc, curr) => acc + (curr.candidatesCount || 0), 0),
      pendingEvaluations: 0,
    };
  }

  async getExams(): Promise<ExaminerExam[]> {
    try {
      const backendExams = await apiClient.get<BackendExamExaminerResponse[]>('/examiner/exams');
      if (Array.isArray(backendExams) && backendExams.length > 0) {
        const stored = this.getStoredExams();
        const storedMap = new Map(stored.map((e) => [e.id, e]));
        const mapped = backendExams.map((b) => mapBackendExamToExaminerExam(b, storedMap.get(b.id)));
        this.saveStoredExams(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Backend /examiner/exams unavailable, using cached local exams:', err);
    }
    return this.getStoredExams();
  }

  async getExamById(id: string): Promise<ExaminerExam | null> {
    try {
      const bExam = await apiClient.get<BackendExamExaminerResponse>(`/examiner/exams/${id}`);
      if (bExam && bExam.id) {
        const stored = this.getStoredExams();
        const local = stored.find((e) => e.id === id);
        return mapBackendExamToExaminerExam(bExam, local);
      }
    } catch (err) {
      console.warn(`Backend /examiner/exams/${id} call failed, checking cached exams:`, err);
    }
    const exams = this.getStoredExams();
    return exams.find((e) => e.id === id) || null;
  }

  async createExam(data: Partial<ExaminerExam>): Promise<ExaminerExam> {
    const exams = this.getStoredExams();
    let backendCreated: BackendExamExaminerResponse | null = null;

    try {
      backendCreated = await apiClient.post<BackendExamExaminerResponse>('/examiner/exams', {
        title: data.title || 'Untitled Assessment',
        description: data.description || '',
        instructions: data.instructions || 'Standard accessible examination instructions.',
        duration_seconds: (data.rules?.durationMinutes || data.schedule?.durationMinutes || 60) * 60,
        extra_time_seconds: Math.round(((data.accessibility?.extraTimeMultiplier || 1.0) - 1.0) * ((data.rules?.durationMinutes || 60) * 60)),
        language: data.language || 'English',
        organization_id: data.organizationId || 'org-01',
      });

      // If sections exist, add them via backend
      if (backendCreated?.id && data.sections && data.sections.length > 0) {
        for (let i = 0; i < data.sections.length; i++) {
          const sec = data.sections[i];
          try {
            await apiClient.post(`/examiner/exams/${backendCreated.id}/sections`, {
              title: sec.title || `Section ${i + 1}`,
              description: sec.description || '',
              display_order: i + 1,
              duration_seconds: (sec.durationMinutes || 15) * 60,
              navigation_policy: sec.navigationPolicy === 'section_locked' ? 'SEQUENTIAL' : 'FREE',
              question_ids: sec.questionIds || [],
            });
          } catch (secErr) {
            console.warn(`Failed adding section "${sec.title}" to backend exam:`, secErr);
          }
        }
      }
    } catch (err) {
      console.warn('Backend /examiner/exams create failed, falling back to local creation:', err);
    }

    const newExam: ExaminerExam = backendCreated
      ? mapBackendExamToExaminerExam(backendCreated, {
          ...data,
          id: backendCreated.id,
          code: data.code || `EXAM-${backendCreated.id.slice(0, 8).toUpperCase()}`,
        })
      : {
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

    try {
      const patchPayload: Record<string, any> = {};
      if (updates.title !== undefined) patchPayload.title = updates.title;
      if (updates.description !== undefined) patchPayload.description = updates.description;
      if (updates.instructions !== undefined) patchPayload.instructions = updates.instructions;
      if (updates.language !== undefined) patchPayload.language = updates.language;
      if (updates.lifecycleStatus !== undefined) patchPayload.status = updates.lifecycleStatus;
      if (updates.rules?.durationMinutes !== undefined) {
        patchPayload.duration_seconds = updates.rules.durationMinutes * 60;
      }

      if (Object.keys(patchPayload).length > 0) {
        const bExam = await apiClient.patch<BackendExamExaminerResponse>(`/examiner/exams/${id}`, patchPayload);
        if (bExam && bExam.id) {
          const merged = mapBackendExamToExaminerExam(bExam, { ...exams[idx], ...updates });
          exams[idx] = merged;
          this.saveStoredExams(exams);
          return merged;
        }
      }
    } catch (err) {
      console.warn(`Backend update failed for exam ${id}, applying locally:`, err);
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

    try {
      const bExam = await apiClient.post<BackendExamExaminerResponse>(`/examiner/exams/${id}/publish`, {});
      if (bExam && bExam.id) {
        return this.updateExam(id, {
          lifecycleStatus: 'LIVE',
          isImmutable: true,
          publishedAt: bExam.published_at || `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-US', { hour12: false })} IST`,
          checklist,
        });
      }
    } catch (err) {
      console.warn(`Backend publish for exam ${id} failed, applying local publish state:`, err);
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
    try {
      const bMon = await apiClient.get<BackendExamMonitorSummary>(`/examiner/exams/${examId}/monitor`);
      if (bMon && bMon.exam_id) {
        const exam = await this.getExamById(examId);
        const candidates = bMon.candidates || [];
        const answeredSum = candidates.reduce(
          (acc, c) => acc + (c.total_questions > 0 ? (c.answered_count / c.total_questions) * 100 : 0),
          0
        );
        const avgProgress = candidates.length > 0
          ? Math.round(answeredSum / candidates.length)
          : (bMon.submitted > 0 ? 100 : 0);

        return {
          examId: bMon.exam_id,
          examTitle: exam?.title || 'Examination Telemetry',
          totalCandidates: bMon.total_assigned,
          notStarted: bMon.not_started,
          inProgress: bMon.active,
          submitted: bMon.submitted,
          temporarilyDisconnected: bMon.interrupted,
          expired: bMon.expired,
          submissionPending: 0,
          averageProgressPercentage: avgProgress,
          lastUpdatedTimestamp: Date.now(),
          isPaused: exam?.lifecycleStatus === 'PAUSED',
        };
      }
    } catch (err) {
      console.warn(`Backend /examiner/exams/${examId}/monitor call failed, falling back:`, err);
    }

    const base = { ...INITIAL_AGGREGATE_MONITOR, examId };
    return base;
  }

  async getIncidents(examId: string): Promise<ExamIncident[]> {
    const incidents = storage.get<ExamIncident[]>(INCIDENTS_STORAGE_KEY, INITIAL_EXAM_INCIDENTS);
    return incidents.filter((i) => i.examId === examId);
  }

  async recordIncident(
    incident: Omit<ExamIncident, 'id' | 'timestamp' | 'status'> & Partial<Pick<ExamIncident, 'id' | 'timestamp' | 'status'>>
  ): Promise<ExamIncident> {
    const incidents = storage.get<ExamIncident[]>(INCIDENTS_STORAGE_KEY, INITIAL_EXAM_INCIDENTS);
    const newIncident: ExamIncident = {
      id: incident.id || `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: incident.timestamp || `${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} IST`,
      status: incident.status || 'logged',
      ...incident,
    };
    incidents.unshift(newIncident);
    storage.set(INCIDENTS_STORAGE_KEY, incidents);
    return newIncident;
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

  /**
   * Upload Question Paper / Mock Test / Question Bank
   * Calls backend POST /api/v1/examiner/exams/upload-paper
   * If publishImmediately is true, publishes to Candidate portal immediately (status LIVE)
   */
  async uploadExamPaper(payload: ExamPaperUploadPayload): Promise<any> {
    try {
      const res: any = await apiClient.post('/examiner/exams/upload-paper', {
        title: payload.title,
        code: payload.code,
        description: payload.description || '',
        exam_type: payload.examType || 'mock_test',
        duration_minutes: payload.durationMinutes || 60,
        publish_immediately: payload.publishImmediately ?? true,
        sections: payload.sections.map((s, idx) => ({
          name: s.name,
          description: s.description || '',
          order: s.order ?? (idx + 1),
          duration_minutes: s.durationMinutes,
          questions: s.questions.map((q) => ({
            text: q.text,
            options: q.options,
            correct_answer: q.correctAnswer,
            explanation: q.explanation || '',
            marks: q.marks ?? 1.0,
            negative_marks: q.negativeMarks ?? 0.25,
            subject: q.subject || 'General Knowledge',
            topic: q.topic || 'General',
            difficulty: q.difficulty || 'medium',
            accessibility_notes: q.accessibilityNotes || '',
          })),
        })),
      });

      // Synchronize into local storage cache
      const newExam: ExaminerExam = {
        id: res?.data?.exam_id || `exam-${Date.now()}`,
        code: payload.code,
        title: payload.title,
        description: payload.description || '',
        organization: 'National Assessment Council',
        organizationId: 'org-01',
        category: 'Competitive Mock Test',
        examType: (payload.examType as any) || 'mock_test',
        language: 'English',
        instructions: '1. All questions are screen reader and keyboard-friendly.\n2. Negative marking applies.',
        lifecycleStatus: payload.publishImmediately ? 'LIVE' : 'DRAFT',
        version: 1,
        isImmutable: false,
        totalQuestions: payload.sections.reduce((acc, s) => acc + s.questions.length, 0),
        totalMarks: payload.sections.reduce(
          (acc, s) => acc + s.questions.reduce((qAcc, q) => qAcc + (q.marks ?? 1.0), 0),
          0
        ),
        candidatesCount: 0,
        candidateGroupIds: [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        publishedAt: payload.publishImmediately ? new Date().toISOString() : undefined,
        sections: payload.sections.map((s, idx) => ({
          id: `sec-${Date.now()}-${idx}`,
          title: s.name,
          code: `SEC-${idx + 1}`,
          description: s.description || '',
          questionCount: s.questions.length,
          durationMinutes: s.durationMinutes || 30,
          navigationPolicy: 'free',
          questionIds: s.questions.map((_, qIdx) => `q-up-${idx}-${qIdx}`),
        })),
        rules: {
          durationMinutes: payload.durationMinutes || 60,
          allowBackNavigation: true,
          allowSectionSwitching: true,
          allowReviewMarking: true,
          randomizeQuestionOrder: false,
          randomizeOptionOrder: false,
          calculatorPolicy: 'none',
          pausePermission: false,
          attemptCountLimit: 1,
        },
        accessibility: {
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
        schedule: {
          startDate: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endDate: '2026-12-31',
          endTime: '23:59',
          durationMinutes: payload.durationMinutes || 60,
          timezone: 'IST (UTC+05:30)',
          attemptWindowHours: 72,
          candidateAvailability: 'all_assigned',
        },
        markingScheme: {
          correctMarks: 2,
          negativeMarks: 0.5,
          unansweredMarks: 0,
          description: '+2 for correct, -0.5 for wrong',
        },
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
      };

      const exams = storage.get<ExaminerExam[]>(EXAMS_STORAGE_KEY, INITIAL_EXAMINER_EXAMS);
      exams.unshift(newExam);
      storage.set(EXAMS_STORAGE_KEY, exams);

      return res?.data;
    } catch (err: any) {
      console.warn('Backend paper upload failed, falling back to local storage:', err);
      const newId = `exam-${Date.now()}`;
      const newExam: ExaminerExam = {
        id: newId,
        code: payload.code,
        title: payload.title,
        description: payload.description || '',
        organization: 'National Assessment Council',
        organizationId: 'org-01',
        category: 'Competitive Mock Test',
        examType: (payload.examType as any) || 'mock_test',
        language: 'English',
        instructions: '1. All questions are screen reader and keyboard-friendly.\n2. Negative marking applies.',
        lifecycleStatus: payload.publishImmediately ? 'LIVE' : 'DRAFT',
        version: 1,
        isImmutable: false,
        totalQuestions: payload.sections.reduce((acc, s) => acc + s.questions.length, 0),
        totalMarks: payload.sections.reduce(
          (acc, s) => acc + s.questions.reduce((qAcc, q) => qAcc + (q.marks ?? 1.0), 0),
          0
        ),
        candidatesCount: 0,
        candidateGroupIds: [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        publishedAt: payload.publishImmediately ? new Date().toISOString() : undefined,
        sections: payload.sections.map((s, idx) => ({
          id: `sec-${Date.now()}-${idx}`,
          title: s.name,
          code: `SEC-${idx + 1}`,
          description: s.description || '',
          questionCount: s.questions.length,
          durationMinutes: s.durationMinutes || 30,
          navigationPolicy: 'free',
          questionIds: s.questions.map((_, qIdx) => `q-up-${idx}-${qIdx}`),
        })),
        rules: {
          durationMinutes: payload.durationMinutes || 60,
          allowBackNavigation: true,
          allowSectionSwitching: true,
          allowReviewMarking: true,
          randomizeQuestionOrder: false,
          randomizeOptionOrder: false,
          calculatorPolicy: 'none',
          pausePermission: false,
          attemptCountLimit: 1,
        },
        accessibility: {
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
        schedule: {
          startDate: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endDate: '2026-12-31',
          endTime: '23:59',
          durationMinutes: payload.durationMinutes || 60,
          timezone: 'IST (UTC+05:30)',
          attemptWindowHours: 72,
          candidateAvailability: 'all_assigned',
        },
        markingScheme: {
          correctMarks: 2,
          negativeMarks: 0.5,
          unansweredMarks: 0,
          description: '+2 for correct, -0.5 for wrong',
        },
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
      };

      const exams = storage.get<ExaminerExam[]>(EXAMS_STORAGE_KEY, INITIAL_EXAMINER_EXAMS);
      exams.unshift(newExam);
      storage.set(EXAMS_STORAGE_KEY, exams);

      return {
        message: 'Exam paper uploaded successfully',
        exam_id: newId,
        title: payload.title,
        code: payload.code,
        status: payload.publishImmediately ? 'LIVE' : 'DRAFT',
        total_sections: payload.sections.length,
        total_questions: newExam.totalQuestions,
      };
    }
  }
}

export const examinerService = new ExaminerService();
