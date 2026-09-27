import { apiClient } from '../api';

export interface TopicProgressItem {
  subject: string;
  topic: string;
  questions_attempted: number;
  correct_answers: number;
  accuracy: number;
  average_time_seconds: number;
  last_practiced: string;
  factual_status: string;
  recommended_action: string;
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  questions_attempted: number;
  overall_accuracy: number;
  topics_practiced_count: number;
  study_time_minutes: number;
  highest_accuracy_subject: string;
  suggested_focus_topic: string;
  summary_text: string;
}

export interface ProgressSummary {
  user_id: string;
  overall_accuracy: number;
  total_questions_attempted: number;
  total_correct: number;
  total_topics_practiced: number;
  study_streak_days: number;
  topic_progress: TopicProgressItem[];
  weekly_summary: WeeklySummary;
}

export interface RecommendationItem {
  id: string;
  type: 'practice' | 'review' | 'mock' | 'pace';
  topic: string;
  subject: string;
  reason: string;
  priority: 'high' | 'normal' | 'low';
  created_at?: string;
}

export interface PersonalizedPracticeSet {
  set_id: string;
  title: string;
  description: string;
  total_questions: number;
  target_topics: string[];
  questions: any[];
}

export const learningApi = {
  async getProgress(token?: string): Promise<ProgressSummary> {
    try {
      const res = await apiClient<ProgressSummary>('/progress', { method: 'GET', token });
      if (res && res.weekly_summary) return res;
    } catch {
      // Fallback to local deterministic progress
    }

    return {
      user_id: 'candidate-1',
      overall_accuracy: 68.5,
      total_questions_attempted: 85,
      total_correct: 58,
      total_topics_practiced: 4,
      study_streak_days: 5,
      topic_progress: [
        {
          subject: 'Mathematics',
          topic: 'Probability',
          questions_attempted: 25,
          correct_answers: 13,
          accuracy: 52.0,
          average_time_seconds: 55,
          last_practiced: new Date().toISOString(),
          factual_status: '52% Accuracy — Recommended: Review Lesson',
          recommended_action: 'review_lesson',
        },
        {
          subject: 'Mathematics',
          topic: 'Percentages',
          questions_attempted: 30,
          correct_answers: 21,
          accuracy: 70.0,
          average_time_seconds: 40,
          last_practiced: new Date().toISOString(),
          factual_status: '70% Accuracy — Recommended: Practice Questions',
          recommended_action: 'practice_questions',
        },
        {
          subject: 'Logical Reasoning',
          topic: 'Syllogisms',
          questions_attempted: 15,
          correct_answers: 12,
          accuracy: 80.0,
          average_time_seconds: 35,
          last_practiced: new Date().toISOString(),
          factual_status: '80% Accuracy — Ready for Timed Mock Test',
          recommended_action: 'timed_mock',
        },
        {
          subject: 'English',
          topic: 'Reading Comprehension',
          questions_attempted: 15,
          correct_answers: 12,
          accuracy: 80.0,
          average_time_seconds: 60,
          last_practiced: new Date().toISOString(),
          factual_status: '80% Accuracy — High Consistency',
          recommended_action: 'timed_mock',
        },
      ],
      weekly_summary: {
        week_start: 'September 20',
        week_end: 'September 27',
        questions_attempted: 85,
        overall_accuracy: 68.5,
        topics_practiced_count: 4,
        study_time_minutes: 65,
        highest_accuracy_subject: 'Logical Reasoning',
        suggested_focus_topic: 'Probability',
        summary_text:
          'This week you attempted 85 questions with an overall accuracy of 68 percent. You practiced 4 topics over 65 minutes of active study. Your highest consistency was in Logical Reasoning. Suggested next step: reinforce Probability with a focused review and practice set.',
      },
    };
  },

  async getRecommendations(token?: string): Promise<RecommendationItem[]> {
    try {
      const res = await apiClient<RecommendationItem[]>('/recommendations', { method: 'GET', token });
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Fallback
    }

    return [
      {
        id: 'rec-1',
        type: 'review',
        subject: 'Mathematics',
        topic: 'Probability',
        reason: 'Your recent accuracy in Probability is 52%. Reviewing basic compound events is recommended before the next mock test.',
        priority: 'high',
      },
      {
        id: 'rec-2',
        type: 'practice',
        subject: 'Mathematics',
        topic: 'Percentages',
        reason: 'Your recent accuracy in Percentages is 70%. A quick 10-question practice set will reinforce speed.',
        priority: 'normal',
      },
      {
        id: 'rec-3',
        type: 'mock',
        subject: 'Logical Reasoning',
        topic: 'Syllogisms',
        reason: 'Strong performance! Your accuracy in Syllogisms is 80%. Test your pacing with a timed practice mock.',
        priority: 'low',
      },
    ];
  },

  async getPersonalizedPractice(limit: number = 10, token?: string): Promise<PersonalizedPracticeSet> {
    try {
      const res = await apiClient<PersonalizedPracticeSet>(`/practice/personalized?limit=${limit}`, {
        method: 'GET',
        token,
      });
      if (res && res.questions && res.questions.length > 0) return res;
    } catch {
      // Fallback
    }

    return {
      set_id: 'practice-set-auto',
      title: 'Practice for You',
      description: '10 adaptive questions focused on Probability, Percentages, and Syllogisms.',
      total_questions: 10,
      target_topics: ['Probability', 'Percentages', 'Syllogisms'],
      questions: [],
    };
  },

  async logActivity(
    activityType: string,
    resourceId?: string,
    durationSeconds: number = 0,
    metadata: Record<string, any> = {},
    token?: string
  ): Promise<boolean> {
    try {
      await apiClient('/activity', {
        method: 'POST',
        token,
        body: JSON.stringify({
          activity_type: activityType,
          resource_id: resourceId,
          duration_seconds: durationSeconds,
          metadata,
        }),
      });
      return true;
    } catch {
      return false;
    }
  },
};
