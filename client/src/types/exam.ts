export type ExamStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'archived';

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // Duration in minutes
  language: string;
  totalQuestions: number;
  status: ExamStatus;
  category?: string;
  passingMarks?: number;
  totalMarks?: number;
}
