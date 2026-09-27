/**
 * GoWow Live Examination System — Candidate Experience Types
 * 
 * NOTE: The current implementation is a production-oriented frontend prototype.
 * Official examination security, server-authoritative timing, persistent answer storage,
 * eligibility validation, and authoritative submission must be enforced by the future backend.
 */

export type ExamStatus =
  | 'scheduled'
  | 'available'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'expired'
  | 'unavailable'
  | 'published'
  | 'draft'
  | 'archived';

export type ExamQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false';

export interface ExamOption {
  id: string;
  label: string; // e.g., 'A', 'B', 'C', 'D'
  text: string;
}

export interface ExamQuestion {
  id: string;
  number: number;
  sectionId: string;
  sectionTitle: string;
  type: ExamQuestionType;
  prompt: string;
  options: ExamOption[];
  formula?: string; // Optional math formula in LaTeX or textual representation
  formulaAriaLabel?: string; // Screen reader accessible transcription
  table?: {
    caption?: string;
    headers: string[];
    rows: string[][];
  };
  image?: {
    src: string;
    alt: string;
    caption?: string;
  };
  marks: number;
  negativeMarks: number;
}

export interface ExamSection {
  id: string;
  title: string;
  code: string;
  description: string;
  totalQuestions: number;
  durationMinutes?: number;
  questions: ExamQuestion[];
}

export interface ExamNavigationPolicy {
  freeNavigation: boolean; // Allow jumping between any questions
  sectionLocked: boolean; // Must finish current section before moving to next
  forwardOnly: boolean; // Cannot go back to previous questions
  reviewAllowed: boolean; // Can mark questions for review
  backNavigationAllowed: boolean; // Can click 'Previous'
}

export interface ExamMarkingScheme {
  correctMarks: number;
  incorrectPenalty: number;
  unansweredMarks: number;
  description: string;
}

export interface ExamAudioPolicy {
  allowAudioAssistance: boolean;
  autoReadQuestion: boolean;
}

export type ExamResultAccessPolicy =
  | 'showImmediately'
  | 'showAfterExamWindow'
  | 'showAfterEvaluation'
  | 'hidden';

export interface ExamConfig {
  id: string;
  title: string;
  organization: string;
  examCode: string;
  durationMinutes: number;
  totalQuestions: number;
  sections: ExamSection[];
  markingScheme: ExamMarkingScheme;
  navigationPolicy: ExamNavigationPolicy;
  audioPolicy: ExamAudioPolicy;
  calculatorPolicy: 'none' | 'basic' | 'scientific';
  resultAccess: ExamResultAccessPolicy;
  scheduledStartTime: string;
  scheduledEndTime: string;
  allowedDevices?: string[];
  maxAttempts: number;
}

export interface ExamEligibility {
  examId: string;
  isEligible: boolean;
  reason: string;
  candidateName: string;
  rollNumber: string;
  category: string;
  verificationStatus: 'verified' | 'pending' | 'ineligible';
}

export interface Exam {
  id: string;
  title: string;
  organization: string;
  examCode: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  duration?: number; // Compatibility
  totalQuestions: number;
  status: ExamStatus;
  category?: string; // Compatibility
  totalMarks?: number; // Compatibility
  passingMarks?: number; // Compatibility
  language?: string; // Compatibility
  sections: {
    id: string;
    title: string;
    questionCount: number;
  }[];
  eligibility: ExamEligibility;
  accessibilityHighlights: {
    keyboard: string;
    screenReader: string;
    audio: string;
    visual: string;
    timer: string;
  };
  description: string;
  instructionsSummary: string[];
  config: ExamConfig;
}

/**
 * Strict Session State Machine
 * Prevents conflicting UI states.
 */
export type ExamSessionStatus =
  | 'NOT_STARTED'
  | 'STARTING'
  | 'ACTIVE'
  | 'SYNCING'
  | 'CONNECTION_LOST'
  | 'SUBMITTING'
  | 'SUBMITTED'
  | 'EXPIRED'
  | 'ERROR';

export type ExamSyncState =
  | 'SYNCED'
  | 'SAVING'
  | 'OFFLINE'
  | 'SYNC_ERROR';

export interface ExamAnswer {
  questionId: string;
  selectedOptions: string[];
  isMarkedForReview: boolean;
  savedAt: number;
  syncState: 'synced' | 'pending' | 'failed';
}

export interface ExamTimerState {
  serverStartTime: number;
  serverEndTime: number;
  remainingSeconds: number;
  isExpired: boolean;
}

export interface ExamSession {
  sessionId: string;
  examId: string;
  candidateId: string;
  status: ExamSessionStatus;
  serverStartTime: number;
  serverEndTime: number;
  currentSectionId: string;
  currentQuestionId: string;
  answers: Record<string, ExamAnswer>;
  unsyncedQuestionIds: string[];
  lastSyncTimestamp: number;
  submissionId?: string;
  submittedAt?: string;
}

export interface ExamSubmission {
  submissionId: string;
  examId: string;
  candidateId: string;
  submittedAt: string;
  status: 'confirmed' | 'pending_verification';
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  markedCount: number;
  unsynchronizedCount: number;
  resultAccess: ExamResultAccessPolicy;
  resultNotice: string;
}
