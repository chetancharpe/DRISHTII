export type MockTestStatus = 'not_started' | 'in_progress' | 'completed';
export type MockTestDifficulty = 'easy' | 'medium' | 'hard';
export type MockQuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export type QuestionAttemptStatus =
  | 'unanswered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_marked_for_review';

export interface MockTestOption {
  id: string; // "A", "B", "C", "D"
  label: string;
  text: string;
  ariaLabel?: string;
}

export interface MockTestFormula {
  visualText: string;
  accessibleText: string;
}

export interface MockTestTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface MockTestQuestion {
  id: string;
  sectionId: string;
  questionNumber: number;
  text: string;
  type: MockQuestionType;
  options: MockTestOption[];
  correctOptionIds: string[];
  explanation?: string;
  difficulty: MockTestDifficulty;
  formula?: MockTestFormula;
  table?: MockTestTable;
  audioText?: string;
}

export interface MockTestSection {
  id: string;
  name: string;
  title?: string;
  code: string;
  description: string;
  totalQuestions: number;
  questions: MockTestQuestion[];
}

export interface MockTestMarkingScheme {
  correctMarks: number;
  incorrectPenalty: number;
  unansweredMarks: number;
}

export interface MockTest {
  id: string;
  title: string;
  examName: string;
  examCode: string;
  description: string;
  totalQuestions: number;
  durationMinutes: number;
  difficulty: MockTestDifficulty;
  status: MockTestStatus;
  sections: MockTestSection[];
  markingScheme: MockTestMarkingScheme;
  isRecommended?: boolean;
  instructionsSummary: string[];
  accessibilityHighlights: {
    keyboard: string;
    screenReader: string;
    audio: string;
    visual: string;
  };
}

export interface MockTestAnswer {
  questionId: string;
  sectionId: string;
  selectedOptionIds: string[];
  status: QuestionAttemptStatus;
  markedForReview: boolean;
  timeSpentSeconds: number;
}

export interface MockTestSession {
  sessionId: string;
  testId: string;
  testTitle: string;
  examName: string;
  totalQuestions: number;
  durationSeconds: number;
  secondsRemaining: number;
  currentSectionId: string;
  currentQuestionId: string;
  answers: Record<string, MockTestAnswer>;
  status: 'in_progress' | 'paused' | 'submitted' | 'expired';
  startedAt: string;
  completedAt?: string;
}

export interface SectionPerformance {
  sectionId: string;
  sectionName: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: number;
  maxScore: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
}

export interface MockTestResult {
  sessionId: string;
  testId: string;
  testTitle: string;
  examName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  markedForReviewCount: number;
  timeUsedSeconds: number;
  timeUsedFormatted: string;
  sectionPerformances: SectionPerformance[];
  factualInterpretations: string[];
  recommendedNextSteps: string[];
}

export interface MockTestQuestionReview {
  questionId: string;
  questionNumber: number;
  sectionId: string;
  sectionName: string;
  questionText: string;
  type: MockQuestionType;
  options: MockTestOption[];
  userOptionIds: string[];
  correctOptionIds: string[];
  status: 'correct' | 'incorrect' | 'unanswered';
  markedForReview: boolean;
  explanation: string;
  formula?: MockTestFormula;
  table?: MockTestTable;
}

export interface MockTestHistoryItem {
  attemptId: string;
  sessionId: string;
  testId: string;
  testTitle: string;
  examName: string;
  date: string;
  formattedDate: string;
  scoreFormatted: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeUsedFormatted: string;
  status: 'completed' | 'in_progress';
}

export interface MockTestFilterOptions {
  exam: string;
  section: string;
  difficulty: string;
  status: string;
}
