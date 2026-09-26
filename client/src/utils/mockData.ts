import { User } from '../types/user';
import { Exam } from '../types/exam';
import { Question } from '../types/question';
import { Analytics } from '../types/analytics';

export const MOCK_CANDIDATE: User = {
  id: 'cand-001',
  name: 'Ananya Sharma',
  email: 'candidate@gowow.demo',
  role: 'candidate',
  accessibilityPreferences: {
    fontSize: 'default',
    contrast: 'standard',
    theme: 'dark',
    audioEnabled: true,
    speechRate: 'normal',
    readQuestions: true,
    readOptions: true,
    readInstructions: true,
    announceStatus: true,
    timerAnnouncements: 'warnings',
    keyboardFirst: true,
    screenReaderOptimized: true,
    reducedMotion: 'system',
    simplifiedInterface: false,
    language: 'en',
    highContrast: false,
    audioFeedbackEnabled: true,
    keyboardOnlyMode: true,
    preferredLanguage: 'en',
  },
};

export const MOCK_EXAMINER: User = {
  id: 'exam-001',
  name: 'Dr. Rajesh Verma',
  email: 'examiner@gowow.demo',
  role: 'examiner',
  accessibilityPreferences: {
    fontSize: 'default',
    contrast: 'standard',
    theme: 'light',
    audioEnabled: false,
    speechRate: 'normal',
    readQuestions: true,
    readOptions: true,
    readInstructions: true,
    announceStatus: true,
    timerAnnouncements: 'warnings',
    keyboardFirst: false,
    screenReaderOptimized: false,
    reducedMotion: 'system',
    simplifiedInterface: false,
    language: 'en',
    highContrast: false,
    audioFeedbackEnabled: false,
    keyboardOnlyMode: false,
    preferredLanguage: 'en',
  },
};

export const MOCK_ADMIN: User = {
  id: 'adm-001',
  name: 'Platform Administrator',
  email: 'admin@gowow.demo',
  role: 'admin',
  accessibilityPreferences: {
    fontSize: 'default',
    contrast: 'standard',
    theme: 'dark',
    audioEnabled: false,
    speechRate: 'normal',
    readQuestions: true,
    readOptions: true,
    readInstructions: true,
    announceStatus: true,
    timerAnnouncements: 'warnings',
    keyboardFirst: false,
    screenReaderOptimized: false,
    reducedMotion: 'system',
    simplifiedInterface: false,
    language: 'en',
    highContrast: false,
    audioFeedbackEnabled: false,
    keyboardOnlyMode: false,
    preferredLanguage: 'en',
  },
};

export const MOCK_EXAMS: Exam[] = [
  {
    id: 'exam-upsc-csat-01',
    title: 'Civil Services CSAT Mock Examination 2026',
    description: 'Accessible General Studies Paper II practice suite with sonified data interpretation questions.',
    duration: 120,
    language: 'English',
    totalQuestions: 80,
    status: 'published',
    category: 'Competitive Public Service',
    passingMarks: 66,
    totalMarks: 200,
  },
  {
    id: 'exam-stem-grade10-01',
    title: 'Class 10 STEM Practice & Diagnostic Test',
    description: 'Interactive mathematical formulas and physics mechanics with descriptive ClearSpeak transcripts.',
    duration: 60,
    language: 'English',
    totalQuestions: 30,
    status: 'published',
    category: 'Secondary STEM',
    passingMarks: 40,
    totalMarks: 100,
  },
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q-stem-001',
    text: 'A car accelerates uniformly from rest at 2 m/s² for 5 seconds. What is its final velocity?',
    type: 'single_choice',
    options: [
      { id: 'opt-a', text: '5 m/s' },
      { id: 'opt-b', text: '10 m/s' },
      { id: 'opt-c', text: '20 m/s' },
      { id: 'opt-d', text: '25 m/s' },
    ],
    subject: 'Physics',
    topic: 'Linear Kinematics',
    difficulty: 'easy',
    explanation: 'Using the kinematic relation v = u + at, where u = 0, a = 2 m/s², and t = 5 s: v = 0 + (2)(5) = 10 m/s.',
    audioDescription: 'Question about velocity from rest with acceleration two meters per second squared over five seconds.',
  },
];

export const MOCK_ANALYTICS: Analytics = {
  score: 78,
  accuracy: 82.5,
  correct: 24,
  incorrect: 5,
  unanswered: 1,
  subjectPerformance: [
    { subject: 'Physics', score: 32, total: 40, accuracyPercentage: 80 },
    { subject: 'Mathematics', score: 28, total: 35, accuracyPercentage: 80 },
    { subject: 'Verbal Logic', score: 18, total: 25, accuracyPercentage: 72 },
  ],
  weakTopics: [
    {
      topic: 'Kinematic Equations in 2D',
      subject: 'Physics',
      accuracyPercentage: 45,
      recommendedPracticeUrl: '/candidate/practice?topic=kinematics-2d',
      rationale: 'Multiple attempts showed hesitation on resolving vertical velocity components.',
    },
    {
      topic: 'Percentage Word Problems',
      subject: 'Mathematics',
      accuracyPercentage: 55,
      recommendedPracticeUrl: '/candidate/practice?topic=percentages',
      rationale: 'Inverted ratio calculations in multi-step percentage change scenarios.',
    },
  ],
};
