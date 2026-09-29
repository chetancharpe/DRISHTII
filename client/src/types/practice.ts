export type PracticeDifficulty = 'easy' | 'medium' | 'hard';
export type PracticeDifficultyFilter = 'all' | PracticeDifficulty;

export type PracticeQuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export interface PracticeOption {
  id: string; // e.g. "A", "B", "C", "D"
  label: string; // "A", "B", etc.
  text: string;
  ariaLabel?: string;
}

export interface PracticeQuestion {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  type: PracticeQuestionType;
  difficulty: PracticeDifficulty;
  questionText: string;
  options: PracticeOption[];
  correctOptionIds: string[]; // Options that are correct
  explanation: string;
  audioDescription?: string;
  hint?: string;
}

export interface PracticeAnswerRecord {
  selectedOptionIds: string[];
  isSubmitted: boolean;
  isCorrect?: boolean;
  isSkipped?: boolean;
  timeSpentSeconds: number;
}

export interface PracticeSessionFilter {
  examId: string;
  subjectId: string;
  topicId: string;
  difficulty: PracticeDifficultyFilter;
  questionCount: number;
}

export interface PracticeSession {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  difficulty: PracticeDifficultyFilter;
  totalQuestions: number;
  questions: PracticeQuestion[];
  answers: Record<string, PracticeAnswerRecord>;
  currentQuestionIndex: number;
  status: 'in_progress' | 'paused' | 'completed';
  startedAt: string;
  completedAt?: string;
  timeElapsedSeconds: number;
  timeLimitSeconds?: number;
  explanations?: Record<string, string>;
  correctOptions?: Record<string, string[]>;
}

export interface PracticeWeakTopic {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  accuracyPercent: number;
  totalAttempted: number;
  recommendation: string;
}

export interface PracticeQuestionReview {
  questionId: string;
  questionIndex: number;
  questionText: string;
  type: PracticeQuestionType;
  difficulty: PracticeDifficulty;
  userSelectedOptionIds: string[];
  correctOptionIds: string[];
  isCorrect: boolean;
  isSkipped: boolean;
  explanation: string;
  options: PracticeOption[];
}

export interface PracticeResult {
  sessionId: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  difficulty: PracticeDifficultyFilter;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  accuracyPercent: number;
  timeUsedSeconds: number;
  timeUsedFormatted: string;
  summaryTitle: string;
  summaryMessage: string;
  recommendedNextStep: string;
  weakTopics: PracticeWeakTopic[];
  reviews: PracticeQuestionReview[];
}

export interface PracticeHistoryItem {
  id: string;
  sessionId: string;
  date: string;
  formattedDate: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  questionsCount: number;
  scoreFormatted: string; // e.g. "8 / 10"
  accuracyPercent: number;
  timeUsedFormatted: string;
  difficulty: PracticeDifficulty;
}
