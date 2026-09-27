/**
 * GoWow Examination Platform — Examiner & Admin Domain Models
 * 
 * Formal TypeScript models supporting role separation, question bank versioning,
 * multi-step exam configuration, accessible validation gating, real-time aggregate monitoring,
 * manual evaluation, and administrative audit logging.
 */

export type ExamLifecycleStatus =
  | 'DRAFT'
  | 'READY'
  | 'SCHEDULED'
  | 'LIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED';

export type UserRoleType = 'candidate' | 'examiner' | 'admin';

export type Permission =
  | 'exam.view'
  | 'exam.create'
  | 'exam.edit'
  | 'exam.publish'
  | 'exam.monitor'
  | 'exam.evaluate'
  | 'exam.result.publish'
  | 'candidate.view'
  | 'candidate.manage'
  | 'question.create'
  | 'question.edit'
  | 'question.publish'
  | 'analytics.view'
  | 'admin.manageUsers'
  | 'admin.manageRoles'
  | 'admin.manageOrgs'
  | 'admin.audit';

export interface Organization {
  id: string;
  name: string;
  code: string;
  domain: string;
  status: 'active' | 'inactive';
  candidateCount: number;
  examinerCount: number;
  createdAt: string;
}

export type BankQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'numerical'
  | 'short_answer';

export type BankQuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface BankQuestionOption {
  id: string;
  label: string; // 'A', 'B', 'C', 'D'
  text: string;
  isCorrect: boolean;
  ariaLabel?: string;
}

export interface BankQuestionAccessibility {
  hasReadableText: boolean;
  hasAltTextIfImage: boolean;
  noImageOnlyInformation: boolean;
  tableHasHeaders: boolean;
  formulaHasAccessibleSpeech: boolean;
  optionsHaveMeaningfulLabels: boolean;
  languageSpecified: boolean;
  noColorOnlyInstructions: boolean;
  altText?: string;
  longDescription?: string;
  formulaSpeech?: string;
  tableCaption?: string;
  tableHeaders?: string[];
}

export interface QuestionVersion {
  versionNumber: number;
  publishedAt: string;
  authorName: string;
  changeSummary: string;
  isImmutable: boolean;
}

export interface QuestionBankItem {
  id: string;
  code: string;
  text: string;
  type: BankQuestionType;
  subject: string;
  topic: string;
  difficulty: BankQuestionDifficulty;
  marks: number;
  negativeMarks: number;
  language: string;
  tags: string[];
  options: BankQuestionOption[];
  correctAnswerText?: string; // For numerical / short answer
  explanation: string;
  accessibility: BankQuestionAccessibility;
  version: number;
  versionHistory: QuestionVersion[];
  status: 'draft' | 'approved' | 'in_review' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  formulaLatex?: string;
}

export interface ExamSectionConfig {
  id: string;
  title: string;
  code: string;
  description: string;
  questionCount: number;
  durationMinutes: number;
  navigationPolicy: 'free' | 'section_locked' | 'forward_only';
  questionIds: string[];
}

export interface ExamRulesConfig {
  durationMinutes: number;
  allowBackNavigation: boolean;
  allowSectionSwitching: boolean;
  allowReviewMarking: boolean;
  randomizeQuestionOrder: boolean;
  randomizeOptionOrder: boolean;
  calculatorPolicy: 'none' | 'basic' | 'scientific';
  pausePermission: boolean;
  attemptCountLimit: number;
}

export interface ExamAccessibilityConfig {
  screenReaderOptimized: boolean;
  audioQuestionSupport: boolean;
  audioPolicy: 'allowed' | 'optional' | 'required' | 'unavailable';
  textScalingSupport: boolean;
  highContrastSupport: boolean;
  darkModeSupport: boolean;
  reducedMotionSupport: boolean;
  keyboardNavigationFirst: boolean;
  extraTimeMultiplier: number; // e.g. 1.0 = standard, 1.5 = PwD 50% extra time
}

export interface CandidateGroup {
  id: string;
  name: string;
  code: string;
  organizationId: string;
  candidateCount: number;
  description: string;
  assignedExamIds: string[];
  createdAt: string;
}

export interface ExamCandidateRecord {
  id: string;
  candidateName: string;
  candidateId: string;
  email: string;
  groupId: string;
  groupName: string;
  eligibilityStatus: 'eligible' | 'pending' | 'ineligible';
  examStatus: 'not_started' | 'in_progress' | 'submitted' | 'expired';
  attemptStatus: 'first_attempt' | 'retake' | 'absent';
  accessibilityStatus: 'standard' | 'screen_reader' | 'magnification' | 'high_contrast';
  extraTimeGrantedMinutes: number;
}

export interface ExamScheduleConfig {
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;
  endTime: string;
  durationMinutes: number;
  timezone: string; // e.g., 'IST (UTC+05:30)'
  attemptWindowHours: number;
  candidateAvailability: 'all_assigned' | 'group_only' | 'verified_only';
}

export interface ExamPublishChecklist {
  basicInfoComplete: boolean;
  structureValid: boolean;
  questionsAssigned: boolean;
  correctAnswersVerified: boolean;
  markingSchemeConfigured: boolean;
  accessibilityChecksPassed: boolean;
  candidateGroupAssigned: boolean;
  scheduleValid: boolean;
  instructionsAccessible: boolean;
  securityConfigured: boolean;
  previewVerified: boolean;
  blockingErrors: string[];
  warnings: string[];
}

