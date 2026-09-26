export interface ExamCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  subjectIds: string[];
}

export interface LearningFormula {
  id: string;
  visualText: string;
  accessibleText: string; // Plain-language spoken equivalent
  explanation?: string;
}

export interface LearningExample {
  id: string;
  question: string;
  steps: string[];
  answer: string;
  explanation?: string;
}

export interface LearningSection {
  id: string;
  title: string;
  paragraphs: string[];
  formulas?: LearningFormula[];
  examples?: LearningExample[];
  keyPoints?: string[];
  notes?: string[];
}

export interface LearningTopic {
  id: string;
  subjectId: string;
  name: string;
  shortDescription: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  estimatedMinutes: number;
  isRecommended?: boolean;
  isCompleted?: boolean;
  learningObjectives: string[];
  overview: string;
  sections: LearningSection[];
  quickRecap: string[];
  audioNarrative?: string;
  practiceAvailable: boolean;
  practiceCount: number;
}

export interface LearningSubject {
  id: string;
  examId: string;
  name: string;
  code: string;
  description: string;
  iconName: string;
  progressPercent: number;
  completedTopicsCount: number;
  totalTopicsCount: number;
  topics: LearningTopic[];
  recommendedTopicId?: string;
}

export interface LearningBreadcrumbItem {
  label: string;
  path?: string;
  isCurrent?: boolean;
}
