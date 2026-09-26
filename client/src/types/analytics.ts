export interface SubjectScore {
  subject: string;
  score: number;
  total: number;
  accuracyPercentage: number;
}

export interface WeakTopic {
  topic: string;
  subject: string;
  accuracyPercentage: number;
  recommendedPracticeUrl?: string;
  rationale: string;
}

export interface Analytics {
  score: number;
  accuracy: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  subjectPerformance: SubjectScore[];
  weakTopics: WeakTopic[];
}
