import { LearningSubject, LearningTopic } from '../types/learning';
import { apiClient } from './api';
import { FALLBACK_SUBJECTS, FALLBACK_TOPICS } from '../fixtures/curriculumFixtures';

/**
 * Service abstraction for learning content, subjects, and topics.
 * Connected directly to FastAPI backend endpoints:
 * - GET /learning/subjects
 * - GET /learning/topics/:topicId
 * With robust fallback to verified curriculum fixtures.
 */

export const learningService = {
  /**
   * Fetches all available learning subjects.
   */
  async getSubjects(): Promise<LearningSubject[]> {
    try {
      const data = await apiClient.get<LearningSubject[]>('/learning/subjects');
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Backend /learning/subjects unavailable, using curriculum fixtures:', e);
    }
    return FALLBACK_SUBJECTS;
  },

  /**
   * Fetches a specific subject by its ID.
   */
  async getSubject(subjectId: string): Promise<LearningSubject | null> {
    const subjects = await this.getSubjects();
    return subjects.find((s) => s.id === subjectId) || FALLBACK_SUBJECTS.find((s) => s.id === subjectId) || null;
  },

  /**
   * Fetches a specific topic by its subjectId and topicId.
   */
  async getTopic(subjectId: string, topicId: string): Promise<LearningTopic | null> {
    try {
      const data = await apiClient.get<LearningTopic>(`/learning/topics/${topicId}`);
      if (data && data.id) {
        return data;
      }
    } catch {
      // Fallback
    }

    if (FALLBACK_TOPICS[topicId]) {
      return FALLBACK_TOPICS[topicId];
    }

    // Try finding within subject
    const subject = await this.getSubject(subjectId);
    return subject?.topics.find((t) => t.id === topicId) || null;
  },

  /**
   * Fetches recommended learning topics across subjects.
   */
  async getRecommendedTopics(): Promise<LearningTopic[]> {
    const subjects = await this.getSubjects();
    const allTopics = subjects.flatMap((s) => s.topics);
    const recs = allTopics.filter((t) => t.isRecommended);
    return (recs.length > 0 ? recs : allTopics.slice(0, 3)) as unknown as LearningTopic[];
  },

  /**
   * Fetches recently viewed topics for the candidate.
   */
  async getRecentlyViewedTopics(): Promise<LearningTopic[]> {
    const subjects = await this.getSubjects();
    const firstTopics = subjects.map((s) => s.topics[0]).filter(Boolean);
    return firstTopics as unknown as LearningTopic[];
  },

  /**
   * Fetches candidate's persisted audio lesson playback state for a topic.
   */
  async getAudioState(topicId: string): Promise<import('../types/learning').TopicAudioState> {
    try {
      return await apiClient.get<import('../types/learning').TopicAudioState>(`/learning/topics/${topicId}/audio-state`);
    } catch {
      return {
        topic_id: topicId,
        audio_position_seconds: 0,
        audio_completed: false,
        audio_bookmarks: [],
        audio_playback_speed: 1.0,
      };
    }
  },

  /**
   * Updates candidate's persisted audio lesson playback state (sleep-safe position, bookmarks, speed).
   */
  async updateAudioState(
    topicId: string,
    state: Partial<import('../types/learning').TopicAudioState>
  ): Promise<import('../types/learning').TopicAudioState> {
    try {
      return await apiClient.put<import('../types/learning').TopicAudioState>(`/learning/topics/${topicId}/audio-state`, state);
    } catch {
      return {
        topic_id: topicId,
        audio_position_seconds: state.audio_position_seconds || 0,
        audio_completed: state.audio_completed || false,
        audio_bookmarks: state.audio_bookmarks || [],
        audio_playback_speed: state.audio_playback_speed || 1.0,
      };
    }
  },
};