export interface ExaminerExam {
  id: string;
  code: string;
  title: string;
  description: string;
  organization: string;
  organizationId: string;
  category: string;
  examType: 'competitive' | 'recruitment' | 'institutional' | 'practice_cert';
  language: string;
  instructions: string;
  lifecycleStatus: ExamLifecycleStatus;
  version: number;
  isImmutable: boolean;
  sections: ExamSectionConfig[];
  rules: ExamRulesConfig;
  accessibility: ExamAccessibilityConfig;
  candidateGroupIds: string[];
  schedule: ExamScheduleConfig;
  markingScheme: {
    correctMarks: number;
    negativeMarks: number;
    unansweredMarks: number;
    description: string;
  };
  totalQuestions: number;
  totalMarks: number;
  candidatesCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  checklist: ExamPublishChecklist;
}

export interface AggregateSessionMonitoring {
  examId: string;
  examTitle: string;
  totalCandidates: number;
  notStarted: number;
  inProgress: number;
  submitted: number;
  temporarilyDisconnected: number;
  expired: number;
  submissionPending: number;
  averageProgressPercentage: number;
  lastUpdatedTimestamp: number;
  isPaused: boolean;
}

export interface ExamIncident {
  id: string;
  examId: string;
  candidateRef: string;
  timestamp: string;
  type: 'disconnect' | 'reconnect' | 'sync_delay' | 'session_expired' | 'assistive_key_pressed';
  severity: 'low' | 'medium' | 'high';
  status: 'logged' | 'investigating' | 'resolved';
  actionTaken?: string;
  notes?: string;
}

export interface SystemAnnouncement {
  id: string;
  examId: string;
  sentAt: string;
  sentBy: string;
  message: string;
  priority: 'normal' | 'urgent';
  acknowledgedByCount: number;
}

export interface SubjectiveEvaluationItem {
  id: string;
  candidateId: string;
  candidateName: string;
  questionId: string;
  questionText: string;
  maxMarks: number;
  candidateAnswerText: string;
  rubricExpectedAnswer: string;
  awardedMarks: number | null;
  examinerComments: string;
  status: 'pending' | 'evaluated' | 'reviewed';
  evaluatedBy?: string;
  evaluatedAt?: string;
}

export interface ExamCandidateResult {
  id: string;
  examId: string;
  candidateId: string;
  candidateName: string;
  candidateCode: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  unansweredCount: number;
  timeSpentMinutes: number;
  submissionStatus: 'submitted_on_time' | 'auto_submitted_expired' | 'disqualified';
  evaluationStatus: 'automated_complete' | 'pending_subjective' | 'evaluated' | 'published';
  publishedAt?: string;
  isCorrected?: boolean;
  correctionHistory?: {
    originalScore: number;
    newScore: number;
    reason: string;
    changedBy: string;
    timestamp: string;
  }[];
}

export interface QuestionAnalyticsItem {
  questionId: string;
  code: string;
  textSnippet: string;
  subject: string;
  attemptsCount: number;
  correctPercentage: number;
  incorrectPercentage: number;
  unansweredPercentage: number;
  averageTimeSeconds: number;
  difficultyIndicator: 'appropriate' | 'too_easy' | 'too_hard' | 'confusing_distractor';
  accessibilityNote?: string;
}

export interface ExamAnalyticsSummary {
  examId: string;
  title: string;
  totalEnrolled: number;
  participationRate: number; // percentage
  completionRate: number; // percentage
  averageScore: number;
  highestScore: number;
  medianScore: number;
  averageAccuracy: number;
  averageTimeUsageMinutes: number;
  unansweredRate: number;
  sectionPerformances: {
    sectionTitle: string;
    averageScore: number;
    accuracyPercentage: number;
    completionPercentage: number;
  }[];
  questionAnalytics: QuestionAnalyticsItem[];
  accessibilityMetrics: {
    screenReaderCompatibleItemsPct: number;
    missingAltTextWarningsResolved: number;
    audioAssistanceUsageCount: number;
    highContrastModeUsageCount: number;
    textScalingUsageCount: number;
  };
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRoleType;
  action:
    | 'EXAM_CREATED'
    | 'QUESTION_EDITED'
    | 'QUESTION_VERSIONED'
    | 'EXAM_PUBLISHED'
    | 'SCHEDULE_UPDATED'
    | 'CANDIDATE_GROUP_ASSIGNED'
    | 'EXAM_PAUSED'
    | 'EXAM_RESUMED'
    | 'EXAM_ENDED'
    | 'ANNOUNCEMENT_SENT'
    | 'RESULT_EVALUATED'
    | 'RESULTS_PUBLISHED'
    | 'RESULT_CORRECTED'
    | 'USER_DEACTIVATED'
    | 'ROLE_UPDATED';
  entityId: string;
  entityType: 'exam' | 'question' | 'schedule' | 'candidate' | 'result' | 'user' | 'organization';
  details: string;
  ipAddressMasked: string;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRoleType;
  organizationId: string;
  organizationName: string;
  status: 'active' | 'pending_verification' | 'deactivated';
  assignedPermissions: Permission[];
  lastLoginAt: string;
  createdAt: string;
}
