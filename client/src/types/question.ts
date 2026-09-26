export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'numerical';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionOption {
  id: string;
  text: string;
  ariaLabel?: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  subject: string;
  topic: string;
  difficulty: QuestionDifficulty;
  explanation?: string;
  audioDescription?: string;
}
