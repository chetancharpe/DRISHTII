/**
 * Candidate Dashboard Domain Types for GoWow
 * Principles: Accessible, Actionable, Supportive, Independent.
 */

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  targetExam: string;
  avatarUrl?: string;
  role: 'candidate';
}

export interface NextActionItem {
  id: string;
  title: string;
  subject: string;
  topic: string;
  completedQuestions: number;
  totalQuestions: number;
  estimatedMinutesRemaining: number;
  ctaLabel: string;
  ctaRoute: string;
}

export interface DailyGoal {
  questionsCompleted: number;
  questionsTarget: number;
  timeMinutesPracticed: number;
  targetMinutes: number;
  topicsCompleted: number;
  topicsTarget: number;
  streakDays: number;
  streakSupportiveMessage: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  route: string;
  iconName: 'practice' | 'mock' | 'exams' | 'results';
  badge?: string;
}

export interface DashboardStats {
  overallProgressPercent: number;
  questionsPracticedCount: number;
  mockTestsCompletedCount: number;
  averageScorePercent: number;
}

export interface SubjectProgressItem {
  id: string;
  subject: string;
  progressPercent: number;
  masteredTopics: number;
  totalTopics: number;
  practiceRoute: string;
}

export interface LearningProgressItem {
  id: string;
  subject: string;
  topic: string;
  completedLessons: number;
  totalLessons: number;
  nextLessonTitle: string;
  continueRoute: string;
}

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface PracticeRecommendationItem {
  id: string;
  subject: string;
  topic: string;
  questionCount: number;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  practiceRoute: string;
}

export interface MockTestDashboardItem {
  id: string;
  title: string;
  questionCount: number;
  durationMinutes: number;
  difficulty: DifficultyLevel;
  accessibilitySupport: string;
  testRoute: string;
  isNew?: boolean;
}

export interface UpcomingExamDashboardItem {
  id: string;
  title: string;
  dateFormatted: string;
  durationMinutes: number;
  status: 'Scheduled' | 'Registration Open' | 'Admit Card Available';
  detailsRoute: string;
  registrationNumber?: string;
}

export interface PerformanceRecordItem {
  id: string;
  testTitle: string;
  scorePercent: number;
  dateFormatted: string;
  isPassed: boolean;
  viewRoute: string;
}

export interface PerformanceTrendData {
  testLabels: string[];
  scores: number[];
  textAlternative: string;
  trendDescription: string;
}

export interface WeakAreaTopicItem {
  id: string;
  topic: string;
  subject: string;
  accuracyPercent: number;
  practiceRoute: string;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  timestamp: string;
  type: 'practice' | 'mock' | 'review' | 'milestone';
}

export interface CandidateDashboardData {
  profile: CandidateProfile;
  nextAction: NextActionItem;
  dailyGoal: DailyGoal;
  quickActions: QuickActionItem[];
  overviewStats: DashboardStats;
  subjectProgress: SubjectProgressItem[];
  continueLearning: LearningProgressItem | null;
  recommendations: PracticeRecommendationItem[];
  mockTests: MockTestDashboardItem[];
  upcomingExams: UpcomingExamDashboardItem[];
  recentPerformance: PerformanceRecordItem[];
  performanceTrend: PerformanceTrendData;
  weakAreas: WeakAreaTopicItem[];
  recentActivity: RecentActivityItem[];
  isOfflineFallback?: boolean;
  fallbackMessage?: string;
}
